"use client";

import { useEffect, useRef, useState } from "react";

/** Counts 0 to 100 while the scene spins up, then lifts away and lets the hero text in. */
export function Preloader() {
  const [n, setN] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const quick = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    const length = quick ? 200 : 1600;
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / length);
      setN(Math.round((1 - (1 - p) ** 3) * 100));
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        document.documentElement.classList.add("loaded");
        setTimeout(() => setDone(true), 200);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className={`preloader${done ? " done" : ""}`} aria-hidden="true">
      <span className="label">Loading</span>
      <span className="count">{n}</span>
    </div>
  );
}

/** Adds .in to every .reveal element as it scrolls into view. */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      }),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

export function TeamCarousel({ people }: { people: [string, string][] }) {
  const track = useRef<HTMLUListElement>(null);
  const move = (dir: number) => {
    const el = track.current!;
    const card = el.firstElementChild as HTMLElement;
    el.scrollBy({ left: dir * (card.offsetWidth + 36), behavior: "smooth" });
  };
  return (
    <div className="carousel">
      <ul ref={track} className="team">
        {people.map(([role, name]) => (
          <li key={name}>
            <span className="portrait" aria-hidden="true">{name.split(" ").map((p) => p[0]).join("")}</span>
            <span className="role">{role}</span>
            <span className="name">{name}</span>
          </li>
        ))}
      </ul>
      <div className="carousel-nav">
        <button type="button" className="ghost" onClick={() => move(-1)}>Previous</button>
        <button type="button" className="ghost" onClick={() => move(1)}>Next</button>
      </div>
    </div>
  );
}

/** Switches between the dark and light theme and remembers the choice. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => setTheme(document.documentElement.dataset.theme ?? "dark"), []);
  const next = theme === "light" ? "dark" : "light";
  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    setTheme(next);
  };
  return (
    <button type="button" className="ghost theme-toggle" onClick={toggle} aria-label={`Switch to ${next} theme`}>
      {theme === "light" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      )}
    </button>
  );
}
