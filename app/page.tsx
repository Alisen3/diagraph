import type { CSSProperties } from "react";
import Link from "next/link";
import ParticleScene from "./particle-scene";
import AgentGraph from "./agent-graph";
import CaseDemo from "./case-demo";
import { RevealObserver, TeamCarousel } from "./motion";
import { Arrow, Header, Footer } from "./site-chrome";
import { TEAM, KNOWLEDGE, DATASETS } from "./project-data";

const EVALUATION = [
  ["Accuracy", "How well the diagnostic suggestions compare with a language model alone."],
  ["Evidence", "Whether connections in the graph hold up to clinician review."],
  ["Understanding", "How accurately the system reads records in English and Turkish."],
  ["Clarity", "Whether patients understand the explanations of their health records."],
];

function Words({ text }: { text: string }) {
  return text.split(" ").map((word, i) => <span key={i}><span className="w" style={{ "--i": i } as CSSProperties}><span>{word}</span></span>{" "}</span>);
}

export default function Home() {
  return <>
    <RevealObserver />
    <ParticleScene />
    <Header />
    <main>
      <section className="wrap hero" data-scene="hero" aria-labelledby="hero-title">
        <div className="hero-copy reveal">
          <p className="label">Connected health intelligence</p>
          <h1 id="hero-title"><Words text="Your health." /><br/><span className="dim"><Words text="In context." /></span></h1>
          <p className="body hero-description">We&apos;re building one connected health record. A clearer history for patients. Evidence-backed reasoning for doctors.</p>
          <a className="pill" href="#patients">Explore DiaGraph <Arrow /></a>
        </div>
        <div className="hero-art"><div className="scene-slot" data-visual="brain" aria-hidden="true"/><p className="art-caption"><span className="status-dot"/> One causal medical knowledge graph</p></div>
        <a className="scroll-cue" href="#intro">Discover the connection <span aria-hidden="true">↓</span></a>
      </section>

      <section id="intro" data-scene="intro" className="wrap intro-section">
        <p className="label reveal fade">The whole picture matters</p>
        <div className="intro-grid"><h2 className="reveal"><Words text="Health happens over time. Records should connect." /></h2><div className="reveal fade"><p className="body">Visits, results and prescriptions are scattered across systems and years. The connections between them are easy to miss.</p><p className="body">DiaGraph will bring that history together, linking each finding to its source and to trusted medical knowledge. So every new piece of information has context.</p></div></div>
      </section>

      <section id="patients" data-scene="patients" className="wrap product-section">
        <div className="scene-slot" data-visual="body" aria-hidden="true"/>
        <div className="block reveal"><p className="label">For patients</p><h2><Words text="Understand your own story." /></h2><p className="body">Your conditions, medications and results, connected in one history and explained in plain language. See where information comes from and arrive at your next appointment with better questions.</p><p className="body">Your view will focus on understanding your record, with diagnostic reasoning reserved for your doctor.</p></div>
      </section>

      <section id="clinicians" data-scene="clinicians" className="wrap product-section">
        <div className="block reveal"><p className="label">For doctors</p><h2><Words text="More context. Clearer reasoning." /></h2><p className="body">See the full timeline and the connections that matter. DiaGraph will use causal reasoning to explore possible diagnoses, show the evidence behind them and suggest what to investigate next.</p><p className="body">One shared record connects both views. You bring the clinical judgment.</p></div>
        <div className="scene-slot" data-visual="graph" aria-hidden="true"/>
      </section>

      <section id="walkthrough" data-scene="case" className="wrap walkthrough-section">
        <div className="section-heading reveal"><p className="label">See the idea in action</p><h2><Words text="One history. A growing picture." /></h2><p className="body">Follow a fictional health history as records come together. Add a visit, a result or an update, then switch between the patient and doctor perspectives.</p></div>
        <CaseDemo />
      </section>

      <section id="how" data-scene="how" className="wrap agents-section">
        <div className="agent-intro"><div className="section-heading reveal"><p className="label">How it works</p><h2><Words text="Specialist agents. One connected graph." /></h2><p className="body">DiaGraph will bring together agents to reason over your history, follow changes over time and find new evidence. They work on the same sourced graph. Clinicians review and approve additions.</p></div><div className="scene-slot" data-visual="graph" aria-hidden="true"/></div>
        <AgentGraph />
        <div className="source-strip"><p className="label">Built on established knowledge</p><div className="source-links">{KNOWLEDGE.map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name}<Arrow diagonal /></a>)}</div><div className="dataset-row"><span>Developed with synthetic data</span>{DATASETS.map(([name,url])=><a key={name} href={url} target="_blank" rel="noreferrer">{name}<Arrow diagonal /></a>)}</div></div>
      </section>

      <section id="research" data-scene="measure" className="wrap research-section">
        <div className="intro-grid"><div className="block reveal"><p className="label">What we plan to evaluate</p><h2><Words text="Trust is something you test." /></h2></div><p className="body reveal fade">We will evaluate how well DiaGraph understands records, supports clinical reasoning and explains information to patients, using synthetic records, clinical examples and clinician review.</p></div>
        <dl className="metrics">{EVALUATION.map(([name,text],i)=><div key={name}><span className="metric-index">0{i+1}</span><dt>{name}</dt><dd>{text}</dd></div>)}</dl>
      </section>

      <section id="team" data-scene="team" className="wrap team-section"><div className="section-heading reveal"><p className="label">The people behind DiaGraph</p><h2><Words text="Built with a shared purpose." /></h2></div><TeamCarousel people={TEAM}/></section>

      <section className="wrap closing" data-scene="closing"><div className="closing-copy"><p className="label">One record. Two perspectives.</p><h2>A better understanding<br/><span className="dim">starts with connection.</span></h2><div className="closing-links"><Link className="pill" href="/project">Follow the project <Arrow /></Link><Link className="text-link" href="/privacy">Our approach to privacy <Arrow /></Link></div></div><div className="scene-slot" data-visual="brain" aria-hidden="true"/></section>
    </main>
    <Footer />
  </>;
}
