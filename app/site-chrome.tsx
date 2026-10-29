import Link from "next/link";
import { ThemeToggle } from "./motion";

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{diagonal ? <path d="M6 18 18 6M6 6h12v12" /> : <path d="M4 12h16m-6-6 6 6-6 6" />}</svg>;
}

export function Wordmark() {
  return <Link href="/" className="wordmark" aria-label="DiaGraph home"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m4 4 16 5-10 12L4 4Z" stroke="currentColor" strokeWidth="1.4"/><path d="m4 4 9 8 7-3m-7 3-3 9" stroke="currentColor" strokeWidth="1.4"/><circle cx="13" cy="12" r="2" fill="currentColor"/></svg>DiaGraph</Link>;
}

export function Header() {
  return <header className="wrap nav">
    <Wordmark />
    <nav aria-label="Main navigation"><Link href="/#patients">For patients</Link><Link href="/#clinicians">For doctors</Link><Link href="/#how">How it works</Link><Link href="/#team">Team</Link></nav>
    <ThemeToggle />
    <Link href="/project" className="nav-project">Project <Arrow diagonal /></Link>
  </header>;
}

export function Footer() {
  return <footer className="wrap foot">
    <div className="footer-top"><Wordmark /><p>One record. A shared understanding.</p><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/project">Project</Link><a href="https://github.com/Alisen3/diagraph">GitHub <Arrow diagonal /></a></nav></div>
    <div className="footer-bottom"><p>In development · Bilkent University · 2026–2027</p><p>Research prototype. Not for clinical use.</p></div>
  </footer>;
}
