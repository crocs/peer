import { defineConfig } from "wxt";
import { readFile } from "node:fs/promises";
import type { NetworkRule } from "./lib/network";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifestVersion: 3,
  zip: { zipSources: false },
  hooks: {
    async "build:publicAssets"(wxt, files) {
      if (wxt.config.browser !== "firefox") return;
      const index = files.findIndex(
        (file) =>
          file.relativeDest.replaceAll("\\", "/") === "rules/privacy.json",
      );
      const file = files[index];
      if (!file || !("absoluteSrc" in file))
        throw new Error("Missing bundled privacy rules");
      const rules: NetworkRule[] = JSON.parse(
        await readFile(file.absoluteSrc, "utf8"),
      );
      for (const { condition } of rules) {
        if (!condition.resourceTypes) continue;
        condition.resourceTypes = condition.resourceTypes.flatMap((type) => {
          if (type === "webbundle" || type === "webtransport") return [];
          if (type === "ping") return ["ping", "beacon"];
          if (type === "image") return ["image", "imageset"];
          return [type];
        });
      }
      files[index] = {
        relativeDest: file.relativeDest,
        contents: JSON.stringify(
          rules.filter((rule) => rule.condition.resourceTypes?.length !== 0),
        ),
      };
    },
  },
  manifest: ({ browser }) => ({
    name: "peer — tracker protection",
    short_name: "peer",
    description:
      "Identify tracking companies, block known trackers, and remove tracking tags from links. Local processing, no account.",
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "peer@crocs.github.io",
              strict_min_version: "140.0",
              data_collection_permissions: { required: ["none"] },
            },
            gecko_android: { strict_min_version: "142.0" },
          },
        }
      : { minimum_chrome_version: "128" }),
    permissions: [
      "storage",
      "webRequest",
      "declarativeNetRequest",
      "activeTab",
      ...(browser === "firefox" ? [] : ["favicon"]),
    ],
    host_permissions: ["http://*/*", "https://*/*"],
    action: { default_title: "peer" },
    icons: {
      16: "icons/16.png",
      32: "icons/32.png",
      48: "icons/48.png",
      128: "icons/128.png",
    },
    declarative_net_request: {
      rule_resources: [
        { id: "trackers", enabled: true, path: "rules/trackers.json" },
        { id: "privacy", enabled: true, path: "rules/privacy.json" },
      ],
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'; base-uri 'self'",
    },
  }),
});
