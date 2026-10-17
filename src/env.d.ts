interface SourceSnapshot {
  sourceURL: string;
  apps: {
    name: string;
    bundleIdentifier: string;
    subtitle: string;
    localizedDescription: string;
    versions: { version: string; date: string; size: number; downloadURL: string }[];
  }[];
}

declare const __SOURCE__: SourceSnapshot;
