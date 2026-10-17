const source = __SOURCE__;

export const SOURCE_URL = source.sourceURL;

export interface Platform {
  id: "feather" | "altstore" | "sidestore";
  name: string;
  href: string;
  icon: string;
  accent: string;
}

const encoded = encodeURIComponent(SOURCE_URL);

export const PLATFORMS: readonly Platform[] = [
  {
    id: "feather",
    name: "Feather",
    href: `feather://source/${SOURCE_URL}`,
    icon: "/assets/platforms/feather.webp",
    accent: "#7f8cff",
  },
  {
    id: "altstore",
    name: "AltStore",
    href: `altstore://source?url=${encoded}`,
    icon: "/assets/platforms/altstore.webp",
    accent: "#3cc0b4",
  },
  {
    id: "sidestore",
    name: "SideStore",
    href: `sidestore://source?url=${encoded}`,
    icon: "/assets/platforms/sidestore.webp",
    accent: "#a05cff",
  },
];

interface AppExtras {
  icon: string;
  platforms: string;
  accent: string;
  surface: string;
}

const EXTRAS: Record<string, AppExtras> = {
  "sh.celia.novella": {
    icon: "/assets/apps/novella.webp",
    platforms: "iOS · iPadOS",
    accent: "#e9e9ea",
    surface: "#1b1b1d",
  },
  "sh.celia.hana": {
    icon: "/assets/apps/hana.webp",
    platforms: "iOS · iPadOS · macOS",
    accent: "#ff5c7f",
    surface: "#2a0a12",
  },
};

export interface AppEntry extends AppExtras {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  version: string;
  date: Date;
  size: number;
  downloadURL: string;
  repoURL: string;
  releaseURL: string;
}

export const APPS: readonly AppEntry[] = source.apps.map((app) => {
  const latest = app.versions[0];
  const repo = latest.downloadURL.match(/github\.com\/([^/]+\/[^/]+)\//)?.[1] ?? `celia-sh/${app.name}`;
  const tag = latest.downloadURL.match(/\/download\/([^/]+)\//)?.[1] ?? `v${latest.version}`;
  return {
    ...EXTRAS[app.bundleIdentifier],
    id: app.bundleIdentifier,
    name: app.name,
    subtitle: app.subtitle,
    description: app.localizedDescription,
    version: latest.version,
    date: new Date(latest.date),
    size: latest.size,
    downloadURL: latest.downloadURL,
    repoURL: `https://github.com/${repo}`,
    releaseURL: `https://github.com/${repo}/releases/tag/${tag}`,
  };
});

export const formatSize = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
