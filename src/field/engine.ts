import { SCENES, VOID, createLayout, type Layout, type Sample, type Scene } from "./scenes";
import { clamp, easeInOutCubic, hexToRgb, lerp, mixLineAngle, type RGB } from "./math";

const SCENE_SECONDS = 7.2;
/** time for the diagonal wipe to cross the whole field */
const SWEEP = 1.15;
/** time each individual stroke takes to morph */
const MORPH = 0.95;
const ALPHA_LEVELS = 10;
const TINT_MIX = [0, 0.5, 0.88] as const;

interface Pulse {
  x: number;
  y: number;
  born: number;
}

export interface FieldOptions {
  reducedMotion: boolean;
  onScene?: (index: number) => void;
}

export class FieldEngine {
  private readonly ctx: CanvasRenderingContext2D;
  private layout: Layout | null = null;
  private dpr = 1;
  private buckets: Float32Array[] = [];
  private counts = new Int32Array(ALPHA_LEVELS * TINT_MIX.length);

  private t0 = performance.now();
  private t = 0;
  private index = 0;
  private current: Scene = SCENES[0];
  private previous: Scene | null = VOID;
  private sceneStart = 0.25;
  private previousStart = 0;

  private accent: [number, number, number] = [255, 255, 255];
  private accentTarget: RGB = [255, 255, 255];

  private pointer = { x: 0, y: 0, tx: 0, ty: 0, s: 0, ts: 0, last: -10 };
  private pulses: Pulse[] = [];

