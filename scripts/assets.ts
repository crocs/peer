import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { catalogRules } from "../lib/network";
import { buildPrivacyRules } from "./privacy-rules";
import { buildBrandAssets } from "./brands";

await mkdir("public/icons", { recursive: true });
await mkdir("public/rules", { recursive: true });
await writeFile("public/LICENSE", await readFile("LICENSE", "utf8"));
await writeFile(
  "public/rules/LICENSE.txt",
  await readFile("data/LICENSE.txt", "utf8"),
);

const icon = await readFile("assets/mark.svg");
await writeFile("public/icon.svg", icon);
for (const size of [16, 32, 48, 128]) {
  await sharp(Buffer.from(icon))
    .resize(size, size)
    .png()
    .toFile(`public/icons/${size}.png`);
}

await writeFile(
  "public/rules/trackers.json",
  `${JSON.stringify(catalogRules, null, 2)}\n`,
);
console.log(`${catalogRules.length} tracking rules · icons ready`);
await buildPrivacyRules();
await buildBrandAssets();
