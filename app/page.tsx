import CaseDemo from "./case-demo";

const PIPELINE = [
  ["Ingest records", "FHIR resources, clinical notes and uploaded reports come in."],
  ["Extract mentions", "A language model pulls out findings in a fixed schema, keeping the exact sentence each came from."],
  ["Qualify findings", "Jev decides whether each finding is present or negated, whom it refers to, and when it happened."],
  ["Link to concepts", "Each finding is matched to a concept in the graph by embedding search, and Jev confirms the match."],
  ["Build the timeline", "Findings are ordered by time and duplicates are merged."],
  ["Validate and store", "Implausible results, like a lab value outside physiological range, go back for a repair turn."],
];

const METRICS = [
  ["Extraction", "Entity-level F1 on annotated synthetic notes", "0.85 or higher"],
  ["Qualification", "Negation and experiencer accuracy", "0.95 or higher"],
  ["Linking", "Correct concept at rank 1", "0.85 or higher"],
  ["Grounding", "Displayed edges that have a source", "100%"],
  ["Explanations", "Sentences whose citation supports them", "95% or higher"],
  ["Safety", "Clinician-only content shown to patients", "0 cases"],
  ["Differential", "Top-1, top-3 and top-10 accuracy on clinical vignettes", "Beat both baselines"],
  ["Calibration", "Expected calibration error per Jev question", "0.05 or lower"],
];

const PLAN = [
  ["Oct 2026", "Requirements, knowledge graph import, schemas, synthetic patients"],
  ["Nov 2026", "Extraction, qualification and linking pipeline; timeline builder"],
  ["Dec 2026", "Patient view with cited explanations; roles, consent and audit"],
  ["Jan 2027", "Hardening, first-semester demo and report"],
  ["Feb 2027", "Clinician workspace, candidate generation and scoring"],
  ["Mar 2027", "Temporal matching, faithfulness checks, next best question"],
  ["Apr 2027", "Vignette evaluation, clinician ratings, patient comprehension study"],
  ["May 2027", "Final evaluation, report and demonstration"],
];

const TEAM = ["Elif Su Temirel", "Bora Balcı", "Asya Ünal", "Ali Şen", "Bilgehan Akın"];

