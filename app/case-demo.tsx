"use client";

import { useState } from "react";

type Phenotype = "navel" | "rlq" | "nausea" | "anorexia" | "diarrhea" | "fever" | "wbc";
type Disease = "app" | "gastro" | "mes";

const PHENOTYPES: { id: Phenotype; label: string; y: number }[] = [
  { id: "navel", label: "Pain around the navel", y: 30 },
  { id: "rlq", label: "Right lower quadrant pain", y: 74 },
  { id: "nausea", label: "Nausea", y: 118 },
  { id: "anorexia", label: "Loss of appetite", y: 162 },
  { id: "diarrhea", label: "Diarrhea", y: 206 },
  { id: "fever", label: "Fever", y: 250 },
  { id: "wbc", label: "Leukocytosis", y: 294 },
];

const DISEASES: { id: Disease; label: string; y: number }[] = [
  { id: "gastro", label: "Gastroenteritis", y: 74 },
  { id: "app", label: "Acute appendicitis", y: 162 },
  { id: "mes", label: "Mesenteric adenitis", y: 250 },
];

// presents_with edges, as in the shared knowledge graph
const EDGES: [Disease, Phenotype][] = [
  ["app", "navel"], ["app", "rlq"], ["app", "nausea"], ["app", "anorexia"], ["app", "fever"], ["app", "wbc"],
  ["gastro", "navel"], ["gastro", "nausea"], ["gastro", "diarrhea"], ["gastro", "fever"],
  ["mes", "navel"], ["mes", "rlq"], ["mes", "fever"],
];

type Step = {
  time: string;
  note: string;
  present: Phenotype[];
  absent: Phenotype[];
  scores: Record<Disease, number>;
  sequence: number;
  question: string;
  gain: number;
};

// Illustrative numbers for a synthetic case, not model output.
const STEPS: Step[] = [
  {
    time: "Day 0, 08:00",
    note: "Pain started around the navel this morning.",
    present: ["navel"],
    absent: [],
    scores: { gastro: 0.41, app: 0.32, mes: 0.27 },
    sequence: 0.31,
    question: "Has the pain moved since it started?",
    gain: 0.41,
  },
  {
    time: "Day 0, 14:00",
    note: "Pain has moved to the lower right abdomen.",
    present: ["rlq"],
    absent: [],
    scores: { app: 0.58, mes: 0.25, gastro: 0.17 },
    sequence: 0.68,
    question: "Any diarrhea or vomiting?",
    gain: 0.29,
  },
  {
    time: "Day 0, 18:00",
    note: "Nauseous, no appetite. Denies diarrhea.",
    present: ["nausea", "anorexia"],
    absent: ["diarrhea"],
    scores: { app: 0.69, mes: 0.23, gastro: 0.08 },
    sequence: 0.84,
    question: "What are the temperature and white cell count?",
    gain: 0.36,
  },
  {
    time: "Day 1, 07:00",
    note: "Temperature 38.4 °C. White cell count high.",
    present: ["fever", "wbc"],
    absent: [],
    scores: { app: 0.81, mes: 0.14, gastro: 0.05 },
    sequence: 0.92,
    question: "Is there rebound tenderness or pain on coughing?",
    gain: 0.34,
  },
];

const PX = 184; // phenotype column right edge
const DX = 294; // disease column left edge

export default function CaseDemo() {
  const [count, setCount] = useState(1);
  const shown = STEPS.slice(0, count);
  const current = STEPS[count - 1];
  const present = new Set(shown.flatMap((s) => s.present));
  const absent = new Set(shown.flatMap((s) => s.absent));
  const fresh = new Set([...current.present, ...current.absent]);
  const ranked = DISEASES.map((d) => ({ ...d, score: current.scores[d.id] })).sort((a, b) => b.score - a.score);
  const label = (id: Disease) => DISEASES.find((d) => d.id === id)!.label;

  return (
    <div className="case">
      <div className="case-grid">
        <div className="case-col">
          <h3>Patient timeline</h3>
          <ol className="timeline">
            {shown.map((s, i) => (
              <li key={s.time} className={i === count - 1 ? "is-new" : undefined}>
                <time>{s.time}</time>
                <span>{s.note}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="case-col case-graph">
          <h3>Linked to the knowledge graph</h3>
          <svg viewBox="0 0 474 324" role="img" aria-label="Findings linked to symptoms in the knowledge graph, connected to three candidate diseases">
            {EDGES.map(([d, p]) => {
              const py = PHENOTYPES.find((x) => x.id === p)!.y;
              const dy = DISEASES.find((x) => x.id === d)!.y;
              const state = present.has(p) ? "on" : absent.has(p) ? "neg" : "off";
              return <line key={d + p} x1={PX} y1={py} x2={DX} y2={dy} className={`edge ${state}`} />;
            })}
            {PHENOTYPES.map((p) => {
              const state = present.has(p.id) ? "on" : absent.has(p.id) ? "neg" : "off";
              return (
                <g key={p.id} className={`node ph ${state} ${fresh.has(p.id) ? "fresh" : ""}`}>
                  <rect x={0} y={p.y - 15} width={PX} height={30} rx={15} />
                  <text x={PX / 2} y={p.y + 5}>{p.label}</text>
                </g>
              );
            })}
            {DISEASES.map((d) => (
              <g key={d.id} className={`node dx ${d.id === ranked[0].id ? "lead" : ""}`}>
                <rect x={DX} y={d.y - 17} width={180} height={34} rx={6} />
                <text x={DX + 90} y={d.y + 5}>{d.label}</text>
              </g>
            ))}
          </svg>
          <p className="legend">
            <span className="k on" /> present <span className="k neg" /> documented as absent <span className="k off" /> not yet seen
          </p>
        </div>

        <div className="case-col" aria-live="polite">
          <h3>Clinician differential</h3>
          <ul className="ddx">
            {ranked.map((d, i) => (
              <li key={d.id} className={i === 0 ? "lead" : undefined}>
                <div className="ddx-row">
                  <span>{d.label}</span>
                  <b>{Math.round(d.score * 100)}%</b>
                </div>
                <div className="bar"><i style={{ width: `${d.score * 100}%` }} /></div>
              </li>
            ))}
          </ul>
          <p className="seq">
            Timeline matches the typical sequence for {label("app").toLowerCase()}: <b>{Math.round(current.sequence * 100)}%</b>
          </p>
          <div className="nbq">
            <span>Next best question</span>
            <p>{current.question}</p>
            <small>Expected information gain {current.gain.toFixed(2)}</small>
          </div>
        </div>
      </div>

      <div className="case-actions">
        <button type="button" className="btn primary" onClick={() => setCount(count + 1)} disabled={count === STEPS.length}>
          {count === STEPS.length ? "All findings added" : "Add the next finding"}
        </button>
        <button type="button" className="btn" onClick={() => setCount(1)} disabled={count === 1}>
          Start over
        </button>
        <span className="case-note">Synthetic case with illustrative numbers. Finding {count} of {STEPS.length}.</span>
      </div>
    </div>
  );
}
