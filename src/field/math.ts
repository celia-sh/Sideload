// The "/" in the CEL/A wordmark rises 66.11 units over a 25.96 unit run.
// Every motion piece on the page is built on this single angle.
export const SLASH = Math.atan2(-66.109299, 25.963516);
export const SLASH_DEG = 90 + (SLASH * 180) / Math.PI; // ≈ 21.4° lean from vertical

export const TAU = Math.PI * 2;

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

export const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/** Lines are undirected, so angles blend along the shortest half-turn. */
export const mixLineAngle = (a: number, b: number, t: number) => {
  let d = b - a;
  d -= Math.PI * Math.round(d / Math.PI);
  return a + d * t;
};

/** Deterministic 0..1 hash for integer pairs. */
export const hash2 = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
};

export type RGB = readonly [number, number, number];

export const hexToRgb = (hex: string): RGB => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
