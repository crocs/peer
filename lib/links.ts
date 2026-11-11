const trackingKeys = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "ttclid",
  "twclid",
  "yclid",
  "ysclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "_ga",
  "_gl",
  "srsltid",
]);
const signedKeys =
  /^(signature|sig|token|access_token|id_token|code|state|hmac|hash|x-amz-.+|x-goog-.+)$/i;
const sensitivePath =
  /\/(oauth|authorize|authorization|login|signin|sign-in|checkout|payment|callback|sso)(\/|$)/i;

export function cleanLink(raw: string): {
  url: string;
  removed: string[];
  protected: boolean;
} {
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol))
      return { url: raw, removed: [], protected: false };
    if (
      sensitivePath.test(url.pathname) ||
      [...url.searchParams.keys()].some((key) => signedKeys.test(key))
    ) {
      return { url: raw, removed: [], protected: true };
    }
    const removed = [
      ...new Set(
        [...url.searchParams.keys()].filter(
          (key) => /^utm_/i.test(key) || trackingKeys.has(key.toLowerCase()),
        ),
      ),
    ];
    if (!removed.length) return { url: raw, removed, protected: false };
    const queryStart = raw.indexOf("?");
    const fragmentStart = raw.indexOf("#", queryStart);
    const query = raw.slice(
      queryStart + 1,
      fragmentStart === -1 ? undefined : fragmentStart,
    );
    const keep = query
      .split("&")
      .filter((part) => {
        try {
          return !removed.includes(
            decodeURIComponent(part.split("=")[0]!.replace(/\+/g, " ")),
          );
        } catch {
          return true;
        }
      })
      .join("&");
    return {
      url:
        raw.slice(0, queryStart) +
        (keep ? `?${keep}` : "") +
        (fragmentStart === -1 ? "" : raw.slice(fragmentStart)),
      removed,
      protected: false,
    };
  } catch {
    return { url: raw, removed: [], protected: false };
  }
}
