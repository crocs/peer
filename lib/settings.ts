import type { EndpointException, Settings } from "./types";

export const SETTINGS_KEY = "peerSettings";
export const HISTORY_KEY = "peerHistory";
export const SESSION_KEY = "peerTabs";

export function isHostname(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 253 || !value) return false;
  try {
    return new URL(`https://${value}`).hostname === value;
  } catch {
    return false;
  }
}

export function includesHost(host: string, domain: string) {
  return host === domain || host.endsWith(`.${domain}`);
}

export function endpointException(
  list: EndpointException[],
  site: string,
  host: string,
) {
  return list.find(
    (rule) => includesHost(site, rule.site) && includesHost(host, rule.host),
  );
}

export function defaultSettings(): Settings {
  return {
    blocking: true,
    cleanLinks: true,
    eyes: false,
    history: false,
    language: "en",
    pausedSites: [],
    allowedEndpoints: [],
  };
}

export function restoreSettings(raw: unknown): Settings {
  const saved = (
    raw && typeof raw === "object" ? raw : {}
  ) as Partial<Settings> & { mode?: string };
  return {
    blocking:
      typeof saved.blocking === "boolean"
        ? saved.blocking
        : saved.mode
          ? saved.mode !== "see"
          : true,
    cleanLinks:
      typeof saved.cleanLinks === "boolean"
        ? saved.cleanLinks
        : saved.mode
          ? saved.mode === "peerback"
          : true,
    eyes: saved.eyes === true,
    history: saved.history === true,
    language: saved.language === "ru" ? "ru" : "en",
    pausedSites: Array.isArray(saved.pausedSites)
      ? saved.pausedSites.filter((site) => typeof site === "string")
      : [],
    allowedEndpoints: Array.isArray(saved.allowedEndpoints)
      ? saved.allowedEndpoints.filter(
          (rule) => isHostname(rule?.site) && isHostname(rule?.host),
        )
      : [],
  };
}

export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
