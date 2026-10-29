import type { Metadata } from "next";
import Link from "next/link";
import { Header, Footer, Arrow } from "../site-chrome";
import { TEAM } from "../project-data";
export const metadata: Metadata = { title: "The project — DiaGraph", description: "DiaGraph at Bilkent University: project overview, team and documents." };
export default function Project() {
  return <><Header/><main className="wrap document-page"><header><p className="label">Bilkent University · CS 491 / CS 492 · 2026–2027</p><h1>A connected record.<br/><span className="dim">A shared ambition.</span></h1><p className="document-lead">DiaGraph is a senior design project exploring a causal medical knowledge graph for patients and doctors. Our aim is to connect fragmented records, make health history understandable and support clinical reasoning with evidence.</p></header><div className="document-sections">
    <section><span className="section-number">01</span><div><h2>Project resources</h2><ul className="resource-list"><li><a href="https://docs.google.com/document/d/1XvnjB-F8EYGePmNms8QoD052MrQVGYSTBpURIPuRWoE/edit" target="_blank" rel="noreferrer"><span>Project brief<small>Scope, approach and development plan</small></span><Arrow diagonal/></a></li><li><a href="https://github.com/Alisen3/diagraph"><span>GitHub repository<small>Website source</small></span><Arrow diagonal/></a></li><li><a href="https://www.cs.bilkent.edu.tr/~cs4912/current/CS491.html"><span>CS 491 course<small>Bilkent University Computer Engineering</small></span><Arrow diagonal/></a></li></ul></div></section>
    <section><span className="section-number">02</span><div><h2>Reports</h2><p>Project specifications, analysis and requirements, and final reports will be linked here as they are published.</p></div></section>
    <section><span className="section-number">03</span><div><h2>The team</h2><dl className="project-team">{TEAM.map(([role,name])=><div key={name}><dt>{name}</dt><dd>{role}</dd></div>)}</dl></div></section>
    <section><span className="section-number">04</span><div><h2>Research and responsible development</h2><p>We plan to evaluate record understanding, the quality of diagnostic suggestions, the reliability of graph connections and the clarity of patient explanations. Development uses synthetic data; the project is not a clinical service.</p><Link href="/privacy" className="text-link">Read our approach to privacy <Arrow/></Link></div></section>
  </div></main><Footer/></>;
}
