import { browser } from "wxt/browser";
import { companies, serviceByRuleId, services } from "../lib/catalog";
import { createMatcher, type Coverage } from "../lib/coverage";
import type { NetworkRule } from "../lib/network";
import {
  restoreSettings,
  endpointException,
  isHostname,
  dayKey,
  HISTORY_KEY,
  SESSION_KEY,
  SETTINGS_KEY,
} from "../lib/settings";
import type {
  CompanyActivity,
  History,
  Message,
  PageMessage,
  Settings,
  Snapshot,
  TabState,
} from "../lib/types";

export default defineBackground(() => {
  let settings: Settings;
  let history: History = {};
  let historyChanged = false;
  let tabs: Record<string, TabState> = {};
  let chain = Promise.resolve();
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  const verificationRetryAt = new Map<number, number>();
  const activityTimes = new Map<number, number>();
  const seenRequests = new WeakMap<TabState, Set<string>>();
  let coverage: Coverage;
  let matchRequest: ReturnType<typeof createMatcher>;

  const ready = (async () => {
    const readBundled = async <T>(path: string): Promise<T> => {
      const response = await fetch(chrome.runtime.getURL(path));
      if (!response.ok)
        throw new Error("Could not load the bundled tracker catalog");
      return response.json();
    };
    const [local, session, bundledCoverage, networkRules] = await Promise.all([
      browser.storage.local.get([SETTINGS_KEY, HISTORY_KEY]),
      browser.storage.session.get(SESSION_KEY),
      readBundled<Coverage>("/rules/coverage.json"),
      readBundled<NetworkRule[]>("/rules/privacy.json"),
    ]);
    settings = restoreSettings(local[SETTINGS_KEY]);
    coverage = bundledCoverage;
    matchRequest = createMatcher(coverage, networkRules);
    if (
      !Array.isArray(
        (local[SETTINGS_KEY] as Partial<Settings> | undefined)
          ?.allowedEndpoints,
      )
    )
      await browser.storage.local.set({ [SETTINGS_KEY]: settings });
    history = (local[HISTORY_KEY] as History | undefined) || {};
    tabs = (session[SESSION_KEY] as Record<string, TabState> | undefined) || {};
    pruneHistory();
    const open = new Set((await browser.tabs.query({})).map((tab) => tab.id));
    for (const key of Object.keys(tabs))
      if (!open.has(Number(key))) delete tabs[key];
    await applyRules(settings);
    await browser.declarativeNetRequest.setExtensionActionOptions?.({
      displayActionCountAsBadgeText: true,
    });
    await browser.action.setBadgeBackgroundColor({ color: "#e5e5e9" });
    await browser.action.setBadgeTextColor?.({ color: "#383940" });
  })();

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = chain.then(async () => {
      await ready;
      return task();
    });
    chain = result.then(
      () => {},
      (error) =>
        console.error(
          "peer:",
          error instanceof Error ? error.message : "An operation failed",
        ),
    );
    return result;
  }

  function pruneHistory() {
    const oldest = new Date();
    oldest.setDate(oldest.getDate() - 6);
    const cutoff = dayKey(oldest);
    for (const key of Object.keys(history))
      if (key < cutoff) {
        delete history[key];
        historyChanged = true;
      }
  }

  async function persist() {
    pruneHistory();
    await Promise.all([
      browser.storage.session.set({ [SESSION_KEY]: tabs }),
      historyChanged && browser.storage.local.set({ [HISTORY_KEY]: history }),
    ]);
    historyChanged = false;
  }

  function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      void enqueue(persist);
    }, 200);
  }

  async function applyRules(next: Settings) {
    await browser.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: next.blocking ? ["trackers", "privacy"] : [],
      disableRulesetIds: next.blocking ? [] : ["trackers", "privacy"],
    });
    const previous = await browser.declarativeNetRequest.getDynamicRules();
    const addRules: chrome.declarativeNetRequest.Rule[] = [];
    if (next.blocking) {
      next.allowedEndpoints.forEach(({ site, host }, index) => {
        addRules.push({
          id: 200000 + index,
          priority: 50,
          action: {
            type: "allow" as chrome.declarativeNetRequest.RuleActionType,
          },
          condition: { initiatorDomains: [site], requestDomains: [host] },
        });
      });
      next.pausedSites.forEach((host, index) => {
        addRules.push(
          {
            id: 100000 + index * 2,
            priority: 100,
            action: {
              type: "allowAllRequests" as chrome.declarativeNetRequest.RuleActionType,
            },
            condition: {
              requestDomains: [host],
              resourceTypes: [
                "main_frame" as chrome.declarativeNetRequest.ResourceType,
              ],
            },
          },
          {
            id: 100001 + index * 2,
            priority: 100,
            action: {
              type: "allow" as chrome.declarativeNetRequest.RuleActionType,
            },
            condition: { initiatorDomains: [host] },
          },
        );
      });
    }
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: previous.map((rule) => rule.id),
      addRules,
    });
  }

  function isPaused(host: string) {
    return settings.pausedSites.some(
      (site) => host === site || host.endsWith(`.${site}`),
    );
  }

  async function tellPage(tabId: number, message: PageMessage) {
    await browser.tabs.sendMessage(tabId, message).catch(() => {});
  }

  async function broadcastSettings() {
    const openTabs = await browser.tabs.query({});
    await Promise.all(
      openTabs
        .filter((tab) => tab.id !== undefined)
        .map((tab) => {
          let host = "";
          try {
            host = new URL(tab.url || "").hostname;
          } catch {
            /* Browser-owned pages have no site. */
          }
          return tellPage(tab.id!, {
            type: "PEER_STATE",
            blocking: settings.blocking,
            cleanLinks: settings.cleanLinks,
            eyes: settings.eyes,
            paused: isPaused(host),
            language: settings.language,
          });
        }),
    );
  }

  function visit(state: TabState) {
    if (!settings.history || state.incognito || !state.host) return;
    const day = dayKey();
    history[day] ??= Object.create(null);
    if (!Object.hasOwn(history[day]!, state.host)) {
      historyChanged = true;
      Object.defineProperty(history[day]!, state.host, {
        value: { companies: {} },
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }

  function syncHistory(state: TabState) {
    if (!settings.history || state.incognito) return;
    visit(state);
    const site = history[dayKey()]![state.host]!;
    for (const item of Object.values(state.activity)) {
      const previous = state.historyApplied[item.companyId] || {
        observed: 0,
        blocked: 0,
      };
      const observed = Math.max(0, item.observed - previous.observed);
      const blocked = Math.max(0, item.blocked - previous.blocked);
      if (observed || blocked) {
        historyChanged = true;
        const target = (site.companies[item.companyId] ??= {
          observed: 0,
          blocked: 0,
        });
        target.observed += observed;
        target.blocked += blocked;
      }
      state.historyApplied[item.companyId] = {
        observed: item.observed,
        blocked: item.blocked,
      };
    }
  }

  async function makeState(
    tabId: number,
    raw?: string,
    startedAt = Date.now(),
  ): Promise<TabState | undefined> {
    const tab = await browser.tabs.get(tabId).catch(() => undefined);
    if (!tab) return;
    let host: string;
    try {
      const url = new URL(raw || tab.url || "");
      if (!["http:", "https:"].includes(url.protocol)) return;
      host = url.hostname;
    } catch {
      return;
    }
    const state: TabState = {
      tabId,
      host,
      startedAt,
      incognito: !!tab.incognito,
      activity: {},
      requestIds: [],
      blockedAvailable: false,
      verifiedAt: 0,
      historyApplied: {},
    };
    tabs[tabId] = state;
    visit(state);
    scheduleSave();
    return state;
  }

  function getActivity(state: TabState, companyId: string): CompanyActivity {
    return (state.activity[companyId] ??= {
      companyId,
      observed: 0,
      blocked: 0,
      domains: [],
    });
  }

  async function observe(details: {
    tabId: number;
    url: string;
    requestId: string;
    timeStamp: number;
    type: string;
    initiator?: string;
    originUrl?: string;
  }) {
    if (details.tabId < 0) return;
    if (details.type === "main_frame") {
      await makeState(details.tabId, details.url, details.timeStamp);
      return;
    }
    const state =
      tabs[details.tabId] ||
      (await makeState(details.tabId, undefined, details.timeStamp));
    if (!state) return;
    if (details.timeStamp < state.startedAt) return;
    let seen = seenRequests.get(state);
    if (seen?.has(details.requestId)) return;
    const match = matchRequest(
      details.url,
      details.initiator ?? details.originUrl,
      details.type,
    );
    if (!match?.owner) return;
    if (!seen) {
      seen = new Set(state.requestIds);
      seenRequests.set(state, seen);
      if (seen.has(details.requestId)) return;
    }
    seen.add(details.requestId);
    state.requestIds.push(details.requestId);
    if (state.requestIds.length > 2000)
      for (const id of state.requestIds.splice(0, 200)) seen.delete(id);
    const item = getActivity(state, match.owner);
    item.observed++;
    const host = new URL(details.url).hostname;
    item.example = {
      host,
      source: match.source,
      pattern: match.rule.condition.urlFilter,
    };
    if (item.domains.length < 100 && !item.domains.includes(host))
      item.domains.push(host);
    syncHistory(state);
    scheduleSave();
    const last = activityTimes.get(details.tabId) || 0;
    if (settings.eyes && Date.now() - last > 450) {
      activityTimes.set(details.tabId, Date.now());
      void tellPage(details.tabId, { type: "PEER_ACTIVITY" });
    }
  }

  async function verifyBlocked(state: TabState, refresh = false) {
    if (import.meta.env.FIREFOX) return;
    const now = Date.now();
    if (!refresh && now - state.verifiedAt < 35000) return;
    if (!refresh && now < (verificationRetryAt.get(state.tabId) || 0)) return;
    try {
      const result = await browser.declarativeNetRequest.getMatchedRules({
        tabId: state.tabId,
        minTimeStamp: state.startedAt,
      });
      const previousBlocked = Object.values(state.activity).reduce(
        (sum, item) => sum + item.blocked,
        0,
      );
      const counts = new Map<string, number>();
      for (const match of result.rulesMatchedInfo) {
        const service =
          match.rule.rulesetId === "trackers"
            ? serviceByRuleId.get(match.rule.ruleId)
            : undefined;
        const companyId =
          service?.companyId ||
          (match.rule.rulesetId === "privacy"
            ? coverage.ruleOwners[match.rule.ruleId]
            : undefined);
        if (!companyId) continue;
        counts.set(companyId, (counts.get(companyId) || 0) + 1);
      }
      for (const [companyId, count] of counts) {
        const item = getActivity(state, companyId);
        item.blocked = Math.max(item.blocked, count);
      }
      state.blockedAvailable = true;
      state.verifiedAt = now;
      verificationRetryAt.delete(state.tabId);
      if (
        settings.eyes &&
        Object.values(state.activity).reduce(
          (sum, item) => sum + item.blocked,
          0,
        ) > previousBlocked
      ) {
        void tellPage(state.tabId, { type: "PEER_BLOCKED" });
      }
      syncHistory(state);
      scheduleSave();
    } catch {
      verificationRetryAt.set(state.tabId, now + 35000);
      state.blockedAvailable = false;
    }
  }

  async function targetTab(tabId?: number) {
    if (tabId !== undefined && Number.isInteger(tabId))
      return browser.tabs.get(tabId).catch(() => undefined);
    const active = (
      await browser.tabs.query({ active: true, lastFocusedWindow: true })
    )[0];
    if (active && !active.url?.startsWith(chrome.runtime.getURL("")))
      return active;
    const available = (await browser.tabs.query({ lastFocusedWindow: true }))
      .filter((tab) => /^https?:\/\//.test(tab.url || ""))
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
    return available[0] || active;
  }

  async function snapshot(tabId?: number, refresh = false): Promise<Snapshot> {
    pruneHistory();
    const tab = await targetTab(tabId);
    let host = "";
    let supported = false;
    try {
      const url = new URL(tab?.url || "");
      host = url.hostname;
      supported =
        ["http:", "https:"].includes(url.protocol) &&
        host !== "chromewebstore.google.com" &&
        !(
          import.meta.env.EDGE &&
          host === "microsoftedge.microsoft.com" &&
          url.pathname.startsWith("/addons")
        ) &&
        !(import.meta.env.FIREFOX && host === "addons.mozilla.org");
    } catch {
      /* No page is selected. */
    }
    let state = tab?.id !== undefined ? tabs[tab.id] : undefined;
    if (tab?.id !== undefined && supported && (!state || state.host !== host))
      state = await makeState(tab.id, tab.url, 0);
    if (state && supported && settings.blocking)
      await verifyBlocked(state, refresh);
    return {
      settings,
      tab:
        tab?.id !== undefined
          ? {
              id: tab.id,
              host,
              url: supported ? tab.url || "" : "",
              supported,
              incognito: !!tab.incognito,
            }
          : null,
      activity:
        state && supported
          ? Object.values(state.activity).sort(
              (a, b) =>
                Math.max(b.observed, b.blocked) -
                Math.max(a.observed, a.blocked),
            )
          : [],
      blockedAvailable: state?.blockedAvailable || false,
      paused: isPaused(host),
      history,
      catalogCompanies: companies.length,
      catalogRules: services.length,
      coverage: {
        domains: coverage.domains,
        updated: coverage.updated,
        source: coverage.source,
      },
    };
  }

  async function updateSettings(
    patch: Partial<Settings>,
    allowedEndpoints = settings.allowedEndpoints,
  ) {
    const next = { ...settings };
    next.allowedEndpoints = allowedEndpoints;
    if (typeof patch.blocking === "boolean") next.blocking = patch.blocking;
    if (typeof patch.cleanLinks === "boolean")
      next.cleanLinks = patch.cleanLinks;
    if (typeof patch.eyes === "boolean") next.eyes = patch.eyes;
    if (typeof patch.history === "boolean") next.history = patch.history;
    if (patch.language === "en" || patch.language === "ru")
      next.language = patch.language;
    if (Array.isArray(patch.pausedSites)) {
      next.pausedSites = [...new Set(patch.pausedSites)]
        .filter(isHostname)
        .slice(0, 1000);
    }
    const previous = settings;
    try {
      if (
        next.blocking !== previous.blocking ||
        allowedEndpoints !== previous.allowedEndpoints ||
        JSON.stringify(next.pausedSites) !==
          JSON.stringify(previous.pausedSites)
      )
        await applyRules(next);
      await browser.storage.local.set({ [SETTINGS_KEY]: next });
      settings = next;
    } catch (error) {
      await applyRules(previous).catch(() => {});
      throw error;
    }
    if (next.history !== previous.history) {
      for (const state of Object.values(tabs)) {
        state.historyApplied = Object.fromEntries(
          Object.values(state.activity).map((item) => [
            item.companyId,
            { observed: item.observed, blocked: item.blocked },
          ]),
        );
      }
    }
    await broadcastSettings();
    scheduleSave();
    return settings;
  }

  browser.webRequest.onBeforeRequest.addListener(
    (details) => {
      void enqueue(() => observe(details));
    },
    { urls: ["http://*/*", "https://*/*"] },
  );

  browser.webRequest.onErrorOccurred.addListener(
    (details) => {
      if (details.type !== "main_frame") void enqueue(() => observe(details));
    },
    { urls: ["http://*/*", "https://*/*"] },
  );

  browser.tabs.onRemoved.addListener((tabId) => {
    void enqueue(async () => {
      delete tabs[tabId];
      verificationRetryAt.delete(tabId);
      activityTimes.delete(tabId);
      scheduleSave();
    });
  });

  browser.runtime.onMessage.addListener((message: Message, sender, respond) => {
    if (!message || typeof message.type !== "string") return;
    const trustedPage = sender.url?.startsWith(chrome.runtime.getURL(""));
    if (
      !trustedPage &&
      message.type !== "PAGE_READY" &&
      message.type !== "OPEN_POPUP"
    )
      return;
    void enqueue(async () => {
      switch (message.type) {
        case "SNAPSHOT":
          return snapshot(message.tabId, message.refresh === true);
        case "SETTINGS":
          return updateSettings(message.patch || {});
        case "SET_ENDPOINT": {
          const { site, host, allowed } = message;
          if (
            !isHostname(site) ||
            !isHostname(host) ||
            typeof allowed !== "boolean"
          )
            throw new Error("Invalid endpoint exception");
          const list = settings.allowedEndpoints;
          if (allowed && endpointException(list, site, host)) return settings;
          const updated = allowed
            ? [...list, { site, host }]
            : list.filter((rule) => rule.site !== site || rule.host !== host);
          return updateSettings({}, updated);
        }
        case "PAUSE_SITE":
          return updateSettings({
            pausedSites: message.paused
              ? [...settings.pausedSites, message.host]
              : settings.pausedSites.filter(
                  (host) =>
                    message.host !== host && !message.host.endsWith(`.${host}`),
                ),
          });
        case "CLEAR_HISTORY":
          history = {};
          historyChanged = true;
          for (const state of Object.values(tabs)) {
            state.historyApplied = Object.fromEntries(
              Object.values(state.activity).map((item) => [
                item.companyId,
                { observed: item.observed, blocked: item.blocked },
              ]),
            );
          }
          await persist();
          return true;
        case "PAGE_READY": {
          const host = (() => {
            try {
              return new URL(sender.url || "").hostname;
            } catch {
              return "";
            }
          })();
          return {
            blocking: settings.blocking,
            cleanLinks: settings.cleanLinks,
            eyes: settings.eyes,
            paused: isPaused(host),
            language: settings.language,
          };
        }
        case "OPEN_POPUP":
          await browser.action.openPopup();
          return true;
      }
    }).then(respond, (error) =>
      respond({
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong. Try again.",
      }),
    );
    return true;
  });
});