export default function Home() {
  return (
    <>
      <header className="top">
        <div className="wrap top-inner">
          <a href="#" className="wordmark" aria-label="DiaGraph home">
            <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="var(--scrub)"/><g stroke="var(--paper)" strokeWidth="1.8"><path d="M8 10l9 6M8 22l9-6M17 16h8"/></g><circle cx="8" cy="10" r="3" fill="var(--paper)"/><circle cx="8" cy="22" r="3" fill="var(--paper)"/><circle cx="17" cy="16" r="3" fill="var(--paper)"/><circle cx="25" cy="16" r="3" fill="var(--hl)"/></svg>
            DiaGraph
          </a>
          <nav aria-label="Sections">
            <a href="#case">The case</a>
            <a href="#views">Two views</a>
            <a href="#how">How it works</a>
            <a href="#team">Team</a>
            <a href="https://github.com/Alisen3/diagraph">GitHub</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero wrap">
          <h1>Health records, connected to what medicine knows.</h1>
          <p className="lede">
            DiaGraph turns a patient&apos;s records into a timeline of findings and links each one to a medical knowledge
            graph built from established sources. Patients get plain-language explanations of their own record.
            Clinicians, with the patient&apos;s consent, get a ranked differential with the evidence for and against each
            candidate.
          </p>
          <p className="byline">A CS491 Senior Design Project in Computer Engineering at Bilkent University.</p>
        </section>

        <section id="case" className="wrap block">
          <h2>Timing carries diagnostic information</h2>
          <p className="intro">
            In acute appendicitis, pain usually starts around the navel, moves to the lower right abdomen, and is
            followed by nausea and then fever. A flat list of symptoms loses that order. Add the findings of one case
            in the order they were recorded and watch the differential change.
          </p>
          <CaseDemo />
        </section>

        <section id="views" className="wrap block">
          <h2>One record, two views</h2>
          <p className="intro">
            Patients and clinicians share one core but see different things. The ranked differential exists only in
            the clinician view. The patient view explains what is already in the record.
          </p>
          <div className="views">
            <figure className="view patient">
              <figcaption>What a patient sees</figcaption>
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
            <figure className="view clinician">
              <figcaption>What a clinician sees, with consent</figcaption>
              <dl className="ddx-static">
                <div>
                  <dt>Acute appendicitis <b>71%</b></dt>
                  <dd><em>For:</em> periumbilical pain migrating to the right lower quadrant, fever after pain onset, leukocytosis</dd>
                  <dd><em>Sequence match:</em> 0.92</dd>
                </div>
                <div>
                  <dt>Gastroenteritis <b>9%</b></dt>
                  <dd><em>For:</em> abdominal pain, nausea</dd>
                  <dd><em>Against:</em> no diarrhea documented, atypical pain migration</dd>
                </div>
              </dl>
              <p className="ask">Ask next: is there rebound tenderness or pain on coughing?</p>
            </figure>
          </div>
          <p className="aside">
            Sharing is explicit, scoped and time-limited. A patient grants access to a specific clinician, can revoke it
            at any time, and sees every read in an audit log. When a clinician confirms or rules out a finding, it
            appears in the patient&apos;s view with that attribution.
          </p>
        </section>

        <section id="how" className="wrap block">
          <h2>The language model proposes. Structure and verification decide.</h2>
          <div className="principles">
            <div>
              <h3>Facts come from sources</h3>
              <p>
                The graph is assembled from PrimeKG, the Human Phenotype Ontology and ICD-11, plus curated symptom
                sequences reviewed by a clinician. It is never generated by a model, and every edge keeps its source.
              </p>
            </div>
            <div>
              <h3>Models extract and explain</h3>
              <p>
                A language model reads records and writes explanations, but it only sees the retrieved subgraph and has
                to cite an edge for every sentence. Text that claims more than its citations is rejected.
              </p>
            </div>
            <div>
              <h3>A calibrated classifier checks</h3>
              <p>
                Jev, from TypeSafe AI, answers the many small yes-or-no questions with calibrated probabilities.
                Confident answers are used directly, and only the uncertain ones go to a language model.
              </p>
            </div>
          </div>

          <h3 className="sub">From a record to a timeline</h3>
          <ol className="pipeline">
            {PIPELINE.map(([title, text]) => (
              <li key={title}>
                <b>{title}</b>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="wrap block">
          <h2>Built for health data</h2>
          <ul className="facts">
            <li><b>Synthetic data only.</b> The prototype is built and tested on synthetic patients. No real patient data is used.</li>
            <li><b>Checks in the database.</b> Role and consent rules are enforced by Row Level Security, not only in application code.</li>
            <li><b>Nothing to alarm patients.</b> Risk links to serious diseases and ranked diagnoses never reach the patient view.</li>
          </ul>
        </section>

        <section className="wrap block">
          <h2>How we will measure it</h2>
          <p className="intro">The clinical focus is acute abdominal pain in adults. Every change runs this suite, and regressions block the merge.</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th scope="col">Area</th><th scope="col">Metric</th><th scope="col">Target</th></tr>
              </thead>
              <tbody>
                {METRICS.map(([a, m, t]) => (
                  <tr key={a}><th scope="row">{a}</th><td>{m}</td><td>{t}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="wrap block">
          <h2>Plan</h2>
          <p className="intro">Two semesters, patient side first. The first semester is marked in green.</p>
          <ol className="plan">
            {PLAN.map(([month, work]) => (
              <li key={month}>
                <time>{month}</time>
                <span>{work}</span>
              </li>
            ))}
          </ol>
        </section>

        <section id="team" className="wrap block">
          <h2>Team</h2>
          <ul className="team">
            {TEAM.map((name) => <li key={name}>{name}</li>)}
          </ul>
          <dl className="advisors">
            <div><dt>Supervisor</dt><dd>Cevdet Aykanat</dd></div>
            <div><dt>Innovation expert</dt><dd>Can Koyuncu</dd></div>
          </dl>
        </section>
      </main>

      <footer className="wrap foot-wrap">
        <div className="foot">
        <p>
          DiaGraph is a research prototype. It is not a medical device and does not replace professional medical
          advice. It is developed and evaluated on synthetic and credentialed research data only.
        </p>
        <p>Department of Computer Engineering, Bilkent University, 2026–2027</p>
        </div>
      </footer>
    </>
  );
}
