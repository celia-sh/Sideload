import { useCallback, useRef, useState } from "react";
import { APPS, PLATFORMS, formatDate } from "../data";
import { AddSource } from "./AddSource";
import { SlashField } from "./SlashField";
import { Wordmark } from "./Wordmark";

const LATEST = new Date(Math.max(...APPS.map((app) => app.date.getTime())));

export function Hero({ reducedMotion }: { reducedMotion: boolean }) {
  const hostRef = useRef<HTMLElement>(null);
  const [platform, setPlatform] = useState(0);
  const [echo, setEcho] = useState(0);
  const onScene = useCallback(() => setEcho((n) => n + 1), []);

  return (
    <section ref={hostRef} className="hero" aria-labelledby="site-title">
      <SlashField
        host={hostRef}
        accent={PLATFORMS[platform].accent}
        reducedMotion={reducedMotion}
        onScene={onScene}
      />
      <div className="hero__veil" aria-hidden="true" />

      <header className="nav">
        <a className="nav__home" href="/" aria-label="CELIA Sideload">
          sideload<span>.celia.sh</span>
        </a>
        <nav className="nav__links" aria-label="Primary">
          <a href="#apps">Apps</a>
          <a href="#manual">Source</a>
          <a href="https://github.com/celia-sh" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </nav>
      </header>

      <div className="hero__content">
        <h1 id="site-title" className="visually-hidden">
          CELIA Sideload
        </h1>
        <Wordmark echo={echo} />
        <p className="hero__lede">
          A source for apps by celia-sh.
          <span> Add it once &mdash; every new release finds its way to you.</span>
        </p>
        <AddSource index={platform} onChange={setPlatform} autoplay={!reducedMotion} />
      </div>

      <div className="hero__foot">
        <a className="scroll-cue" href="#apps">
          <span className="scroll-cue__line" aria-hidden="true" />
          Scroll
        </a>
        <p className="hero__updated">
          Updated <time dateTime={LATEST.toISOString()}>{formatDate(LATEST)}</time>
        </p>
      </div>
    </section>
  );
}
