import { useSyncExternalStore } from "react";
import { CELIA_GLYPHS as G, SIDELOAD_GLYPHS } from "./glyphs";

/** Centre line of the "/" glyph, extended past both ends so the clip owns the edges. */
const SLASH_LINE = { x1: 169.3, y1: 71.4, x2: 197.9, y2: -1.4 };

/*
 * Lockup geometry, from the measured outlines of both source SVGs:
 * CEL/A flat caps span y 1.94 → 68.06, SIDELOAD flat caps y 2.95 → 69.
 * Cap heights match (66.1), so the lockup only shifts SIDELOAD so the flat
 * baselines coincide. Stacked, the round C (x 0) and S (x 0.26) share one
 * optical left edge.
 */
const ROW = { x: 311, y: 68.06 - 69, viewBox: "0 0 762 70" };
const STACK = { x: -0.26, y: 68.06 + 30 - 2.95, viewBox: "0 0 451 167" };

const QUERY = "(max-width: 1080px)";
const subscribe = (cb: () => void) => {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", cb);
  return () => mql.removeEventListener("change", cb);
};
const useStacked = () =>
  useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);

const delay = (i: number) => ({ "--i": i }) as React.CSSProperties;

export function Wordmark({ echo }: { echo: number }) {
  const stacked = useStacked();
  const L = stacked ? STACK : ROW;

  return (
    <svg
      className={`wordmark${stacked ? " wordmark--stacked" : ""}`}
      viewBox={L.viewBox}
      fill="#fff"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="wm-slash">
          <path d={G.slash} />
        </clipPath>
        {/* each line clips its own glyphs so they rise out of their baseline */}
        <clipPath id="wm-row-celia">
          <rect x="-4" y="-4" width="770" height="74" />
        </clipPath>
        <clipPath id="wm-row-sideload">
          <rect x="-4" y="-4" width="460" height="75" />
        </clipPath>
      </defs>

      <g clipPath="url(#wm-row-celia)">
        <path className="glyph" style={delay(0)} d={G.C} />
        <path className="glyph" style={delay(1)} d={G.E} />
        <path className="glyph" style={delay(2)} d={G.L} />
        <line
          className="glyph-slash"
          {...SLASH_LINE}
          stroke="#fff"
          strokeWidth="14"
          pathLength={1}
          clipPath="url(#wm-slash)"
        />
        {echo > 0 && <path key={echo} className="glyph-ghost" d={G.slash} />}
        <path className="glyph" style={delay(4)} d={G.A} />
      </g>

      <g transform={`translate(${L.x} ${L.y})`}>
        <g clipPath="url(#wm-row-sideload)">
          {SIDELOAD_GLYPHS.map((d, i) => (
            <path key={i} className="glyph glyph--light" style={delay(5 + i)} d={d} />
          ))}
        </g>
      </g>
    </svg>
  );
}
