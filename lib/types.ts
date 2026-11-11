export type Language = "en" | "ru";

export interface EndpointException {
  site: string;
  host: string;
}

export interface Settings {
  blocking: boolean;
  cleanLinks: boolean;
  eyes: boolean;
  history: boolean;
  language: Language;
  pausedSites: string[];
  allowedEndpoints: EndpointException[];
}

export interface CompanyActivity {
  companyId: string;
  observed: number;
  blocked: number;
  domains: string[];
  example?: {
    host: string;
    source: "catalog" | "easyPrivacy" | "cname";
    pattern?: string;
  };
}

export interface TabState {
  tabId: number;
  host: string;
  startedAt: number;
  incognito: boolean;
  activity: Record<string, CompanyActivity>;
  requestIds: string[];
  blockedAvailable: boolean;
  verifiedAt: number;
  historyApplied: Record<string, { observed: number; blocked: number }>;
}

export interface HistorySite {
  companies: Record<string, { observed: number; blocked: number }>;
}

export type History = Record<string, Record<string, HistorySite>>;

export interface Snapshot {
  settings: Settings;
  tab: {
    id: number;
    host: string;
    url: string;
    supported: boolean;
    incognito: boolean;
  } | null;
  activity: CompanyActivity[];
  blockedAvailable: boolean;
  paused: boolean;
  history: History;
  catalogCompanies: number;
  catalogRules: number;
  coverage: { domains: number; updated: string; source: string };
  error?: string;
}

export type Message =
  | { type: "SNAPSHOT"; tabId?: number; refresh?: boolean }
  | { type: "SETTINGS"; patch: Partial<Settings> }
  | { type: "PAUSE_SITE"; host: string; paused: boolean }
  | { type: "SET_ENDPOINT"; site: string; host: string; allowed: boolean }
  | { type: "CLEAR_HISTORY" }
  | { type: "PAGE_READY" }
  | { type: "OPEN_POPUP" };

export type PageMessage =
  | {
      type: "PEER_STATE";
      blocking: boolean;
      cleanLinks: boolean;
      eyes: boolean;
      paused: boolean;
      language: Language;
    }
  | { type: "PEER_ACTIVITY" }
  | { type: "PEER_BLOCKED" };
