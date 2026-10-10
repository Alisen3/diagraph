import CaseDemo from "./case-demo";
import Constellation from "./constellation";

const PIPELINE = [
  ["Ingest records", "FHIR resources, clinical notes and uploaded reports come in."],
  ["Extract mentions", "A language model pulls out findings in a fixed schema, keeping the exact sentence each came from."],
  ["Qualify findings", "Jev decides whether each finding is present or negated, whom it refers to, and when it happened."],
  ["Link to concepts", "Each finding is matched to a concept in the graph by embedding search, and Jev confirms the match."],
  ["Build the timeline", "Findings are ordered by time and duplicates are merged."],
  ["Validate and store", "Implausible results, like a lab value outside physiological range, go back for a repair turn."],
];

const METRICS = [
  ["≥ 0.85", "Entity-level F1 for extraction on annotated synthetic notes"],
  ["≥ 0.95", "Accuracy for negation and who a finding refers to"],
  ["≥ 0.85", "Concept linking accuracy at rank 1"],
  ["100%", "Displayed edges that have a source"],
  ["≥ 95%", "Explanation sentences whose citation supports them"],
  ["0", "Cases of clinician-only content shown to patients"],
  ["≤ 0.05", "Expected calibration error per Jev question"],
  ["Top-k", "Differential accuracy on vignettes, against two baselines"],
];

const PLAN: [string, [string, string][]][] = [
  ["Semester I", [
    ["Oct 2026", "Requirements, knowledge graph import, schemas, synthetic patients"],
    ["Nov 2026", "Extraction, qualification and linking pipeline; timeline builder"],
    ["Dec 2026", "Patient view with cited explanations; roles, consent and audit"],
    ["Jan 2027", "Hardening, first-semester demo and report"],
  ]],
  ["Semester II", [
    ["Feb 2027", "Clinician workspace, candidate generation and scoring"],
    ["Mar 2027", "Temporal matching, faithfulness checks, next best question"],
    ["Apr 2027", "Vignette evaluation, clinician ratings, patient comprehension study"],
    ["May 2027", "Final evaluation, report and demonstration"],
  ]],
];

