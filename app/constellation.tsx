"use client";

import { useEffect, useRef } from "react";

// Concept clusters of the knowledge graph, in normalized canvas coordinates.
const NODES = [
  { label: "Acute appendicitis", x: 0.5, y: 0.46, r: 0.075, n: 420 },
  { label: "Gastroenteritis", x: 0.74, y: 0.2, r: 0.055, n: 240 },
  { label: "Peritonitis", x: 0.8, y: 0.66, r: 0.05, n: 200 },
  { label: "Abdominal pain", x: 0.2, y: 0.3, r: 0.055, n: 240 },
  { label: "Fever", x: 0.3, y: 0.76, r: 0.045, n: 180 },
  { label: "Nausea", x: 0.52, y: 0.12, r: 0.04, n: 150 },
  { label: "Leukocytosis", x: 0.6, y: 0.86, r: 0.045, n: 170 },
];
const EDGES: [number, number][] = [[0, 3], [0, 4], [0, 5], [0, 6], [0, 2], [0, 1], [1, 3], [1, 4], [1, 5]];
const COLORS = ["#8052ff", "#a98bff", "#ffb829", "#2fd3b0", "#ff5fd2", "#4f8dff", "#ffffff"];

type Particle = { x: number; y: number; s: number; rot: number; c: string; a: number; ph: number };

function gauss() {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

function makeParticles(): Particle[] {
  const ps: Particle[] = [];
  const add = (x: number, y: number, a: number) =>
    ps.push({ x, y, s: 1.6 + Math.random() * 2.6, rot: Math.random() * Math.PI * 2, c: COLORS[(Math.random() * COLORS.length) | 0], a, ph: Math.random() * Math.PI * 2 });
  for (const nd of NODES) for (let i = 0; i < nd.n; i++) add(nd.x + gauss() * nd.r, nd.y + gauss() * nd.r, 0.55 + Math.random() * 0.45);
  for (const [i, j] of EDGES) {
    const a = NODES[i], b = NODES[j];
    for (let k = 0; k < 70; k++) {
      const t = Math.random();
      add(a.x + (b.x - a.x) * t + gauss() * 0.008, a.y + (b.y - a.y) * t + gauss() * 0.008, 0.35 + Math.random() * 0.35);
    }
  }
  for (let i = 0; i < 260; i++) add(Math.random(), Math.random(), 0.12 + Math.random() * 0.2);
  return ps;
}

export default function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const particles = makeParticles();
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (const p of particles) {
        const dx = still ? 0 : Math.sin(t / 2400 + p.ph) * 3;
        const dy = still ? 0 : Math.cos(t / 3100 + p.ph) * 3;
        const rot = still ? p.rot : p.rot + t / 6000;
        const x = p.x * w + dx, y = p.y * h + dy;
        ctx.globalAlpha = p.a;
        ctx.strokeStyle = p.c;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const ang = rot + (k * Math.PI * 2) / 3;
          const px = x + Math.cos(ang) * p.s, py = y + Math.sin(ang) * p.s;
          if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (!still) raf = requestAnimationFrame(draw);
    };

    resize();
    const onResize = () => { resize(); if (still) draw(0); };
    window.addEventListener("resize", onResize);
    if (still) draw(0); else raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="constellation">
      <canvas ref={ref} aria-hidden="true" />
      {NODES.map((n) => (
        <span key={n.label} style={{ left: `${n.x * 100}%`, top: `${(n.y + n.r + 0.04) * 100}%` }}>
          {n.label}
        </span>
      ))}
    </div>
  );
}
