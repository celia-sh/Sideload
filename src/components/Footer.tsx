import { useReveal } from "../hooks/useReveal";

export function Footer() {
  const ref = useReveal<HTMLDivElement>(0.4);
  return (
    <footer className="footer">
      <div ref={ref} className="footer__mark reveal" aria-hidden="true">
        <img src="/assets/SIDELOAD.svg" alt="" width="452" height="70" loading="lazy" />
      </div>
      <div className="footer__row">
        <span>&copy; {new Date().getFullYear()} CELIA</span>
        <span className="footer__note">
          Apps in this source are unofficial third-party clients and are not
          affiliated with the services they connect to.
        </span>
        <a className="link" href="https://github.com/celia-sh" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
