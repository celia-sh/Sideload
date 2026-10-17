import { SLASH, hash2, smoothstep } from "./math";

export type Vignette = (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;

const FRAMES = 9;
const FRAME_SECONDS = 1.5;

/**
 * Hana — a corridor of 16:9 frames. Frames drift toward the viewer, each
 * leaning a little further along the slash, and dissolve as they pass; every
 * cycle the nearest one flashes like a cut.
 */
export const hana: Vignette = (ctx, w, h, t) => {
  const cx = w / 2;
  const cy = h / 2;
  const base = Math.min(w * 0.3, h * 0.5);
  const lean = (SLASH + Math.PI / 2) * 0.35;
  const phase = (t / FRAME_SECONDS) % 1;
  ctx.lineJoin = "round";

  for (let k = FRAMES - 1; k >= 0; k--) {
    const z = k + 1 - phase; // 0 = at the viewer, FRAMES = far away
    const depth = z / FRAMES;
    const scale = 1 / (0.28 + depth * 1.15);
    const fw = ((base * 16) / 9) * scale;
    const fh = base * scale;
    const fade = smoothstep(0.05, 0.3, depth) * (1 - smoothstep(0.62, 0.95, depth));
    if (fade < 0.01) continue;
    const near = 1 - smoothstep(0.1, 0.45, depth);
    const cut = k === 0 ? Math.max(0, 1 - phase * 5) : 0;
    const alpha = (0.1 + 0.55 * near) * fade + cut * 0.4;
    const r = Math.min(fw, fh) * 0.08;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(lean * (1 - depth) - lean * 0.5);
    ctx.strokeStyle = `rgba(255,${Math.round(150 + 80 * near)},${Math.round(175 + 60 * near)},${alpha.toFixed(3)})`;
    ctx.lineWidth = 1 + near * 0.6;
    ctx.beginPath();
    ctx.roundRect(-fw / 2, -fh / 2, fw, fh, r);
    ctx.stroke();

    // sprocket ticks along the top and bottom edges of each frame
    const holes = 18;
    ctx.fillStyle = `rgba(255,190,205,${(alpha * 0.55).toFixed(3)})`;
    for (let i = 0; i < holes; i++) {
      const x = -fw / 2 + ((i + 0.5) / holes) * fw;
      const hw = Math.max(1, (fw / holes) * 0.32);
      const hh = Math.max(1, fh * 0.035);
      ctx.fillRect(x - hw / 2, -fh / 2 - hh * 2.4, hw, hh);
      ctx.fillRect(x - hw / 2, fh / 2 + hh * 1.4, hw, hh);
    }
    ctx.restore();
  }
};

const PAGE_SECONDS = 6;
const TURN_SECONDS = 1.4;
const NX = Math.cos(SLASH + Math.PI / 2);
const NY = Math.sin(SLASH + Math.PI / 2);

/**
 * Novella — greeked text drifting upward past a reading line. Every few
 * seconds a slash sweeps across and the page turns beneath it.
 */
export const novella: Vignette = (ctx, w, h, t) => {
  const lineH = 15;
  const scroll = t * 9;
  const first = Math.floor(scroll / lineH) - 1;
  const rows = Math.ceil(h / lineH) + 3;
  const margin = Math.max(28, w * 0.09);
  const width = w - margin * 2;
  const cell = 7;
  const cols = Math.floor(width / cell);
  const cx = w / 2;
  const cy = h / 2;
  const hole = Math.min(w, h) * 0.26;

  const page = Math.floor(t / PAGE_SECONDS);
  const turn = (t % PAGE_SECONDS) / TURN_SECONDS;
  // diagonal extent of the canvas along the slash normal
  const span = Math.abs(w * NX) + Math.abs(h * NY);
  const front = -span * 0.1 + turn * span * 1.2;

  ctx.lineCap = "round";
  ctx.lineWidth = 3;

  for (let r = 0; r < rows; r++) {
    const line = first + r;
    const y = line * lineH - scroll + lineH;
    if (y < -lineH || y > h + lineH) continue;
    const reading = 1 - smoothstep(0, h * 0.28, Math.abs(y - h * 0.62));
    const edge = smoothstep(0, h * 0.18, y) * smoothstep(h, h * 0.82, y);

    let c = 0;
    while (c < cols) {
      const x0 = margin + c * cell;
      const d = x0 * NX + y * NY;
      const pg = turn < 1 && d > front ? page - 1 : page;
      const seed = line * 31 + pg * 977;
      if (hash2(seed, 1) < 0.14) break; // paragraph break: blank line
      const lineEnd = hash2(seed, 2) < 0.22 ? Math.floor(cols * (0.3 + hash2(seed, 3) * 0.5)) : cols;
      if (c >= lineEnd) break;
      const len = 2 + Math.floor(hash2(seed, c + 11) * 6);
      const x1 = margin + Math.min(c + len, lineEnd) * cell - cell;
      const mx = (x0 + x1) / 2;
      const clear = smoothstep(hole * 0.9, hole * 1.5, Math.hypot(mx - cx, y - cy));
      const alpha = (0.1 + 0.42 * reading) * edge * clear;
      if (alpha > 0.01) {
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.lineTo(Math.max(x0 + 0.5, x1), y);
        ctx.stroke();
      }
      c += len + 1;
    }
  }

  // the turning edge itself
  if (turn < 1) {
    const k = Math.sin(Math.PI * turn);
    const px = NX * front;
    const py = NY * front;
    const dx = Math.cos(SLASH) * h * 1.6;
    const dy = Math.sin(SLASH) * h * 1.6;
    const g = ctx.createLinearGradient(px - dx, py - dy, px + dx, py + dy);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${(0.55 * k).toFixed(3)})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(px - dx, py - dy);
    ctx.lineTo(px + dx, py + dy);
    ctx.stroke();
  }
};
