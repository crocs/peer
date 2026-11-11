import { services } from "./catalog";

export const subresources = [
  "sub_frame",
  "stylesheet",
  "script",
  "image",
  "font",
  "object",
  "xmlhttprequest",
  "ping",
  "csp_report",
  "media",
  "websocket",
  "webtransport",
  "webbundle",
  "other",
];

export interface Condition {
  urlFilter?: string;
  requestDomains?: string[];
  initiatorDomains?: string[];
  excludedInitiatorDomains?: string[];
  domainType?: "firstParty" | "thirdParty";
  resourceTypes?: string[];
}
export interface NetworkRule {
  id: number;
  priority: number;
  action: { type: "block" | "allow" };
  condition: Condition;
}

export const catalogRules: NetworkRule[] = services.map((service) => ({
  id: service.id,
  priority: 4,
  action: { type: "block" },
  condition: { urlFilter: `||${service.host}${service.path || "^"}` },
}));
