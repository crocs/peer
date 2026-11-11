import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const { version } = JSON.parse(await readFile("package.json", "utf8"));
const dir = ".output/setup-art";
await mkdir(dir, { recursive: true });
const mark = await readFile("assets/mark.svg");
const sizes = [16, 24, 32, 48, 64, 128, 256];
const directory = Buffer.alloc(6 + sizes.length * 16);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(sizes.length, 4);
const entries = [directory];
let offset = directory.length;

for (const [i, size] of sizes.entries()) {
  const png = await sharp(mark).resize(size, size).png().toBuffer();
  const entry = 6 + i * 16;
  directory[entry] = directory[entry + 1] = size % 256;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(png.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  entries.push(png);
  offset += png.length;
}
await writeFile(`${dir}/peer.ico`, Buffer.concat(entries));
await sharp(mark).resize(128, 128).png().toFile(`${dir}/header.png`);
const panel = (await readFile("assets/setup-panel.svg", "utf8")).replaceAll(
  "MARK_URL", `data:image/svg+xml;base64,${mark.toString("base64")}`,
);
await sharp(Buffer.from(panel)).png().toFile(`${dir}/sidebar.png`);
execFileSync(
  process.env.ISCC || "ISCC.exe",
  [`/DPeerVersion=${version}`, "scripts/windows-setup.iss"],
  { stdio: "inherit" },
);
