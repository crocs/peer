import { mkdir, writeFile } from "node:fs/promises";

const sites: Record<string, string> = {
  amazon: "amazon.com",
  yandex: "yandex.com",
  microsoft: "microsoft.com",
  adobe: "adobe.com",
  criteo: "criteo.com",
  linkedin: "linkedin.com",
  segment: "segment.com",
  amplitude: "amplitude.com",
  fullstory: "fullstory.com",
};
const downloaded = await Promise.all(
  Object.entries(sites).map(async ([id, domain]) => {
    const source = `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(`https://${domain}`)}&sz=64`;
    const response = await fetch(source, {
      signal: AbortSignal.timeout(20000),
    });
    if (
      !response.ok ||
      !response.headers.get("content-type")?.startsWith("image/png")
    )
      throw new Error(`Could not retrieve ${domain}'s icon`);
    return {
      id,
      domain,
      source,
      bytes: Buffer.from(await response.arrayBuffer()),
    };
  }),
);
await mkdir("data/brands", { recursive: true });
for (const item of downloaded)
  await writeFile(`data/brands/${item.id}.png`, item.bytes);
await writeFile(
  "data/brands/sources.json",
  JSON.stringify(
    downloaded.map(({ id, domain, source }) => ({ id, domain, source })),
    null,
    2,
  ) + "\n",
);
console.log(`Saved ${downloaded.length} website favicons for local bundling`);
