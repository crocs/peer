import { mkdir, readFile, writeFile } from "node:fs/promises";
import * as icons from "simple-icons";

const iconNames: Record<string, string> = {
  google: "siGoogle",
  meta: "siMeta",
  tiktok: "siTiktok",
  hotjar: "siHotjar",
  pinterest: "siPinterest",
  snap: "siSnapchat",
  x: "siX",
  reddit: "siReddit",
  mixpanel: "siMixpanel",
};

export async function buildBrandAssets() {
  await mkdir("public/brands", { recursive: true });
  for (const [id, name] of Object.entries(iconNames)) {
    const icon = (icons as Record<string, { path: string; hex: string }>)[name];
    if (!icon) throw new Error(`Missing brand icon: ${name}`);
    await writeFile(
      `public/brands/${id}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${icon.hex}"><path d="${icon.path}"/></svg>`,
    );
  }
  for (const id of [
    "amazon",
    "yandex",
    "microsoft",
    "adobe",
    "criteo",
    "linkedin",
    "segment",
    "amplitude",
    "fullstory",
  ]) {
    const png = await readFile(`data/brands/${id}.png`);
    await writeFile(
      `public/brands/${id}.svg`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><image width="64" height="64" href="data:image/png;base64,${png.toString("base64")}"/></svg>`,
    );
  }
}
