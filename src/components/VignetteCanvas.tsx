import { useEffect, useRef } from "react";
import type { Vignette } from "../field/vignettes";

export function VignetteCanvas({ draw, reducedMotion }: { draw: Vignette; reducedMotion: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    let w = 0;
    let h = 0;
    let raf = 0;
    let visible = false;
    const t0 = performance.now();

    const render = (now: number) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      draw(ctx, w, h, reducedMotion ? 2.2 : (now - t0) / 1000);
    };
    const loop = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      render(now);
      raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      if (reducedMotion) render(performance.now());
      else if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(([entry]) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = entry.contentRect.width;
      h = entry.contentRect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      render(performance.now());
    });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      kick();
    });
    ro.observe(canvas);
    io.observe(canvas);
    document.addEventListener("visibilitychange", kick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", kick);
    };
  }, [draw, reducedMotion]);

  return <canvas ref={ref} className="app__canvas" aria-hidden="true" />;
}