  private raf = 0;
  private visible = true;
  private disposed = false;
  private readonly a: Sample = { a: 0, l: 0, o: 0 };
  private readonly b: Sample = { a: 0, l: 0, o: 0 };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: FieldOptions,
  ) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    if (options.reducedMotion) {
      this.current = SCENES[1];
      this.index = 1;
      this.previous = null;
    }
  }

  resize(w: number, h: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.layout = createLayout(w, h);
    const size = this.layout.n * 4;
    this.buckets = Array.from({ length: this.counts.length }, () => new Float32Array(size));
    if (this.options.reducedMotion) this.draw(14);
  }

  setAccent(hex: string) {
    this.accentTarget = hexToRgb(hex);
    if (this.options.reducedMotion) {
      this.accent = [...this.accentTarget];
      this.draw(14);
    }
  }

  setVisible(visible: boolean) {
    this.visible = visible;
    if (visible) this.start();
  }

  goTo(index: number) {
    const next = ((index % SCENES.length) + SCENES.length) % SCENES.length;
    if (next === this.index) return;
    this.previous = this.current;
    this.previousStart = this.sceneStart;
    this.current = SCENES[next];
    this.index = next;
    this.sceneStart = this.t;
    this.options.onScene?.(next);
    if (this.options.reducedMotion) {
      this.previous = null;
      this.draw(14);
    }
  }

  pointerMove(x: number, y: number) {
    const p = this.pointer;
    p.tx = x;
    p.ty = y;
    if (p.s < 0.01) {
      p.x = x;
      p.y = y;
    }
    p.ts = 1;
    p.last = this.t;
  }

  pointerLeave() {
    this.pointer.ts = 0;
  }

  pulse(x: number, y: number) {
    this.pulses.push({ x, y, born: this.t });
    if (this.pulses.length > 4) this.pulses.shift();
  }

  start() {
    if (this.options.reducedMotion || this.raf || this.disposed) return;
    const loop = (now: number) => {
      this.raf = 0;
      if (!this.visible || this.disposed || document.hidden) return;
      this.t = (now - this.t0) / 1000;
      this.tick();
      this.draw(this.t);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
  }

  private tick() {
    const local = this.t - this.sceneStart;
    if (local >= SCENE_SECONDS) this.goTo(this.index + 1);

    if (this.previous && this.t - this.sceneStart > SWEEP + MORPH) this.previous = null;

    const p = this.pointer;
    if (this.t - p.last > 1.6) p.ts = 0;
    p.x = lerp(p.x, p.tx, 0.16);
    p.y = lerp(p.y, p.ty, 0.16);
    p.s = lerp(p.s, p.ts, 0.05);

    for (let c = 0; c < 3; c++) this.accent[c] = lerp(this.accent[c], this.accentTarget[c], 0.045);
    this.pulses = this.pulses.filter((pulse) => this.t - pulse.born < 2.4);
  }

  private draw(t: number) {
    const L = this.layout;
    if (!L) return;
    const { ctx, a, b, buckets, counts } = this;
    const reduced = this.options.reducedMotion;
    const cur = this.current;
    const prev = reduced ? null : this.previous;
    const pCur = reduced ? 0.8 : (t - this.sceneStart) / SCENE_SECONDS;
    const pPrev = (t - this.previousStart) / SCENE_SECONDS;
    const since = t - this.sceneStart;
    const maxLen = L.s * 0.78;

    const ptr = this.pointer;
    const ptrOn = !reduced && ptr.s > 0.01;
    const ptrR = L.s * 7.5;
    const pulses = reduced ? [] : this.pulses;

    counts.fill(0);

    for (let i = 0; i < L.n; i++) {
      cur.sample(i, L, t, pCur, a);
      let ang = a.a;
      let len = a.l;
      let op = a.o;

      if (prev) {
        const k = clamp((since - L.wipe[i] * SWEEP) / MORPH);
        if (k < 1) {
          prev.sample(i, L, t, pPrev, b);
          const e = easeInOutCubic(k);
          ang = mixLineAngle(b.a, a.a, e);
          len = lerp(b.l, a.l, e);
          op = lerp(b.o, a.o, e);
          // the wavefront itself glows as it passes through
          const crest = 4 * k * (1 - k);
          const glow = crest * crest * (prev === VOID ? 0.9 : 0.55);
          if (glow > op) op = glow;
          if (glow > len) len = glow;
        }
      }

      if (ptrOn) {
        const dx = L.x[i] - ptr.x;
        const dy = L.y[i] - ptr.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < ptrR * ptrR) {
          const f = 1 - Math.sqrt(d2) / ptrR;
          const w = f * f * ptr.s;
          ang = mixLineAngle(ang, Math.atan2(dy, dx) + Math.PI / 2, w * 0.9);
          len += (1 - len) * w * 0.75;
          op += (1 - op) * w * 0.65;
        }
      }

      for (let q = 0; q < pulses.length; q++) {
        const pulse = pulses[q];
        const age = t - pulse.born;
        const ring = age * 520;
        const dx = L.x[i] - pulse.x;
        const dy = L.y[i] - pulse.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        const band = 1 - Math.abs(d - ring) / 46;
        if (band > 0) {
          const w = band * band * (1 - age / 2.4);
          ang = mixLineAngle(ang, Math.atan2(dy, dx), w);
          len += (1 - len) * w;
          op += (1 - op) * w * 0.85;
        }
      }

      op *= L.fade[i];
      if (op < 0.02) continue;

      const half = Math.max(maxLen * len, 1.1) * 0.5;
      const cx = Math.cos(ang) * half;
      const cy = Math.sin(ang) * half;
      const tw = L.tint[i];
      const tb = tw > 0.62 ? 2 : tw > 0.28 ? 1 : 0;
      const ab = Math.min(ALPHA_LEVELS - 1, (op * ALPHA_LEVELS) | 0);
      const bi = tb * ALPHA_LEVELS + ab;
      const arr = buckets[bi];
      const c = counts[bi];
      arr[c] = L.x[i] - cx;
      arr[c + 1] = L.y[i] - cy;
      arr[c + 2] = L.x[i] + cx;
      arr[c + 3] = L.y[i] + cy;
      counts[bi] = c + 4;
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, L.w, L.h);
    ctx.lineCap = "round";
    ctx.lineWidth = L.compact ? 1.1 : 1.25;

    const [ar, ag, ac] = this.accent;
    for (let tb = 0; tb < TINT_MIX.length; tb++) {
      const m = TINT_MIX[tb];
      const r = Math.round(lerp(255, ar, m));
      const g = Math.round(lerp(255, ag, m));
      const bl = Math.round(lerp(255, ac, m));
      for (let ab = 0; ab < ALPHA_LEVELS; ab++) {
        const bi = tb * ALPHA_LEVELS + ab;
        const count = counts[bi];
        if (!count) continue;
        const arr = buckets[bi];
        ctx.beginPath();
        for (let c = 0; c < count; c += 4) {
          ctx.moveTo(arr[c], arr[c + 1]);
          ctx.lineTo(arr[c + 2], arr[c + 3]);
        }
        ctx.strokeStyle = `rgba(${r},${g},${bl},${((ab + 0.6) / ALPHA_LEVELS).toFixed(3)})`;
        ctx.stroke();
      }
    }
  }
}
