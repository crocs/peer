export type Category = "advertising" | "analytics" | "replay";

export interface Company {
  id: string;
  name: string;
  mark: string;
  color: string;
  category: Category;
  purpose: { en: string; ru: string };
  signals: { en: string[]; ru: string[] };
  source: string;
}

export const companies: Company[] = [
  {
    id: "google",
    name: "Google",
    mark: "G",
    color: "#4285f4",
    category: "advertising",
    purpose: {
      en: "Analytics and advertising tools can connect page visits, referrals, and device information.",
      ru: "Аналитика и рекламные инструменты могут связывать посещения страниц, источники переходов и данные устройства.",
    },
    signals: {
      en: ["Page visits", "Referrals", "Device details"],
      ru: ["Посещения", "Источники переходов", "Устройство"],
    },
    source: "https://support.google.com/analytics/answer/11593727",
  },
  {
    id: "meta",
    name: "Meta",
    mark: "∞",
    color: "#0866ff",
    category: "advertising",
    purpose: {
      en: "The Meta Pixel helps advertisers measure visits and actions, and build advertising audiences.",
      ru: "Meta Pixel помогает рекламодателям измерять посещения и действия, а также собирать рекламные аудитории.",
    },
    signals: {
      en: ["Page visits", "Interactions", "Ad attribution"],
      ru: ["Посещения", "Действия", "Эффективность рекламы"],
    },
    source: "https://developers.facebook.com/docs/meta-pixel/",
  },
  {
    id: "tiktok",
    name: "TikTok",
    mark: "♪",
    color: "#161823",
    category: "advertising",
    purpose: {
      en: "TikTok Pixel can associate website events with advertising campaigns and audiences.",
      ru: "TikTok Pixel может связывать события на сайте с рекламными кампаниями и аудиториями.",
    },
    signals: {
      en: ["Page visits", "Interactions", "Ad attribution"],
      ru: ["Посещения", "Действия", "Эффективность рекламы"],
    },
    source: "https://ads.tiktok.com/help/article/tiktok-pixel",
  },
  {
    id: "amazon",
    name: "Amazon",
    mark: "a",
    color: "#d98806",
    category: "advertising",
    purpose: {
      en: "Amazon advertising services measure ad activity and help personalize advertising.",
      ru: "Рекламные сервисы Amazon измеряют активность рекламы и помогают персонализировать объявления.",
    },
    signals: {
      en: ["Ad activity", "Page visits", "Device details"],
      ru: ["Реклама", "Посещения", "Устройство"],
    },
    source:
      "https://advertising.amazon.com/resources/ad-policy/amazon-advertising-tag",
  },
  {
    id: "yandex",
    name: "Yandex",
    mark: "Я",
    color: "#ed342e",
    category: "analytics",
    purpose: {
      en: "Metrica measures visits and interactions. Webvisor can record how people use a page.",
      ru: "Метрика измеряет посещения и действия. Вебвизор может записывать взаимодействия со страницей.",
    },
    signals: {
      en: ["Page visits", "Interactions", "Session replay"],
      ru: ["Посещения", "Действия", "Записи сеансов"],
    },
    source: "https://yandex.com/support/metrica/en/general/about",
  },
  {
    id: "microsoft",
    name: "Microsoft",
    mark: "⊞",
    color: "#737373",
    category: "analytics",
    purpose: {
      en: "Bing advertising and Clarity measure conversions, page activity, and visitor behavior.",
      ru: "Реклама Bing и Clarity измеряют конверсии, активность на странице и поведение посетителей.",
    },
    signals: {
      en: ["Interactions", "Ad attribution", "Session replay"],
      ru: ["Действия", "Эффективность рекламы", "Записи сеансов"],
    },
    source:
      "https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-data",
  },
  {
    id: "adobe",
    name: "Adobe",
    mark: "A",
    color: "#eb1000",
    category: "advertising",
    purpose: {
      en: "Adobe audience and analytics services help measure activity and connect advertising identifiers.",
      ru: "Сервисы аудиторий и аналитики Adobe помогают измерять активность и связывать рекламные идентификаторы.",
    },
    signals: {
      en: ["Page visits", "Ad identifiers", "Device details"],
      ru: ["Посещения", "Рекламные идентификаторы", "Устройство"],
    },
    source:
      "https://experienceleague.adobe.com/en/docs/audience-manager/user-guide/reference/demdex-calls",
  },
  {
    id: "hotjar",
    name: "Hotjar",
    mark: "h",
    color: "#ff5e3a",
    category: "replay",
    purpose: {
      en: "Heatmaps and session recordings show site owners how visitors navigate and interact.",
      ru: "Тепловые карты и записи сеансов показывают владельцам сайта, как посетители пользуются страницей.",
    },
    signals: {
      en: ["Interactions", "Session replay", "Device details"],
      ru: ["Действия", "Записи сеансов", "Устройство"],
    },
    source:
      "https://help.hotjar.com/hc/en-us/articles/115009334567-What-is-Hotjar",
  },
  {
    id: "criteo",
    name: "Criteo",
    mark: "c",
    color: "#ef7819",
    category: "advertising",
    purpose: {
      en: "Retargeting services can use browsing activity to select and measure personalized ads.",
      ru: "Сервисы ретаргетинга могут использовать историю действий для выбора и измерения персональной рекламы.",
    },
    signals: {
      en: ["Page visits", "Ad identifiers", "Ad attribution"],
      ru: ["Посещения", "Рекламные идентификаторы", "Эффективность рекламы"],
    },
    source: "https://www.criteo.com/privacy/how-we-use-your-data/",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    mark: "P",
    color: "#e60023",
    category: "advertising",
    purpose: {
      en: "The Pinterest tag measures website events and advertising conversions.",
      ru: "Тег Pinterest измеряет события на сайте и конверсии рекламных кампаний.",
    },
    signals: {
      en: ["Page visits", "Interactions", "Ad attribution"],
      ru: ["Посещения", "Действия", "Эффективность рекламы"],
    },
    source:
      "https://help.pinterest.com/en/business/article/track-conversions-with-pinterest-tag",
  },
  {
    id: "snap",
    name: "Snap",
    mark: "S",
    color: "#b09d00",
    category: "advertising",
    purpose: {
      en: "Snap Pixel measures actions on websites and connects them to advertising campaigns.",
      ru: "Snap Pixel измеряет действия на сайтах и связывает их с рекламными кампаниями.",
    },
    signals: {
      en: ["Page visits", "Interactions", "Ad attribution"],
      ru: ["Посещения", "Действия", "Эффективность рекламы"],
    },
    source: "https://businesshelp.snapchat.com/s/article/snap-pixel-about",
  },
  {
    id: "x",
    name: "X",
    mark: "𝕏",
    color: "#191919",
    category: "advertising",
    purpose: {
      en: "Advertising tags measure website visits and conversions from ads on X.",
      ru: "Рекламные теги измеряют посещения сайта и конверсии из рекламы в X.",
    },
    signals: {
      en: ["Page visits", "Interactions", "Ad attribution"],
      ru: ["Посещения", "Действия", "Эффективность рекламы"],
    },
    source:
      "https://business.x.com/en/help/campaign-measurement-and-analytics/conversion-tracking-for-websites",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    mark: "in",
    color: "#0a66c2",
    category: "advertising",
    purpose: {
      en: "The Insight Tag supports website analytics, conversion tracking, and advertising audiences.",
      ru: "Insight Tag используется для аналитики сайта, измерения конверсий и рекламных аудиторий.",
    },
    signals: {
      en: ["Page visits", "Referrals", "Device details"],
      ru: ["Посещения", "Источники переходов", "Устройство"],
    },
    source: "https://www.linkedin.com/help/lms/answer/a418880",
  },
  {
    id: "reddit",
    name: "Reddit",
    mark: "r",
    color: "#ff4500",
    category: "advertising",
    purpose: {
      en: "Reddit advertising tools measure website events and conversions.",
      ru: "Рекламные инструменты Reddit измеряют события на сайтах и конверсии.",
    },
    signals: {
      en: ["Page visits", "Interactions", "Ad attribution"],
      ru: ["Посещения", "Действия", "Эффективность рекламы"],
    },
    source:
      "https://business.reddithelp.com/s/article/Install-the-Reddit-Pixel-on-your-website",
  },
  {
    id: "segment",
    name: "Segment",
    mark: "s",
    color: "#39845c",
    category: "analytics",
    purpose: {
      en: "Segment collects website events and can route them to other analytics and marketing services.",
      ru: "Segment собирает события на сайте и может передавать их другим сервисам аналитики и маркетинга.",
    },
    signals: {
      en: ["Page visits", "Interactions", "User identifiers"],
      ru: ["Посещения", "Действия", "Идентификаторы"],
    },
    source:
      "https://segment.com/docs/connections/sources/catalog/libraries/website/javascript/",
  },
  {
    id: "mixpanel",
    name: "Mixpanel",
    mark: "m",
    color: "#7856ff",
    category: "analytics",
    purpose: {
      en: "Product analytics records events to help site owners understand visitor behavior.",
      ru: "Продуктовая аналитика записывает события, чтобы владельцы сайта могли изучать поведение посетителей.",
    },
    signals: {
      en: ["Interactions", "Page visits", "Device details"],
      ru: ["Действия", "Посещения", "Устройство"],
    },
    source: "https://docs.mixpanel.com/docs/tracking-methods/sdks/javascript",
  },
  {
    id: "amplitude",
    name: "Amplitude",
    mark: "a",
    color: "#245bff",
    category: "analytics",
    purpose: {
      en: "Product analytics can associate page activity and events with visitor identifiers.",
      ru: "Продуктовая аналитика может связывать активность на странице и события с идентификаторами посетителей.",
    },
    signals: {
      en: ["Interactions", "User identifiers", "Device details"],
      ru: ["Действия", "Идентификаторы", "Устройство"],
    },
    source: "https://amplitude.com/docs/sdks/analytics/browser/browser-sdk-2",
  },
  {
    id: "fullstory",
    name: "Fullstory",
    mark: "f",
    color: "#af4c38",
    category: "replay",
    purpose: {
      en: "Session replay tools can reconstruct visitor interactions for website owners.",
      ru: "Инструменты записи сеансов могут воспроизводить действия посетителей для владельцев сайта.",
    },
    signals: {
      en: ["Interactions", "Session replay", "Device details"],
      ru: ["Действия", "Записи сеансов", "Устройство"],
    },
    source:
      "https://help.fullstory.com/hc/en-us/articles/360020623234-What-data-does-Fullstory-capture",
  },
];

