import { useState } from "react";
import { PLATFORMS } from "../data";

interface Props {
  index: number;
  onChange: (index: number) => void;
  autoplay: boolean;
}

export function AddSource({ index, onChange, autoplay }: Props) {
  const [manual, setManual] = useState(false);
  const cycling = autoplay && !manual;
  const active = PLATFORMS[index];

  return (
    <div className={`add${cycling ? " is-cycling" : ""}`}>
      <p className="eyebrow add__label">Add source to</p>

      <a
        className="cta"
        href={active.href}
        style={{ "--accent": active.accent } as React.CSSProperties}
        aria-label={`Add CELIA Source to ${active.name}`}
      >
        <span className="cta__ring" aria-hidden="true" />
        <span className="cta__icons" aria-hidden="true">
          {PLATFORMS.map((p, i) => (
            <img key={p.id} src={p.icon} alt="" width="44" height="44" className={i === index ? "is-on" : ""} />
          ))}
        </span>
        <span className="cta__text" aria-hidden="true">
          <span className="cta__kicker">Open in</span>
          <span className="cta__names">
            {PLATFORMS.map((p, i) => (
              <span key={p.id} className={i === index ? "is-on" : i < index ? "is-past" : ""}>
                {p.name}
              </span>
            ))}
          </span>
        </span>
        <svg className="cta__arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>

      <div className="tabs" role="radiogroup" aria-label="Sideloading app">
        {PLATFORMS.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={i === index}
            className={`tab${i === index ? " is-on" : ""}`}
            style={{ "--accent": p.accent } as React.CSSProperties}
            onClick={() => {
              setManual(true);
              onChange(i);
            }}
          >
            <span className="tab__name">{p.name}</span>
            <span className="tab__track" aria-hidden="true">
              <span
                className="tab__fill"
                onAnimationEnd={() => cycling && i === index && onChange((index + 1) % PLATFORMS.length)}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
