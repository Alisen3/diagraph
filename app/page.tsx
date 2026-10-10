import type { CSSProperties } from "react";
import ParticleScene from "./particle-scene";
import CaseDemo from "./case-demo";
import { RevealObserver, TeamCarousel, ThemeToggle } from "./motion";

const PIPELINE = [
  ["Ingest records", "FHIR resources from synthetic Synthea patients, clinical notes and uploaded reports."],
  ["Extract mentions", "A language model extracts findings into a Zod schema and keeps the exact text span each came from."],
  ["Qualify findings", "Jev answers parallel questions per mention: present or negated, about the patient or someone else, current or historical."],
  ["Link to concepts", "Candidate concepts are retrieved by embedding search in pgvector, and Jev confirms the match."],
  ["Build the timeline", "Findings are ordered by onset, or by relative order when only the sequence is known, and duplicates merged."],
  ["Validate and store", "Contract and plausibility errors, such as a lab value outside physiological range, go back for a repair turn."],
];

const SOURCES = [
  ["PrimeKG", "Backbone of diseases, phenotypes, drugs and their relations"],
  ["Human Phenotype Ontology", "Symptom definitions and how often each appears in a disease"],
  ["ICD-11", "Diagnosis codes and display names"],
  ["Curated sequences", "Typical order of findings for the focus area, reviewed by a clinician advisor"],
];

const METRICS = [
  ["≥ 0.85", "Extraction: entity-level F1 on annotated synthetic notes"],
  ["≥ 0.95", "Qualification: negation and experiencer accuracy"],
  ["≥ 0.85", "Linking: concept accuracy at rank 1"],
  ["≥ 0.90", "Timeline: pairwise ordering accuracy of findings"],
  ["100%", "Grounding: displayed edges that have a source"],
  ["≥ 95%", "Explanations: sentences whose citation supports them"],
  ["0", "Safety: clinician-only content shown to patients"],
  ["≤ 0.05", "Calibration: expected calibration error per Jev question"],
];

// [month, work, deliverable]
const PLAN: [string, [string, string, string][]][] = [
  ["Semester I", [
    ["Oct 2026", "Requirements; import PrimeKG, HPO and ICD-11; schemas; Synthea setup; recruit a clinician advisor", "Requirements report, graph loaded"],
    ["Nov 2026", "Extraction, qualification and linking pipeline; timeline builder; annotated evaluation set", "Extraction demo with metrics"],
    ["Dec 2026", "Patient view with cited explanations and safety policy; roles, consent and audit", "Patient-side MVP"],
    ["Jan 2027", "Hardening, first-semester demonstration and report", "Semester I deliverables"],
  ]],
  ["Semester II", [
    ["Feb 2027", "Clinician workspace; candidate generation and probabilistic scoring; curated sequences", "Differential prototype"],
    ["Mar 2027", "Temporal matching; reranking and faithfulness checks; next best question; Jev calibration", "Calibration report"],
    ["Apr 2027", "Vignette evaluation; clinician ratings; patient comprehension study; fine-tuning experiment", "Evaluation results"],
    ["May 2027", "Final evaluation, report and demonstration", "Final report and demo"],
  ]],
];

// [role, name, optional photo in public/team]
const TEAM: [string, string, string?][] = [
  ["Team member", "Elif Su Temirel", "/team/elif-su-temirel.jpg"],
  ["Team member", "Bora Balcı", "/team/bora-balci.jpg"],
  ["Team member", "Asya Ünal"],
  ["Team member", "Ali Şen"],
  ["Team member", "Bilgehan Akın"],
  ["Supervisor", "Cevdet Aykanat"],
  ["Innovation expert", "Can Koyuncu", "/team/can-koyuncu.jpg"],
];