export interface Service {
  id: number;
  companyId: string;
  host: string;
  path?: string;
}

export const services: Service[] = [
  { id: 101, companyId: "google", host: "google-analytics.com" },
  {
    id: 102,
    companyId: "google",
    host: "googletagmanager.com",
    path: "/gtag/js",
  },
  {
    id: 103,
    companyId: "google",
    host: "googletagmanager.com",
    path: "/gtm.js",
  },
  { id: 104, companyId: "google", host: "doubleclick.net" },
  { id: 105, companyId: "google", host: "googlesyndication.com" },
  { id: 106, companyId: "google", host: "googleadservices.com" },
  { id: 107, companyId: "google", host: "googletagservices.com" },
  { id: 108, companyId: "google", host: "google.com", path: "/pagead/" },
  { id: 109, companyId: "google", host: "google.com", path: "/ccm/collect" },
  {
    id: 201,
    companyId: "meta",
    host: "connect.facebook.net",
    path: "^*/fbevents.js",
  },
  {
    id: 203,
    companyId: "meta",
    host: "connect.facebook.net",
    path: "/signals/",
  },
  { id: 202, companyId: "meta", host: "facebook.com", path: "/tr/" },
  { id: 301, companyId: "tiktok", host: "analytics.tiktok.com" },
  { id: 302, companyId: "tiktok", host: "analytics-sg.tiktok.com" },
  { id: 401, companyId: "amazon", host: "amazon-adsystem.com" },
  { id: 402, companyId: "amazon", host: "amazonclix.com" },
  { id: 501, companyId: "yandex", host: "mc.yandex.ru" },
  { id: 502, companyId: "yandex", host: "mc.yandex.com" },
  { id: 503, companyId: "yandex", host: "mc.webvisor.org" },
  { id: 504, companyId: "yandex", host: "an.yandex.ru" },
  { id: 505, companyId: "yandex", host: "yandex.ru", path: "/metrika/" },
  { id: 601, companyId: "microsoft", host: "bat.bing.com" },
  { id: 602, companyId: "microsoft", host: "clarity.ms" },
  { id: 701, companyId: "adobe", host: "demdex.net" },
  { id: 702, companyId: "adobe", host: "omtrdc.net" },
  { id: 703, companyId: "adobe", host: "everesttech.net" },
  { id: 801, companyId: "hotjar", host: "static.hotjar.com" },
  { id: 802, companyId: "hotjar", host: "script.hotjar.com" },
  { id: 803, companyId: "hotjar", host: "in.hotjar.com" },
  { id: 804, companyId: "hotjar", host: "vars.hotjar.com" },
  { id: 805, companyId: "hotjar", host: "insights.hotjar.com" },
  { id: 901, companyId: "criteo", host: "criteo.net" },
  { id: 902, companyId: "criteo", host: "gum.criteo.com" },
  { id: 903, companyId: "criteo", host: "dis.criteo.com" },
  { id: 1001, companyId: "pinterest", host: "ct.pinterest.com" },
  { id: 1002, companyId: "pinterest", host: "analytics.pinterest.com" },
  { id: 1003, companyId: "pinterest", host: "s.pinimg.com", path: "/ct/" },
  { id: 1101, companyId: "snap", host: "tr.snapchat.com" },
  { id: 1102, companyId: "snap", host: "tr6.snapchat.com" },
  {
    id: 1103,
    companyId: "snap",
    host: "sc-static.net",
    path: "/scevent.min.js",
  },
  { id: 1201, companyId: "x", host: "static.ads-twitter.com" },
  { id: 1202, companyId: "x", host: "analytics.twitter.com" },
  { id: 1203, companyId: "x", host: "t.co", path: "/i/adsct" },
  {
    id: 1301,
    companyId: "linkedin",
    host: "snap.licdn.com",
    path: "/li.lms-analytics/",
  },
  { id: 1302, companyId: "linkedin", host: "px.ads.linkedin.com" },
  { id: 1303, companyId: "linkedin", host: "dc.ads.linkedin.com" },
  { id: 1401, companyId: "reddit", host: "redditstatic.com", path: "/ads/" },
  { id: 1402, companyId: "reddit", host: "alb.reddit.com" },
  { id: 1403, companyId: "reddit", host: "events.reddit.com" },
  { id: 1501, companyId: "segment", host: "api.segment.io" },
  { id: 1502, companyId: "segment", host: "cdn.segment.com" },
  { id: 1601, companyId: "mixpanel", host: "api.mixpanel.com" },
  { id: 1602, companyId: "mixpanel", host: "api-js.mixpanel.com" },
  { id: 1603, companyId: "mixpanel", host: "cdn.mxpnl.com" },
  { id: 1701, companyId: "amplitude", host: "api2.amplitude.com" },
  { id: 1702, companyId: "amplitude", host: "api.amplitude.com" },
  { id: 1703, companyId: "amplitude", host: "cdn.amplitude.com" },
  { id: 1801, companyId: "fullstory", host: "rs.fullstory.com" },
  { id: 1802, companyId: "fullstory", host: "edge.fullstory.com" },
];

