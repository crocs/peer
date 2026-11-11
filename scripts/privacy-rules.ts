import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { companyForHost } from "../lib/catalog";
import { subresources, type NetworkRule, type Condition } from "../lib/network";

const hostPattern = /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
const typeNames: Record<string, string> = {
  subdocument: "sub_frame",
  document: "main_frame",
};

function parse(line: string): Condition | undefined {
  if (/^\/.*\/(?:\$[^/]*|)$/.test(line)) return;
  const [pattern, flags = ""] = line.split("$");
  if (!pattern || /[^!-~]/.test(pattern) || pattern.startsWith("||*")) return;
  const condition: Condition = {};
  const included: string[] = [];
  const excluded = new Set<string>();
  for (const flag of flags.split(",").filter(Boolean)) {
    if (flag === "third-party" || flag === "~third-party") {
      condition.domainType =
        flag === "third-party" ? "thirdParty" : "firstParty";
    } else if (flag.startsWith("domain=")) {
      const sites = flag.slice(7).split("|");
      if (sites.some((site) => !hostPattern.test(site.replace(/^~/, ""))))
        return;
      const allow = sites.filter((site) => !site.startsWith("~"));
      const skip = sites
        .filter((site) => site.startsWith("~"))
        .map((site) => site.slice(1));
      if (allow.length) condition.initiatorDomains = allow;
      if (skip.length) condition.excludedInitiatorDomains = skip;
    } else {
      const negated = flag.startsWith("~");
      const name = negated ? flag.slice(1) : flag;
      const kind = typeNames[name] ?? name;
      if (kind !== "main_frame" && !subresources.includes(kind)) return;
      if (negated) excluded.add(kind);
      else included.push(kind);
    }
  }
  const kinds = (included.length ? included : subresources).filter(
    (type) => type !== "main_frame" && !excluded.has(type),
  );
  if (!kinds.length) return;
  if (kinds.length !== subresources.length) condition.resourceTypes = kinds;
  condition.urlFilter = pattern;
  return condition;
}

export async function buildPrivacyRules() {
  const source = (await readFile("data/easyprivacy.txt", "utf8")).replace(
    /\r\n/g,
    "\n",
  );
  const cname = JSON.parse(await readFile("data/cname.json", "utf8")) as {
    revision: string;
    lists: Record<string, string[]>;
  };
  const lines = source.split("\n");
  const disabled = new Set(
    lines
      .filter((line) => /(?:\$|,)badfilter(?:,|$)/.test(line))
      .map((line) =>
        line.replace(/(\$|,)badfilter(,|$)/, (_, before, after) =>
          after ? before : "",
        ),
      ),
  );
  const rules: NetworkRule[] = [];
  const ruleOwners: Record<number, string> = {};
  const domains = new Set<string>();
  const batches = new Map<string, Set<string>>();
  const cnameRuleIds: number[] = [];
  function addDomain(host: string, owner: string, thirdParty: boolean) {
    const key = `${owner}:${thirdParty ? "third" : "any"}`;
    if (!batches.has(key)) batches.set(key, new Set());
    batches.get(key)!.add(host);
    domains.add(host);
  }
  function add(condition: Condition, owner?: string) {
    const id = rules.length + 1;
    const priority = owner ? (owner === "other" ? 1 : 2) : 10;
    if (owner) ruleOwners[id] = owner;
    rules.push({
      id,
      priority,
      action: { type: owner ? "block" : "allow" },
      condition,
    });
  }
  let conditionalDepth = 0;
  let paths = 0;
  let exceptions = 0;
  const seen = new Set<string>();
  for (const line of lines) {
    if (/^!\s*#if\b/.test(line)) conditionalDepth++;
    if (/^!\s*#endif\b/.test(line)) conditionalDepth--;
    if (
      !line ||
      line.startsWith("!") ||
      line.startsWith("[") ||
      /#(?:[@?$%]?#|\$)/.test(line) ||
      disabled.has(line) ||
      seen.has(line)
    )
      continue;
    const allow = line.startsWith("@@");
    // Engine-specific scripts, redirects and cosmetic rules cannot be network blocks.
    if (conditionalDepth && !allow) continue;
    seen.add(line);
    const body = allow ? line.slice(2) : line;
    if (/\$[^$]*\b(?:redirect-rule|badfilter)\b/.test(body)) continue;
    const condition = parse(body);
    if (!condition) {
      if (allow) throw new Error(`Unsupported tracking exception: ${line}`);
      continue;
    }
    const broad = /^\|\|([a-z0-9.-]+)\^(?:\$third-party)?$/.exec(body);
    if (!allow && broad && hostPattern.test(broad[1]!)) {
      addDomain(broad[1]!, companyForHost(broad[1]!) ?? "other", true);
      continue;
    }
    const host = /^\|\|([a-z0-9.-]+)[/^]/i.exec(body)?.[1];
    add(
      condition,
      allow ? undefined : (host && companyForHost(host)) || "other",
    );
    if (allow) exceptions++;
    else paths++;
  }
  if (
    conditionalDepth !== 0 ||
    paths < 3000 ||
    exceptions < 500 ||
    domains.size < 10000
  )
    throw new Error("Unexpected EasyPrivacy network data");
  const aliases = new Set<string>();
  for (const [provider, hosts] of Object.entries(cname.lists)) {
    const owner = provider.startsWith("adobe-")
      ? "adobe"
      : provider === "criteo"
        ? "criteo"
        : "other";
    for (const host of hosts) {
      aliases.add(host);
      addDomain(host, owner, false);
    }
  }
  for (const [key, batch] of batches) {
    const [owner, scope] = key.split(":");
    const hosts = [...batch].sort();
    for (let offset = 0; offset < hosts.length; offset += 500) {
      add(
        {
          requestDomains: hosts.slice(offset, offset + 500),
          ...(scope === "third" ? { domainType: "thirdParty" } : {}),
        },
        owner,
      );
      if (scope === "any") cnameRuleIds.push(rules.length);
    }
  }
  if (rules.length + 100 > 30000)
    throw new Error("Static rule budget exceeded");
  const updated = lines
    .find((line) => line.startsWith("! Last modified:"))
    ?.slice(16)
    .trim();
  await writeFile("public/rules/privacy.json", JSON.stringify(rules));
  await writeFile(
    "public/rules/coverage.json",
    JSON.stringify({
      domains: domains.size,
      updated,
      source: "EasyPrivacy + AdGuard",
      ruleOwners,
      cnameRuleIds,
    }),
  );
  await writeFile(
    "public/rules/ADGUARD-LICENSE.txt",
    await readFile("data/adguard-LICENSE.txt"),
  );
  await writeFile(
    "public/rules/SOURCES.txt",
    [
      "EasyPrivacy by the EasyList authors — CC BY-SA 3.0",
      "https://easylist.to/easylist/easyprivacy.txt",
      `Updated: ${updated}`,
      `SHA-256: ${createHash("sha256").update(source).digest("hex")}`,
      "Adapted network filters and exceptions for Chromium subresource requests.",
      "",
      "CNAME-cloaked trackers by AdGuard — MIT (see ADGUARD-LICENSE.txt)",
      `https://github.com/AdguardTeam/cname-trackers/tree/${cname.revision}/data/trackers`,
      "Selected analytics and advertising providers; validated cross-site aliases grouped for native filtering.",
      "",
      "Application source and pinned data: https://github.com/crocs/peer",
      "",
    ].join("\n"),
  );
  console.log(
    `${domains.size} distinct domain entries · ${aliases.size} tracking aliases · ${paths} contextual filters · ${exceptions} exceptions · ${rules.length} native rules`,
  );
}
