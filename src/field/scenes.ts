import { SLASH, TAU, clamp, hash2, smoothstep } from "./math";

/** Struct-of-arrays layout for every stroke in the field. */
export interface Layout {
  w: number;
  h: number;
  /** grid spacing in CSS px */
  s: number;
  n: number;
  cx: number;
  cy: number;
  /** characteristic radius of the composition */
  R: number;
  compact: boolean;
  x: Float32Array;
  y: Float32Array;
  gx: Int16Array;
  gy: Int16Array;
  r: Float32Array;
  phi: Float32Array;
  hash: Float32Array;
  /** 0..1 position along the slash normal — drives the diagonal scene wipe */
  wipe: Float32Array;
  /** static opacity envelope (bottom fade) */
  fade: Float32Array;
  /** 0..1 tint weight, strongest at the composition centre */
  tint: Float32Array;
  /** Pages scene: 1 where a "word" sits */
  ink: Uint8Array;
  /** Pages scene: 1 inside a page block */
  page: Uint8Array;
  /** Pages scene: 0..1 reading order */
  order: Float32Array;
}

export interface Sample {
  a: number;
  l: number;
  o: number;
}

export interface Scene {
  id: string;
  name: string;
  sample(i: number, L: Layout, t: number, p: number, out: Sample): void;
}

const NX = Math.cos(SLASH + Math.PI / 2);
const NY = Math.sin(SLASH + Math.PI / 2);
const DX = Math.cos(SLASH);
const DY = Math.sin(SLASH);

export function createLayout(w: number, h: number): Layout {
  const compact = w < 760;
  const s = compact ? 17 : Math.round(clamp(w / 62, 19, 26));
  const cols = Math.ceil(w / s) + 1;
  const rows = Math.ceil(h / s) + 1;
  const n = cols * rows;

  const cx = compact ? w * 0.5 : w * 0.68;
  const cy = compact ? h * 0.33 : h * 0.5;
  const R = compact ? Math.max(w * 0.62, h * 0.26) : Math.min(w * 0.36, h * 0.62);

  const L: Layout = {
    w,
    h,
    s,
    n,
    cx,
    cy,
    R,
    compact,
    x: new Float32Array(n),
    y: new Float32Array(n),
    gx: new Int16Array(n),
    gy: new Int16Array(n),
    r: new Float32Array(n),
    phi: new Float32Array(n),
    hash: new Float32Array(n),
    wipe: new Float32Array(n),
    fade: new Float32Array(n),
    tint: new Float32Array(n),
    ink: new Uint8Array(n),
    page: new Uint8Array(n),
    order: new Float32Array(n),
  };

  const ox = (w - (cols - 1) * s) / 2;
  const oy = (h - (rows - 1) * s) / 2;
  let wMin = Infinity;
  let wMax = -Infinity;

  for (let j = 0, i = 0; j < rows; j++) {
    for (let k = 0; k < cols; k++, i++) {
      const x = ox + k * s;
      const y = oy + j * s;
      const u = (x - cx) / R;
      const v = (y - cy) / R;
      const r = Math.hypot(u, v);
      L.x[i] = x;
      L.y[i] = y;
      L.gx[i] = k;
      L.gy[i] = j;
      L.r[i] = r;
      L.phi[i] = Math.atan2(v, u);
      L.hash[i] = hash2(k, j);
      // project onto the axis perpendicular to the slash; flip so the wipe runs left → right
      const proj = -(x * NX + y * NY);
      L.wipe[i] = proj;
      if (proj < wMin) wMin = proj;
      if (proj > wMax) wMax = proj;
      L.fade[i] = 1 - smoothstep(h * 0.74, h * 1.02, y) * 0.92;
      L.tint[i] = smoothstep(1.3, 0.1, r);
    }
  }
  for (let i = 0; i < n; i++) L.wipe[i] = (L.wipe[i] - wMin) / (wMax - wMin || 1);

  buildPages(L, cols, rows);
  return L;
}

/** Lays greeked "typeset text" over the grid: pages → paragraphs → lines → words. */
function buildPages(L: Layout, cols: number, rows: number) {
  const { s, cx, cy, R, compact } = L;
  const pageCount = compact ? 1 : 2;
  const pw = Math.max(6, Math.round((compact ? R * 0.95 : R * 0.62) / s));
  const gutter = 3;
  const gcx = Math.round((cx - (L.x[0] ?? 0)) / s);
  const top = Math.max(1, Math.round((cy - R * (compact ? 0.55 : 0.62) - L.y[0]) / s));
  const bottom = Math.min(rows - 2, Math.round((cy + R * (compact ? 0.55 : 0.62) - L.y[0]) / s));
  const rowsPerPage = Math.max(1, bottom - top + 1);
  const total = pageCount * rowsPerPage;

  for (let pg = 0; pg < pageCount; pg++) {
    const c0 = compact
      ? gcx - Math.floor(pw / 2)
      : pg === 0
        ? gcx - Math.ceil(gutter / 2) - pw
        : gcx + Math.ceil(gutter / 2);
    let paraLeft = 0;
    let lastOfPara = false;
    let seed = 17 + pg * 131;

    for (let row = top, ri = 0; row <= bottom; row++, ri++) {
      // paragraph bookkeeping
      let blank = false;
      if (ri === 0) {
        // a short heading line opens every page
        paraLeft = 0;
      }
      if (ri === 1) blank = true;
      else if (ri > 1 && paraLeft === 0) {
        if (!lastOfPara) {
          paraLeft = 3 + Math.floor(hash2(seed++, row) * 4);
        } else {
          blank = true;
          lastOfPara = false;
        }
      }
      let lineCols = pw;
      if (ri === 0) lineCols = Math.round(pw * (0.32 + hash2(pg, 99) * 0.2));
      else if (!blank) {
        paraLeft--;
        if (paraLeft === 0) {
          lastOfPara = true;
          lineCols = Math.round(pw * (0.28 + hash2(seed++, row) * 0.5));
        }
      }

      let wordLeft = 0;
      for (let ci = 0; ci < pw; ci++) {
        const col = c0 + ci;
        if (col < 0 || col >= cols || row < 0 || row >= rows) continue;
        const i = row * cols + col;
        L.page[i] = 1;
        L.order[i] = (pg * rowsPerPage + ri + ci / pw) / total;
        if (blank || ci >= lineCols) continue;
        if (wordLeft === 0) {
          wordLeft = 2 + Math.floor(hash2(col * 7 + pg, row * 13) * 5);
          if (ci > 0) {
            wordLeft = -wordLeft; // emit a space before the next word
            continue;
          }
        }
        if (wordLeft < 0) wordLeft = -wordLeft;
        L.ink[i] = 1;
        wordLeft--;
      }
    }
  }
}

