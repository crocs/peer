import { getDomain } from "tldts";
import { catalogRules, type NetworkRule } from "./network";
import { serviceByRuleId } from "./catalog";

export interface Coverage {
  source: string;
  updated: string;
  domains: number;
  ruleOwners: Record<number, string>;
  cnameRuleIds: number[];
}

type Candidate = {
  rule: NetworkRule;
  owner?: string;
  source: "catalog" | "easyPrivacy" | "cname";
  matches?: (url: string, hostname: string) => boolean;
};

function suffixes(host: string) {
  return host.split(".").map((_, i, labels) => labels.slice(i).join("."));
}

// Match each wildcard-delimited piece separately so long URLs never trigger
// backtracking across a chain of wildcards.
function compilePattern(filter: string) {
  if (!/[|*^]/.test(filter)) {
    const literal = filter.toLowerCase();
    return (url: string) => url.includes(literal);
  }
  const domainAnchor = filter.startsWith("||");
  const start = filter.startsWith("|");
  const end = filter.endsWith("|");
  const pattern = filter.slice(
    domainAnchor ? 2 : start ? 1 : 0,
    end ? -1 : undefined,
  );
  const chunks = pattern.split("*");
  const pieces = chunks.map((chunk, index) => {
    const literal = chunk
      .split("^")
      .map((part) => part.replace(/[.*+?^$\x7b\x7d()|[\]\\]/g, "\\$&"));
    const source = literal.join("(?:[^a-z0-9_.%-]|$)");
    return new RegExp(
      source + (end && index === chunks.length - 1 ? "$" : ""),
      "gi",
    );
  });
  function from(url: string, offset: number) {
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i]!;
      piece.lastIndex = offset;
      const match = piece.exec(url);
      if (!match || (i === 0 && start && match.index !== offset)) return false;
      offset = piece.lastIndex;
    }
    return true;
  }
  return (url: string, hostname: string) => {
    if (!domainAnchor) return from(url, 0);
    const authority = url.indexOf("://") + 3;
    const startOfHost = url.indexOf(hostname, authority);
    if (startOfHost < authority) return false;
    let offset = startOfHost;
    const limit = startOfHost + hostname.length;
    while (offset < limit) {
      if (from(url, offset)) return true;
      const dot = url.indexOf(".", offset);
      if (dot < 0 || dot >= limit) break;
      offset = dot + 1;
    }
    return false;
  };
}

export function createMatcher(coverage: Coverage, rules: NetworkRule[]) {
  const byHost = new Map<string, Candidate[]>();
  const byToken = new Map<number, Candidate[]>();
  // URLs and native filters use ASCII. Pack four bytes into one lookup key.
  function tokenAt(value: string, i: number) {
    return (
      (value.charCodeAt(i) << 24) |
      (value.charCodeAt(i + 1) << 16) |
      (value.charCodeAt(i + 2) << 8) |
      value.charCodeAt(i + 3)
    );
  }
  const general: Candidate[] = [];
  function index<K>(map: Map<K, Candidate[]>, key: K, candidate: Candidate) {
    const bucket = map.get(key);
    if (bucket) bucket.push(candidate);
    else map.set(key, [candidate]);
  }
  function register(
    rule: NetworkRule,
    owner: string | undefined,
    source: Candidate["source"],
  ) {
    const candidate: Candidate = { rule, owner, source };
    const filter = rule.condition.urlFilter;
    if (rule.condition.requestDomains) {
      for (const host of rule.condition.requestDomains)
        index(byHost, host, candidate);
      return;
    }
    if (!filter) throw new Error("Missing network rule target");
    const anchor = /^\|\|([a-z0-9.-]+)[/^:]/i.exec(filter);
    if (anchor) {
      index(byHost, anchor[1]!.toLowerCase(), candidate);
      return;
    }
    const literal = filter
      .toLowerCase()
      .split(/[|*^]/)
      .sort((a, b) => b.length - a.length)[0]!;
    if (literal.length < 4) general.push(candidate);
    else {
      // Pick a mandatory four-character token with a small candidate bucket.
      let token = tokenAt(literal, 0);
      for (let i = 1; i <= literal.length - 4; i++) {
        const alternative = tokenAt(literal, i);
        if (
          (byToken.get(alternative)?.length ?? 0) <
          (byToken.get(token)?.length ?? 0)
        )
          token = alternative;
      }
      index(byToken, token, candidate);
    }
  }
  const aliases = new Set(coverage.cnameRuleIds);
  for (const rule of rules)
    register(
      rule,
      coverage.ruleOwners[rule.id],
      aliases.has(rule.id) ? "cname" : "easyPrivacy",
    );
  for (const rule of catalogRules)
    register(rule, serviceByRuleId.get(rule.id)!.companyId, "catalog");

  const siteCache = new Map<string, string>();
  function site(host: string) {
    let value = siteCache.get(host);
    if (!value) {
      value = getDomain(host, { allowPrivateDomains: true }) || host;
      if (siteCache.size >= 2000) siteCache.clear();
      siteCache.set(host, value);
    }
    return value;
  }
  return (raw: string, initiator: string | undefined, type: string) => {
    if (type === "main_frame") return;
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return;
    }
    let origin = "";
    if (initiator && initiator !== "null") {
      try {
        origin = new URL(initiator).hostname;
      } catch {
        /* Opaque initiator. */
      }
    }
    if (url.hash) url.hash = "";
    if (url.username) url.username = "";
    if (url.password) url.password = "";
    const href = url.href.toLowerCase();
    const candidates = new Set(general);
    for (const host of suffixes(url.hostname))
      for (const candidate of byHost.get(host) ?? []) candidates.add(candidate);
    for (let i = 0; i <= href.length - 4; i++) {
      const bucket = byToken.get(tokenAt(href, i));
      if (bucket) for (const candidate of bucket) candidates.add(candidate);
    }

    const origins = suffixes(origin);
    const firstParty = !!origin && site(url.hostname) === site(origin);
    let best: Candidate | undefined;
    for (const entry of candidates) {
      const { condition, priority } = entry.rule;
      if (best && priority <= best.rule.priority) continue;
      if (condition.resourceTypes && !condition.resourceTypes.includes(type))
        continue;
      if (
        condition.domainType &&
        (condition.domainType === "firstParty") !== firstParty
      )
        continue;
      if (
        condition.initiatorDomains &&
        !condition.initiatorDomains.some((host) => origins.includes(host))
      )
        continue;
      if (
        condition.excludedInitiatorDomains?.some((host) =>
          origins.includes(host),
        )
      )
        continue;
      if (condition.urlFilter) {
        entry.matches ??= compilePattern(condition.urlFilter);
        if (!entry.matches(href, url.hostname)) continue;
      }
      best = entry;
    }
    if (best?.owner) return best;
  };
}
