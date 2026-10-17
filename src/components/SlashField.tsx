import { useEffect, useRef } from "react";
import { FieldEngine } from "../field/engine";

interface Props {
  accent: string;
  reducedMotion: boolean;
  onScene: (index: number) => void;
  /** element that receives pointer input for the field */
  host: React.RefObject<HTMLElement | null>;
}

export function SlashField({ accent, reducedMotion, onScene, host }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FieldEngine | null>(null);
  const callbacks = useRef({ onScene });
  callbacks.current = { onScene };

  useEffect(() => {
    const canvas = canvasRef.current!;
    const engine = new FieldEngine(canvas, {
      reducedMotion,
      onScene: (i) => callbacks.current.onScene(i),
    });
    engineRef.current = engine;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      engine.resize(width, height);
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => engine.setVisible(entry.isIntersecting));
    io.observe(canvas);

    const onVisibility = () => !document.hidden && engine.start();
    document.addEventListener("visibilitychange", onVisibility);

    const el = host.current;
    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return [e.clientX - rect.left, e.clientY - rect.top] as const;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      engine.pointerMove(...local(e));
    };
    const leave = () => engine.pointerLeave();
    const down = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button")) return;
      engine.pulse(...local(e));
    };
    el?.addEventListener("pointermove", move);
    el?.addEventListener("pointerleave", leave);
    el?.addEventListener("pointerdown", down);

    engine.start();
    return () => {
      engine.dispose();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      el?.removeEventListener("pointermove", move);
      el?.removeEventListener("pointerleave", leave);
      el?.removeEventListener("pointerdown", down);
    };
  }, [reducedMotion, host]);

  useEffect(() => engineRef.current?.setAccent(accent), [accent]);

  return <canvas ref={canvasRef} className="hero__field" aria-hidden="true" />;
}
