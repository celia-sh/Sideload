import { Apps } from "./components/Apps";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Manual } from "./components/Manual";
import { useReducedMotion } from "./hooks/useReducedMotion";

export function App() {
  const reducedMotion = useReducedMotion();
  return (
    <main className={reducedMotion ? "is-still" : undefined}>
      <Hero reducedMotion={reducedMotion} />
      <Apps reducedMotion={reducedMotion} />
      <Manual />
      <Footer />
    </main>
  );
}