/* ------------------------------------------------------------------ scenes */

const slash: Scene = {
  id: "slash",
  name: "Slash",
  sample(i, L, t, _p, o) {
    const x = L.x[i] / L.s;
    const y = L.y[i] / L.s;
    const across = x * NX + y * NY;
    const along = x * DX + y * DY;
    const bend = 1.6 * Math.sin(along * 0.06 + t * 0.35);
    const wave = 0.5 + 0.5 * Math.sin(across * 0.32 - t * 1.25 + bend);
    const w3 = wave * wave * wave;
    o.a = SLASH;
    o.l = 0.1 + 0.9 * w3;
    o.o = 0.1 + 0.9 * wave * wave;
    if (L.hash[i] > 0.992) o.o = Math.max(o.o, 0.5 + 0.5 * Math.sin(t * 3 + i));
  },
};

const vortex: Scene = {
  id: "vortex",
  name: "Vortex",
  sample(i, L, t, _p, o) {
    const r = L.r[i];
    const phi = L.phi[i];
    const twist = 2.1 + 0.45 * Math.sin(t * 0.37);
    const spin = t * 0.32;
    const arms = 9;
    const band = 0.5 + 0.5 * Math.cos(arms * (phi - twist * r - spin));
    const sharp = band * band * band * band * band;
    const env = smoothstep(0.08, 0.32, r) * (1 - smoothstep(0.85, 1.55, r));
    o.a = phi + Math.atan(twist * r) + Math.PI / 2;
    o.l = 0.08 + 0.92 * sharp * env;
    o.o = 0.06 + 0.94 * sharp * env;
  },
};

const flow: Scene = {
  id: "flow",
  name: "Current",
  sample(i, L, t, _p, o) {
    const x = L.x[i] / L.s;
    const y = L.y[i] / L.s;
    const a =
      Math.sin(x * 0.085 + t * 0.28) +
      Math.sin(y * 0.11 - t * 0.21 + x * 0.04) +
      Math.sin((x + y) * 0.055 + t * 0.16);
    const k = 0.5 + 0.5 * Math.sin(a * 1.7 + t * 0.6);
    o.a = a * 0.95;
    o.l = 0.22 + 0.78 * k;
    o.o = 0.12 + 0.7 * k * k;
  },
};

const pages: Scene = {
  id: "pages",
  name: "Pages",
  sample(i, L, _t, p, o) {
    o.a = 0;
    if (!L.page[i]) {
      o.l = 0.05;
      o.o = 0.04;
      return;
    }
    if (!L.ink[i]) {
      o.l = 0.05;
      o.o = 0.07;
      return;
    }
    const cursor = p * 1.3;
    const d = cursor - L.order[i];
    if (d < 0) {
      o.l = 0.08;
      o.o = 0.1;
      return;
    }
    const fresh = 1 - smoothstep(0, 0.012, d);
    o.l = 0.92;
    o.o = 0.55 + 0.45 * fresh;
  },
};

const lattice: Scene = {
  id: "lattice",
  name: "Lattice",
  sample(i, L, t, _p, o) {
    const side = (L.gx[i] + L.gy[i]) & 1 ? 1 : -1;
    const lean = SLASH + Math.PI / 2; // 21.4° off vertical
    const ripple = 0.5 + 0.5 * Math.sin(t * 0.9 - L.r[i] * 5.2);
    const open = ripple * ripple;
    const delta = lean + (Math.PI / 2 - lean) * open;
    o.a = -Math.PI / 2 + side * delta;
    o.l = 0.62 + 0.38 * (1 - open);
    o.o = 0.14 + 0.62 * (1 - open) * smoothstep(1.7, 0.2, L.r[i]);
  },
};

const signal: Scene = {
  id: "signal",
  name: "Signal",
  sample(i, L, t, _p, o) {
    const r = L.r[i];
    const c = 0.5 + 0.5 * Math.cos(TAU * (r * 2.3 - t * 0.42));
    const bump = c * c * c * c * c * c;
    const env = smoothstep(0.04, 0.2, r) * (1 - smoothstep(1.1, 1.8, r));
    o.a = L.phi[i] + bump * 0.35;
    o.l = 0.08 + 0.92 * bump * env;
    o.o = 0.06 + 0.94 * bump * env;
  },
};

export const SCENES: readonly Scene[] = [slash, vortex, flow, pages, lattice, signal];

export const VOID: Scene = {
  id: "void",
  name: "",
  sample(_i, _L, _t, _p, o) {
    o.a = SLASH;
    o.l = 0;
    o.o = 0;
  },
};
