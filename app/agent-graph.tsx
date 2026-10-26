"use client";

import { useEffect, useRef, useState } from "react";

const WORKFLOWS = [
  {
    name: "Reason", title: "Follow the evidence.", description: "Connect the patient’s history with sourced medical knowledge to support clinical reasoning.",
    inputs: ["Dated records", "Medical knowledge"], output: ["Possible diagnoses", "Next useful test"], graph: "Patient graph",
    steps: [
      ["Read the history", "Start with dated findings and their sources in the patient’s graph."],
      ["Trace the evidence", "The reasoning agent follows connections between findings and medical knowledge."],
      ["Suggest next steps", "Present possible diagnoses and the test that could best reduce uncertainty."],
      ["Clinician review", "A doctor reviews the reasoning and decides what to do next."],
    ],
  },
  {
    name: "Monitor", title: "Put changes in context.", description: "Follow results and daily readings over time, with the patient’s history in view.",
    inputs: ["Lab results", "Wearable readings"], output: ["Changes over time", "Supporting records"], graph: "Patient timeline",
    steps: [
      ["Read dated results", "Connect lab results and wearable readings to the patient’s timeline."],
      ["Compare over time", "The monitoring agent looks for changes across the connected records."],
      ["Surface the change", "Show a change alongside the records that support it."],
      ["Doctor review", "Bring the change to a doctor, who interprets it in the patient’s context."],
    ],
  },
  {
    name: "Curate", title: "Grow the graph carefully.", description: "Propose new connections from evidence. Clinician approval comes before any graph update.",
    inputs: ["Literature", "Supporting data"], output: ["Proposed connection", "Linked evidence"], graph: "Medical graph",
    steps: [
      ["Gather evidence", "The curation agent reads literature and supporting data for a possible connection."],
      ["Propose a connection", "Create a proposal with its evidence. The graph has not changed."],
      ["Clinician approval", "A clinician checks the evidence and decides whether to accept the proposal."],
      ["Update after approval", "Only an approved connection is committed, with its provenance attached."],
    ],
  },
];
const READ = "M150 70 C185 70 185 120 233 120 M150 140 C185 140 185 120 233 120";
const REASON = "M287 120 H395";
const PROPOSE = "M475 155 V235";
const REVIEW = "M465 299 C465 362 390 362 360 362";
const APPROVE = "M180 362 C115 362 115 210 260 210 V146";
const GATHER = "M150 70 C225 70 245 35 380 35 S475 65 475 95 M150 140 C180 140 180 70 220 60";

export default function AgentGraph() {
  const [active,setActive] = useState(0);
  const [step,setStep] = useState(0);
  const [playing,setPlaying] = useState(true);
  const figure = useRef<HTMLElement>(null);
  const current = WORKFLOWS[active];
  const curation = active===2;
  const paths = curation ? [GATHER,PROPOSE,REVIEW,APPROVE] : [READ,REASON,PROPOSE,REVIEW];
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    let visible = false;
    const sync = () => {
      clearInterval(timer);
      if (playing && visible && !reduced.matches && !document.hidden) timer=setInterval(()=>setStep(s=>(s+1)%4),3600);
    };
    const observer = new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();},{threshold:.35});
    observer.observe(figure.current!);
    reduced.addEventListener("change",sync); document.addEventListener("visibilitychange",sync);
    return ()=>{clearInterval(timer);observer.disconnect();reduced.removeEventListener("change",sync);document.removeEventListener("visibilitychange",sync);};
  },[playing,active]);
  const chooseStep = (i:number) => { setStep(i);setPlaying(false); };
  return <figure ref={figure} className={`agent-workspace${!playing ? " is-paused" : ""}`}>
    <div className="agent-toolbar"><span className="visual-label">Follow the agent workflow</span><button className="quiet-button" onClick={()=>setPlaying(!playing)} aria-pressed={!playing}>{playing ? "Pause workflow" : "Play workflow"}</button></div>
    <div className="agent-layout">
      <div className="agent-selection"><div className="agent-buttons" aria-label="Explore agent tasks">{WORKFLOWS.map((item,i)=><button key={item.name} aria-pressed={active===i} aria-controls="agent-description" onClick={()=>{setActive(i);setStep(0);}}><span className="agent-number">0{i+1}</span>{item.name}<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button>)}</div><div id="agent-description" className="agent-description"><h3>{current.title}</h3><p>{current.description}</p></div></div>
      <div className="agent-diagram"><svg viewBox="0 0 580 420" role="img" aria-label={`${current.name} workflow, step ${step+1}: ${current.steps[step][0]}. ${current.steps[step][1]}`}>
        <defs><marker id="workflow-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="5" markerHeight="5" orient="auto"><path d="m0 0 6 3-6 3" fill="none" stroke="currentColor"/></marker></defs>
        <g className="workflow-paths">{paths.map((d,i)=><path key={i} d={d} className={i===step ? "active-path" : ""} markerEnd="url(#workflow-arrow)"/>)}</g>
        <path key={`${active}-${step}`} className="agent-route" d={paths[step]}/>
        {current.inputs.map((input,i)=><g className={`flow-box${step===0 ? " active" : ""}`} key={input}><rect x="20" y={49+i*70} width="130" height="42" rx="7"/><text x="85" y={75+i*70}>{input}</text></g>)}
        <g className={`mini-graph${(curation ? step===3 : step<=1) ? " active" : ""}`}><path d="m237 95 46 5-23 43-23-48 50 25-27 23m-27-23 50-20"/>{[[237,95],[283,100],[287,120],[260,143],[233,120]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r="4"/>)}<rect x="207" y="157" width="106" height="25" fill="var(--surface)"/><text x="260" y="175">{current.graph}</text></g>
        <g className={`flow-box agent-box${step===(curation?0:1) ? " active" : ""}`}><rect x="395" y="95" width="160" height="60" rx="14"/><text x="475" y="131">{current.name} agent</text></g>
        <g className={`flow-box output-box${step===(curation?1:2) ? " active" : ""}`}><rect x="370" y="235" width="190" height="64" rx="7"/><text x="465" y="262">{current.output[0]}</text><text x="465" y="281" className="secondary-label">{current.output[1]}</text></g>
        <g className={`flow-box review-box${step===(curation?2:3) ? " active" : ""}`}><rect x="180" y="335" width="180" height="54" rx="7"/><text x="270" y="367">{curation ? "Clinician approval" : "Clinician review"}</text></g>
        {curation && <g><rect x="62" y="266" width="120" height="24" fill="var(--surface)"/><text className={`approval-label${step===3 ? " approved" : ""}`} x="122" y="282">{step===3 ? "Approved edge" : "Approval required"}</text></g>}
      </svg></div>
    </div>
    <div className="workflow-steps" aria-label="Workflow steps">{current.steps.map(([name],i)=><button key={name} aria-pressed={step===i} onClick={()=>chooseStep(i)}><span>0{i+1}</span>{name}</button>)}</div>
    <figcaption className="workflow-caption"><span className="step-counter">0{step+1} / 04</span><p>{current.steps[step][1]}</p><span>Workflow illustration</span></figcaption>
  </figure>;
}
