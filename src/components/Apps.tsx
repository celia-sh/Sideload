import { APPS, formatDate, formatSize, type AppEntry } from "../data";
import { hana, novella } from "../field/vignettes";
import { useReveal } from "../hooks/useReveal";
import { VignetteCanvas } from "./VignetteCanvas";

const VIGNETTES = { "sh.celia.hana": hana, "sh.celia.novella": novella } as const;

export function Apps({ reducedMotion }: { reducedMotion: boolean }) {
  const head = useReveal<HTMLDivElement>();
  return (
    <section id="apps" className="section apps" aria-labelledby="apps-title">
      <div ref={head} className="section__head reveal">
        <h2 id="apps-title" className="display">
          Two apps,
          <br />
          <span className="display__soft">kept current.</span>
        </h2>
        <p className="section__lede">
          Native clients built and maintained by celia-sh. The feed follows each
          repository&rsquo;s GitHub releases and refreshes every twelve hours.
        </p>
      </div>
      <div className="apps__grid">
        {APPS.map((app, i) => (
          <AppCard key={app.id} app={app} order={i} reducedMotion={reducedMotion} />
        ))}
      </div>
    </section>
  );
}

function AppCard({ app, order, reducedMotion }: { app: AppEntry; order: number; reducedMotion: boolean }) {
  const ref = useReveal<HTMLElement>(0.15);
  const draw = VIGNETTES[app.id as keyof typeof VIGNETTES];
  return (
    <article
      ref={ref}
      className="app reveal"
      style={{ "--accent": app.accent, "--surface": app.surface, "--order": order } as React.CSSProperties}
      aria-labelledby={`${app.name}-title`}
    >
      <div className="app__stage">
        {draw && <VignetteCanvas draw={draw} reducedMotion={reducedMotion} />}
        <img className="app__icon" src={app.icon} alt="" width="132" height="132" loading="lazy" />
      </div>
      <div className="app__body">
        <div className="app__title">
          <h3 id={`${app.name}-title`}>{app.name}</h3>
          <span className="pill">v{app.version}</span>
        </div>
        <p className="app__subtitle" lang="zh-CN">
          {app.subtitle}
        </p>
        <p className="app__desc" lang="zh-CN">
          {app.description}
        </p>
        <dl className="app__meta">
          <div>
            <dt>Released</dt>
            <dd>
              <time dateTime={app.date.toISOString()}>{formatDate(app.date)}</time>
            </dd>
          </div>
          <div>
            <dt>Size</dt>
            <dd>{formatSize(app.size)}</dd>
          </div>
          <div>
            <dt>Runs on</dt>
            <dd>{app.platforms}</dd>
          </div>
        </dl>
        <div className="app__actions">
          <a className="button" href={app.downloadURL}>
            Download IPA
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 5v13m-6-6 6 6 6-6" />
            </svg>
          </a>
          <a className="button button--ghost" href={app.releaseURL} target="_blank" rel="noreferrer">
            Release notes
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
