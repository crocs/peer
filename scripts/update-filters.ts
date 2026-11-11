import { writeFile } from "node:fs/promises";
import { getDomain } from "tldts";

const upstream = "AdguardTeam/cname-trackers";
const providers = [
  "adobe-experience-cloud-(formerly-omniture)",
  "criteo",
  "etracker",
  "eulerian",
  "datafast",
  "fathom",
  "goatcounter",
  "parse_ly",
  "piwik-pro",
  "plausible-analytics",
  "proxyhog",
  "webtrekk",
  "at-internet-(formerly-xiti)",
  "lead-forensics",
  "utiq",
  "ad-ebis",
];
async function download(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  if (!response.ok)
    throw new Error(`Download failed (${response.status}): ${url}`);
  return response;
}

const easy = await (
  await download("https://easylist.to/easylist/easyprivacy.txt")
).text();
if (
  !easy.startsWith("[Adblock Plus") ||
  !easy.includes("! Title: EasyPrivacy") ||
  easy.length < 800000 ||
  easy.length > 6000000
)
  throw new Error("Unexpected EasyPrivacy snapshot");

const { sha: revision } = await (
  await download(`https://api.github.com/repos/${upstream}/commits/master`)
).json();
if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error("Invalid CNAME revision");
const lists: Record<string, string[]> = {};
for (const provider of providers) {
  const url = `https://raw.githubusercontent.com/${upstream}/${revision}/data/trackers/${provider}.json`;
  const records = (await (await download(url)).json()) as Record<
    string,
    string
  >;
  const hosts = Object.entries(records)
    .filter(([host, target]) => {
      const site = getDomain(host, { allowPrivateDomains: true });
      return (
        site &&
        host !== site &&
        typeof target === "string" &&
        site !== getDomain(target, { allowPrivateDomains: true }) &&
        host.length <= 253 &&
        host
          .split(".")
          .every((label) =>
            /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
          )
      );
    })
    .map(([host]) => host)
    .sort();
  if (!hosts.length) throw new Error(`Empty CNAME provider: ${provider}`);
  lists[provider] = hosts;
}
await writeFile(
  "data/cname.json",
  JSON.stringify({ revision, lists }, null, 2) + "\n",
);
await writeFile("data/easyprivacy.txt", easy.replace(/\r\n/g, "\n"));
console.log("Updated EasyPrivacy and the pinned tracking alias lists.");
