import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// public/source.json is rewritten by scripts/sync-source.mjs; the page only
// needs a slim, build-time snapshot of it (release notes stay out of the bundle).
const source = JSON.parse(readFileSync(new URL("./public/source.json", import.meta.url), "utf8"));
const snapshot = {
  sourceURL: source.sourceURL,
  apps: source.apps.map((app: Record<string, any>) => ({
    name: app.name,
    bundleIdentifier: app.bundleIdentifier,
    subtitle: app.subtitle,
    localizedDescription: app.localizedDescription,
    versions: app.versions.slice(0, 1).map(({ version, date, size, downloadURL }: Record<string, any>) => ({
      version,
      date,
      size,
      downloadURL,
    })),
  })),
};

export default defineConfig({
  plugins: [react()],
  define: {
    __SOURCE__: JSON.stringify(snapshot),
  },
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
  },
});
