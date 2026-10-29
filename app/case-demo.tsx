"use client";

import { useState } from "react";

const RECORDS = [
  { date: "January", title: "First consultation", source: "Consultation note", note: "A visit records changes in sleep and energy.", patient: "Your first visit is now part of your history. The note records what you discussed, with a link to the original source.", doctor: "The consultation gives the starting point: what was reported and when. Later records can be reviewed against this history.", question: "What changed before this visit?" },
  { date: "March", title: "Lab results added", source: "Lab report", note: "A lab report joins the earlier visit in the timeline.", patient: "Your lab report sits alongside your earlier visit. You can find both records in one place and bring them to your doctor.", doctor: "The new report adds dated evidence to the earlier consultation. Each result remains connected to its original record.", question: "How do the results relate to the earlier findings?" },
  { date: "April", title: "Medication updated", source: "Prescription", note: "An updated prescription adds treatment context.", patient: "Your medication update is connected to your visits and results, so you can see where it fits in your history.", doctor: "The treatment timeline is now visible alongside the findings. The original prescription provides context for reviewing later changes.", question: "Which changes came before or after the medication update?" },
  { date: "June", title: "Follow-up connected", source: "Follow-up note", note: "A later visit records how things have changed.", patient: "Your visits, results and medication update now form one timeline. Open the records and use the full history to prepare for your next conversation.", doctor: "The follow-up can be reviewed in the context of the earlier findings and treatment. All four source records stay available for inspection.", question: "What does the full sequence suggest we should investigate next?" },
];
const POINTS = [[82,68],[248,68],[82,244],[248,244]];

export default function CaseDemo() {
  const [count,setCount] = useState(1);
  const [view,setView] = useState<"patient" | "doctor">("patient");
  const [source,setSource] = useState<number | null>(null);
  const current = RECORDS[count-1];
  return <div className="walkthrough">
    <div className="walkthrough-bar"><span className="example-label"><span/> Example walkthrough</span><span>Fictional records · Interactive preview</span></div>
    <div className="walkthrough-grid">
      <div className="walkthrough-timeline"><p className="visual-label">One person&apos;s history</p><ol>{RECORDS.slice(0,count).map((record,i)=><li key={record.date} className={i===count-1 ? "current" : ""}><time>{record.date}</time><h3>{record.title}</h3><p>{record.note}</p><button onClick={()=>setSource(source===i ? null : i)} aria-expanded={source===i} aria-controls="example-source">{source===i ? "Close source" : "View source"}<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 3h10l4 4v14H5V3Zm9 0v6h5M8 13h8M8 17h5"/></svg></button></li>)}</ol></div>
      <div className="walkthrough-graph"><p className="visual-label">The connected record</p><svg viewBox="0 0 330 310" role="img" aria-label={`${count} fictional records connected to one timeline`}>
        {POINTS.map(([x,y],i)=><g key={i} className={i<count ? "record-connected" : "record-pending"}><path d={`M${x} ${y} Q165 ${y} 165 156`} pathLength={1}/><circle cx={x} cy={y} r="20"/><text x={x} y={y+4}>{String(i+1).padStart(2,"0")}</text><text className="record-name" x={x} y={y+(y<100 ? -34 : 38)}>{["Visit","Results","Medication","Follow-up"][i]}</text></g>)}
        <circle className="timeline-core" cx="165" cy="156" r="36"/><text className="timeline-core-text" x="165" y="153">One</text><text className="timeline-core-text" x="165" y="170">timeline</text>
      </svg><p>Each connection keeps its source.</p></div>
      <div className="walkthrough-reader"><div className="view-switch" aria-label="Choose the example view"><button aria-pressed={view==="patient"} onClick={()=>setView("patient")}>Patient view</button><button aria-pressed={view==="doctor"} onClick={()=>setView("doctor")}>Doctor view</button></div><div className="reader-copy" aria-live="polite"><div key={`${view}-${count}`} className="swap"><p className="visual-label">{view==="patient" ? "Your history, explained" : "Context for clinical review"}</p><p>{current[view]}</p>{view==="doctor" && <div className="review-question"><span>Question to explore</span><p>{current.question}</p></div>}</div></div></div>
    </div>
    <div id="example-source" className="example-source" hidden={source===null}>{source!==null && <><span className="visual-label">Fictional source · {RECORDS[source].source} · {RECORDS[source].date}</span><p>{RECORDS[source].note}</p></>}</div>
    <div className="walkthrough-controls"><button className="pill" disabled={count===RECORDS.length} onClick={()=>{setCount(count+1);setSource(null);}}>{count===RECORDS.length ? "History connected" : "Add the next record"}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg></button><button className="ghost" disabled={count===1} onClick={()=>{setCount(1);setSource(null);}}>Start over</button><span aria-live="polite">{count} of {RECORDS.length} records connected</span></div>
  </div>;
}
