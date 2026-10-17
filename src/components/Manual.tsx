import { useEffect, useRef, useState } from "react";
import { SOURCE_URL } from "../data";
import { useReveal } from "../hooks/useReveal";

export function Manual() {
  const ref = useReveal<HTMLDivElement>();
  const [copied, setCopied] = useState(0);
  const urlRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(0), 2200);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SOURCE_URL);
    } catch {
      const range = document.createRange();
      range.selectNodeContents(urlRef.current!);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      document.execCommand("copy");
    }
    setCopied((n) => n + 1);
  };

  return (
    <section id="manual" className="section manual" aria-labelledby="manual-title">
      <div ref={ref} className="manual__grid reveal">
        <h2 id="manual-title" className="display">
          Or paste it
          <br />
          <span className="display__soft display__soft--loose">anywhere.</span>
        </h2>
        <div className="manual__body">
        <p className="section__lede">
          If a button doesn&rsquo;t open your app, add this URL by hand. Any
          AltSource-compatible app accepts it.
        </p>
        <div className={`copy${copied ? " is-copied" : ""}`}>
          {copied > 0 && <span key={copied} className="copy__shine" aria-hidden="true" />}
          <code ref={urlRef} className="copy__url">
            <span className="copy__muted">https://</span>
            {SOURCE_URL.replace(/^https:\/\//, "")}
          </code>
          <button type="button" className="copy__button" onClick={copy}>
            <span className="copy__label">Copy</span>
            <span className="copy__label copy__label--done">Copied</span>
          </button>
          <span className="visually-hidden" aria-live="polite">
            {copied ? "Source URL copied" : ""}
          </span>
        </div>
        <a className="link" href="/source.json" target="_blank" rel="noreferrer">
          View source.json
        </a>
        </div>
      </div>
    </section>
  );
}
