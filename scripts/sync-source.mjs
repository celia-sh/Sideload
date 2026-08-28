import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "public", "source.json");

const repositories = {
  Novella: "celia-sh/Novella",
  Hana: "celia-sh/Hana",
};

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "celia-sh-sideload-source-sync",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function github(pathname) {
  const response = await fetch(`https://api.github.com${pathname}`, { headers });

  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${pathname}`);
  }

  return response.json();
}

function releaseWithIpa(releases) {
  return releases.find((release) => {
    if (release.draft || release.prerelease) return false;
    return release.assets?.some((asset) => /\.ipa$/i.test(asset.name));
  });
}

function versionFromTag(tag) {
  return tag.replace(/^v/i, "");
}

function localizedDescriptionFromBody(body) {
  const description = (body ?? "")
    .replace(/<img\b[^>]*>\s*/gi, "")
    .trim();

  return description || "该版本未提供描述。";
}

const source = JSON.parse(await readFile(sourcePath, "utf8"));
let changed = false;

for (const app of source.apps) {
  const repository = repositories[app.name];
  if (!repository) continue;

  const releases = await github(`/repos/${repository}/releases?per_page=20`);
  const release = releaseWithIpa(releases);
  if (!release) {
    throw new Error(`No stable IPA release found for ${repository}`);
  }

  const ipa = release.assets.find((asset) => /\.ipa$/i.test(asset.name));
  const version = versionFromTag(release.tag_name);
  const current = app.versions?.[0];
  const digest = ipa.digest?.replace(/^sha256:/i, "");
  const localizedDescription = localizedDescriptionFromBody(release.body);
  const isCurrent =
    current?.version === version &&
    current?.downloadURL === ipa.browser_download_url &&
    (!digest || current?.sha256 === digest) &&
    current?.localizedDescription === localizedDescription;

  if (isCurrent) {
    console.log(`${app.name}: ${version} is already current`);
    continue;
  }

  const nextVersion = {
    ...(current ?? {}),
    version,
    date: release.published_at ?? release.created_at,
    downloadURL: ipa.browser_download_url,
    size: ipa.size,
    ...(digest ? { sha256: digest } : {}),
    localizedDescription,
  };

  if (!digest) delete nextVersion.sha256;

  app.versions = [
    nextVersion,
    ...(app.versions ?? []).filter(
      (entry) =>
        entry.version !== nextVersion.version ||
        entry.downloadURL !== nextVersion.downloadURL,
    ),
  ];

  changed = true;
  console.log(`${app.name}: updated to ${version}`);
}

if (changed) {
  await writeFile(sourcePath, `${JSON.stringify(source, null, 2)}\n`);
} else {
  console.log("CELIA Source is up to date");
}