export const companyById = new Map(
  companies.map((company) => [company.id, company]),
);
companyById.set("other", {
  id: "other",
  name: "Other trackers",
  mark: "",
  color: "#747b88",
  category: "analytics",
  purpose: {
    en: "These requests match a tracking filter. Their operator is outside peer’s company catalog.",
    ru: "Эти запросы совпали с правилом блокировки трекеров. Их оператор не указан в каталоге peer.",
  },
  signals: { en: ["Tracking endpoints"], ru: ["Трекерные адреса"] },
  source: "https://easylist.to/",
});

const ownerDomains: Record<string, string[]> = {
  google: [
    "google.com",
    "google-analytics.com",
    "googletagmanager.com",
    "doubleclick.net",
    "googlesyndication.com",
    "googleadservices.com",
    "googletagservices.com",
  ],
  meta: ["facebook.com", "facebook.net"],
  tiktok: ["tiktok.com"],
  amazon: ["amazon-adsystem.com", "amazonclix.com"],
  yandex: ["yandex.ru", "yandex.com", "webvisor.org"],
  microsoft: ["bing.com", "clarity.ms"],
  adobe: ["demdex.net", "omtrdc.net", "everesttech.net"],
  hotjar: ["hotjar.com"],
  criteo: ["criteo.com", "criteo.net"],
  pinterest: ["pinterest.com"],
  snap: ["snapchat.com"],
  x: ["ads-twitter.com", "twitter.com"],
  linkedin: ["linkedin.com"],
  reddit: ["reddit.com"],
  segment: ["segment.io", "segment.com"],
  mixpanel: ["mixpanel.com", "mxpnl.com"],
  amplitude: ["amplitude.com"],
  fullstory: ["fullstory.com"],
};

export function companyForHost(host: string): string | undefined {
  return Object.entries(ownerDomains).find(([, domains]) =>
    domains.some((domain) => host === domain || host.endsWith(`.${domain}`)),
  )?.[0];
}
export const serviceByRuleId = new Map(
  services.map((service) => [service.id, service]),
);