/** Splits a line into masked words that slide up when their block is revealed. */
function Words({ text, from = 0 }: { text: string; from?: number }) {
  return text.split(" ").map((word, i) => (
    <span key={i}>
      <span className="w" style={{ "--i": from + i } as CSSProperties}><span>{word}</span></span>{" "}
    </span>
  ));
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8052ff" />
          <stop offset="1" stopColor="#15846e" />
        </linearGradient>
      </defs>
      <path d="M3 4 L21 9 L9 21 Z" fill="url(#lg)" />
      <path d="M3 4 L21 9 L13 11 Z" fill="#8052ff" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <ParticleScene />
      <RevealObserver />

      <header className="wrap nav">
        <a href="#" className="wordmark" aria-label="DiaGraph home"><Logo />DiaGraph</a>
        <nav aria-label="Sections">
          <a href="#patients">Patients</a>
          <a href="#case">Case</a>
          <a href="#how">How it works</a>
          <a href="#team">Team</a>
        </nav>
        <ThemeToggle />
        <a className="pill" href="https://github.com/Alisen3/diagraph">GitHub</a>
      </header>

      <main>
        <section className="wrap landing" data-scene="hero">
          <h1 className="display reveal">
            <Words text="Your medical record, linked to sourced knowledge." />
            <span className="dim"><Words text="For patients and clinicians." from={7} /></span>
          </h1>
          <p className="scroll-cue label reveal fade">Scroll to explore</p>
        </section>

        <section className="wrap tall" data-scene="intro">
          <div className="block reveal">
            <h2><Words text="Records are scattered. Timing gets lost." /></h2>
            <p className="label">The problem</p>
            <p className="body">
              Medical information about a person is spread across visits, labs, prescriptions and discharge letters.
              Patients rarely see how these relate, so they turn to symptom checkers that only know what they type in.
              Clinicians have the expertise but little time, and a flat list of symptoms loses the order they appeared
              in, which often carries the diagnosis.
            </p>
            <p className="body">
              DiaGraph keeps two layers apart: a shared, read-only knowledge graph built from established sources, and
              a private timeline of dated findings for each patient, linked to concepts in that graph. One core serves
              two role-based views.
            </p>
            <a className="pill" href="#case">Follow one case</a>
          </div>
        </section>

        <section id="patients" className="wrap tall" data-scene="patients">
          <div className="block right reveal">
            <h2><Words text="Understand your own record." /></h2>
            <p className="label">Patient view</p>
            <p className="body">
              Patients see the part of the graph that relates to them: their conditions, medications, test results
              and symptoms, explained in plain language. Every sentence cites the edge and source it comes from, and
              Jev rejects explanations that claim more than the citations support. The patient view never ranks
              diagnoses and hides risk links to diseases the patient has not been diagnosed with.
            </p>
            <blockquote className="quote">
              Metformin is one of the standard first treatments for type 2 diabetes<sup className="cite">1</sup>. Your
              HbA1c test reflects your average blood sugar over roughly the past three months<sup className="cite">2</sup>.
              Your latest result was higher than the one before it; this is a good question to raise with your doctor.
            </blockquote>
            <p className="note">[1] treated_by edge, [2] lab_evidence edge, sources cited in the app.</p>
          </div>
        </section>

        <section className="wrap tall" data-scene="clinicians">
          <div className="block reveal">
            <h2><Words text="Reason with evidence, not guesses." /></h2>
            <p className="label">Clinician view, with patient consent</p>
            <p className="body">
              Clinicians work from the timeline. Next to it, a ranked differential shows each candidate&apos;s score,
              the findings for and against it, how well the timeline matches its typical sequence, and the question
              that would best separate the leading candidates. What they confirm or rule out flows back into the
              patient&apos;s view.
            </p>
            <dl className="ddx-static">
              <div><dt><span>Acute appendicitis</span><b>71%</b></dt><dd>For: periumbilical pain migrating to the right lower quadrant, fever after pain onset, leukocytosis. Sequence match 0.92.</dd></div>
              <div><dt><span>Gastroenteritis</span><b>9%</b></dt><dd>Against: no diarrhea documented, atypical pain migration. Sequence match 0.31.</dd></div>
            </dl>
          </div>
        </section>

        <section id="case" className="wrap tall" data-scene="case">
          <div className="block right reveal">
            <h2><Words text="Timing carries diagnostic information." /></h2>
            <p className="label">Try it</p>
            <p className="body">
              In acute appendicitis, pain typically starts around the navel, moves to the lower right abdomen, and is
              followed by nausea and then fever. Add the findings of one synthetic case in order and watch the
              differential change.
            </p>
          </div>
          {/* a second "case" key holds the quiet pose until the demo itself is centred */}
          <div className="reveal fade" data-scene="case"><CaseDemo /></div>
        </section>

        <section id="how" className="wrap tall" data-scene="how">
          <h2 className="display reveal"><Words text="The model proposes. Structure decides." /></h2>
          <div className="columns">
            <div className="principles reveal fade">
              <div>
                <p className="label">Facts come from sources, not models</p>
                <p className="body">A model inventing medical relations would be the medical version of a hallucinated citation. Every edge in the graph comes from an established resource and keeps its provenance.</p>
                <dl className="sources">
                  {SOURCES.map(([name, role]) => (<div key={name}><dt>{name}</dt><dd>{role}</dd></div>))}
                </dl>
              </div>
              <div>
                <p className="label">Language models extract and explain</p>
                <p className="body">They read records into a typed schema and write explanations from a retrieved subgraph, citing an edge for every sentence. They never add facts to the graph.</p>
              </div>
              <div>
                <p className="label">A calibrated classifier makes the small decisions</p>
                <p className="body">Jev, from TypeSafe AI, returns calibrated probabilities for typed questions: negation, experiencer, temporality, linking and faithfulness. Confident answers are used directly; only the uncertain band goes to a language model. Since the vendor&apos;s speed and cost figures are self-reported, we measure accuracy and calibration ourselves on about 300 labeled examples per question.</p>
              </div>
            </div>
            <ol className="pipeline reveal fade">
              {PIPELINE.map(([title, text], i) => (
                <li key={title}><span className="n">{i}</span><div><b>{title}</b><p>{text}</p></div></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="wrap tall" data-scene="privacy">
          <div className="block right reveal">
            <h2><Words text="Built for health data." /></h2>
            <p className="label">Privacy by design</p>
            <p className="body">
              The prototype uses synthetic patients only. A patient shares their record with a specific clinician,
              optionally limited in scope, with an expiry date, and can revoke it at any time. Role and consent rules
              are enforced in the database with Row Level Security, and every clinician read lands in an append-only
              audit log the patient can see.
            </p>
            <p className="body">
              Health data is special category data under KVKK and the GDPR, and software that informs diagnosis is
              medical device territory. DiaGraph does not seek certification, but follows the same principles: every
              suggestion shows its evidence and the clinician stays the decision maker.
            </p>
          </div>
        </section>

        <section className="wrap tall" data-scene="measure">
          <div className="block reveal">
            <h2><Words text="Measured, not assumed." /></h2>
            <p className="label">Focus: acute abdominal pain in adults</p>
            <p className="body">
              Every change to prompts, schemas or models runs the evaluation suite in CI, and regressions block the
              merge. The differential is tested on published clinical vignettes and Synthea cases against two baselines (the score without timing, and a language model given the whole record), and rated by three to
              five clinicians. A comprehension study with 20 to 30 participants compares the patient view with reading
              the raw record. Both studies will seek ethics approval first.
            </p>
          </div>
          <dl className="metrics reveal fade" data-scene="measure">
            {METRICS.map(([value, what]) => (<div key={what}><dt>{value}</dt><dd>{what}</dd></div>))}
          </dl>
        </section>

        <section className="wrap tall" data-scene="plan">
          <div className="block right reveal">
            <h2><Words text="Two semesters, patient side first." /></h2>
            <p className="body">We are in October 2026: requirements, knowledge graph import and synthetic data setup.</p>
            <div className="plan">
              {PLAN.map(([term, items]) => (
                <div key={term}>
                  <p className="label">{term}</p>
                  <ol>
                    {items.map(([month, work, deliverable]) => (
                      <li key={month} className={month === "Oct 2026" ? "now" : undefined}>
                        <time>{month}</time><span>{work}</span><em>{deliverable}</em>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="wrap team-section" data-scene="team">
          <h2 className="reveal"><Words text="Our team." /></h2>
          <TeamCarousel people={TEAM} />
        </section>

        <section className="wrap closing" data-scene="closing">
          <h2 className="display reveal">
            <Words text="One record, two views." />
            <span className="dim"><Words text="Every claim sourced." from={4} /></span>
          </h2>
          <a className="pill" href="https://github.com/Alisen3/diagraph">View on GitHub</a>
        </section>
      </main>

      <footer className="wrap foot">
        <p>DiaGraph is a research prototype developed on synthetic data. It is not a medical device and does not replace professional medical advice.</p>
        <p>Department of Computer Engineering, Bilkent University, 2026–2027</p>
      </footer>
    </>
  );
}