const TEAM = [
  ["Team member", "Elif Su Temirel"],
  ["Team member", "Bora Balcı"],
  ["Team member", "Asya Ünal"],
  ["Team member", "Ali Şen"],
  ["Team member", "Bilgehan Akın"],
  ["Supervisor", "Cevdet Aykanat"],
  ["Innovation expert", "Can Koyuncu"],
];

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
      <header className="wrap nav">
        <a href="#" className="wordmark" aria-label="DiaGraph home"><Logo />DiaGraph</a>
        <nav aria-label="Sections">
          <a href="#case">Case</a>
          <a href="#views">Views</a>
          <a href="#how">How it works</a>
          <a href="#team">Team</a>
        </nav>
        <a className="pill" href="https://github.com/Alisen3/diagraph">GitHub</a>
      </header>

      <main>
        <section className="wrap hero">
          <div className="hero-copy">
            <h1>Health records, connected to what medicine knows.</h1>
            <p className="label">CS491 Senior Design, Bilkent University</p>
            <p className="body">
              DiaGraph turns a patient&apos;s records into a timeline of findings and links each one to a medical
              knowledge graph built from established sources. Patients get plain-language explanations of their own
              record. Clinicians, with consent, get a ranked differential with the evidence for and against each
              candidate.
            </p>
            <a className="link" href="#case">Follow one case</a>
          </div>
          <Constellation />
        </section>

        <section id="case" className="wrap section">
          <div className="split">
            <h2>Timing carries diagnostic information.</h2>
            <div>
              <p className="label">The case</p>
              <p className="body">
                In acute appendicitis, pain usually starts around the navel, moves to the lower right abdomen, and is
                followed by nausea and then fever. A flat list of symptoms loses that order. Add the findings of one
                case in the order they were recorded and watch the differential change.
              </p>
            </div>
          </div>
          <CaseDemo />
        </section>

        <section id="views" className="wrap section">
          <div className="split reverse">
            <h2>One record, two views.</h2>
            <div>
              <p className="label">Patients and clinicians</p>
              <p className="body">
                Both share one core but see different things. The ranked differential exists only in the clinician
                view. The patient view explains what is already in the record, and every sentence cites its source.
              </p>
            </div>
          </div>
          <div className="views">
            <figure>
              <p className="label">What a patient sees</p>
              <blockquote>
                Your record lists type 2 diabetes and a medication called metformin. Metformin is one of the standard
                first treatments for type 2 diabetes<sup className="cite">1</sup>. Your HbA1c test is connected to
                diabetes because it reflects your average blood sugar over roughly the past three months
                <sup className="cite">2</sup>. Your latest result was higher than the one before it; this is a good
                question to raise with your doctor.
              </blockquote>
              <ol className="sources">
                <li>treated_by edge, source cited in the app</li>
                <li>lab_evidence edge, source cited in the app</li>
              </ol>
            </figure>
            <figure>
              <p className="label">What a clinician sees, with consent</p>
              <dl className="ddx-static">
                <div>
                  <dt><span>Acute appendicitis</span><b>71%</b></dt>
                  <dd>For: periumbilical pain migrating to the right lower quadrant, fever after pain onset, leukocytosis. Sequence match 0.92.</dd>
                </div>
                <div>
                  <dt><span>Gastroenteritis</span><b>9%</b></dt>
                  <dd>For: abdominal pain, nausea. Against: no diarrhea documented, atypical pain migration.</dd>
                </div>
              </dl>
              <p className="ask">Ask next: is there rebound tenderness or pain on coughing?</p>
            </figure>
          </div>
          <p className="body note">
            Sharing is explicit, scoped and time-limited. A patient grants access to a specific clinician, can revoke it
            at any time, and sees every read in an audit log.
          </p>
        </section>

        <section id="how" className="wrap section">
          <h2 className="statement">The language model proposes. Structure and verification decide.</h2>
          <div className="split top">
            <div className="principles">
              <div>
                <p className="label">Facts come from sources</p>
                <p className="body">
                  The graph is assembled from PrimeKG, the Human Phenotype Ontology and ICD-11, plus curated symptom
                  sequences reviewed by a clinician. It is never generated by a model, and every edge keeps its source.
                </p>
              </div>
              <div>
                <p className="label">Models extract and explain</p>
                <p className="body">
                  A language model reads records and writes explanations, but it only sees the retrieved subgraph and
                  must cite an edge for every sentence. Text that claims more than its citations is rejected.
                </p>
              </div>
              <div>
                <p className="label">A calibrated classifier checks</p>
                <p className="body">
                  Jev, from TypeSafe AI, answers the many small yes-or-no questions with calibrated probabilities.
                  Confident answers are used directly; only uncertain ones go to a language model.
                </p>
              </div>
            </div>
            <div>
              <h3>From a record to a timeline</h3>
              <ol className="pipeline">
                {PIPELINE.map(([title, text], i) => (
                  <li key={title}>
                    <span className="n">{i}</span>
                    <div><b>{title}</b><p>{text}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="wrap section">
          <div className="split reverse">
            <h2>Built for health data.</h2>
            <ul className="facts">
              <li><p className="label">Synthetic data only</p><p className="body">The prototype is built and tested on synthetic patients. No real patient data is used.</p></li>
              <li><p className="label">Checks in the database</p><p className="body">Role and consent rules are enforced by Row Level Security, not only in application code.</p></li>
              <li><p className="label">Nothing to alarm patients</p><p className="body">Risk links to serious diseases and ranked diagnoses never reach the patient view.</p></li>
            </ul>
          </div>
        </section>

        <section className="wrap section">
          <div className="split">
            <h2>How we will measure it.</h2>
            <div>
              <p className="label">Focus: acute abdominal pain in adults</p>
              <p className="body">Every change runs this suite, and regressions block the merge.</p>
            </div>
          </div>
          <dl className="metrics">
            {METRICS.map(([value, what]) => (
              <div key={what}><dt>{value}</dt><dd>{what}</dd></div>
            ))}
          </dl>
        </section>

        <section className="wrap section">
          <div className="split start">
            <h2>Two semesters, patient side first.</h2>
            <div className="plan">
              {PLAN.map(([term, items]) => (
                <div key={term}>
                  <p className="label">{term}</p>
                  <ol>
                    {items.map(([month, work]) => (
                      <li key={month}><time>{month}</time><span>{work}</span></li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="team" className="wrap section">
          <h2>Team.</h2>
          <ul className="team">
            {TEAM.map(([role, name]) => (
              <li key={name}><span>{role}</span>{name}</li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="wrap foot">
        <p>
          DiaGraph is a research prototype. It is not a medical device and does not replace professional medical
          advice. It is developed and evaluated on synthetic and credentialed research data only.
        </p>
        <p>Department of Computer Engineering, Bilkent University, 2026–2027</p>
      </footer>
    </>
  );
}
