"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#8052ff", "#a98bff", "#ffb829", "#2fd3b0", "#ff5fd2", "#4f8dff", "#ffffff"];
const LABELS = ["Acute appendicitis", "Fever", "Nausea", "Leukocytosis", "Abdominal pain", "Gastroenteritis", "Peritonitis", "Metformin", "Type 2 diabetes"];
const PARTICLES = 2600;
const NODES = 64;

type Particle = {
  bx: number; by: number; // position in the brain, normalized around 0
  sx: number; sy: number; // scattered position, 0..1 of the viewport
  s: number; rot: number; c: string; a: number; ph: number; delay: number;
};

// Side view of a brain in a [-1, 1] box: frontal lobe left, cerebellum and stem right.
function insideBrain(x: number, y: number) {
  const ell = (cx: number, cy: number, rx: number, ry: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  const cerebrum = ell(0, -0.08, 1, 0.68) && y < 0.42;
  const temporal = ell(-0.08, 0.34, 0.6, 0.2);
  const cerebellum = ell(0.6, 0.48, 0.3, 0.19);
  const stem = x > 0.18 + (y - 0.4) * 0.15 && x < 0.36 + (y - 0.4) * 0.15 && y > 0.36 && y < 0.92;
  return cerebrum || temporal || cerebellum || stem;
}

// Folds: thin out particles along wavy bands so gyri and sulci show through.
function foldDensity(x: number, y: number) {
  if (((x - 0.6) / 0.3) ** 2 + ((y - 0.48) / 0.19) ** 2 <= 1 && y > 0.36) {
    return Math.abs(Math.sin(y * 70)) > 0.45 ? 0.9 : 0.05; // cerebellum: fine horizontal folia
  }
  const f = Math.sin(x * 9 + Math.sin(y * 6) * 2.4) * Math.cos(y * 8 + Math.sin(x * 4) * 2);
  const lateral = Math.abs(y - (0.16 + (x + 0.3) * 0.3)) < 0.03 && x > -0.55 && x < 0.42 ? 0.05 : 1;
  const central = Math.abs(x - (-0.05 + (y + 0.7) * 0.25)) < 0.025 && y < 0.1 ? 0.05 : 1;
  // keep the outline crisp: a thin dense rim regardless of folds
  const rim = !insideBrain(x * 1.06, y * 1.06 + 0.02) ? 1 : 0;
  return Math.max(rim, (0.06 + 0.94 * (f * 0.5 + 0.5) ** 2) * lateral * central);
}

function makeField() {
  const ps: Particle[] = [];
  while (ps.length < PARTICLES) {
    const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1;
    if (!insideBrain(x, y) || Math.random() > foldDensity(x, y)) continue;
    ps.push({
      bx: x, by: y, sx: Math.random(), sy: Math.random(),
      s: 1.4 + Math.random() * 2.4, rot: Math.random() * Math.PI * 2,
      c: COLORS[(Math.random() * COLORS.length) | 0], a: 0.5 + Math.random() * 0.5,
      ph: Math.random() * Math.PI * 2, delay: Math.random(),
    });
  }
  // Graph nodes: farthest-point sampling spreads them evenly through the brain.
  const nodes = [0];
  const dist = ps.map((p) => Math.hypot(p.bx - ps[0].bx, p.by - ps[0].by));
  while (nodes.length < NODES) {
    let best = 0;
    for (let i = 1; i < ps.length; i++) if (dist[i] > dist[best]) best = i;
    nodes.push(best);
    for (let i = 0; i < ps.length; i++) dist[i] = Math.min(dist[i], Math.hypot(ps[i].bx - ps[best].bx, ps[i].by - ps[best].by));
  }
  const keys = new Set<string>();
  const edges: [number, number][] = [];
  for (const i of nodes) {
    const near = nodes
      .filter((j) => j !== i)
      .sort((a, b) => Math.hypot(ps[a].bx - ps[i].bx, ps[a].by - ps[i].by) - Math.hypot(ps[b].bx - ps[i].bx, ps[b].by - ps[i].by))
      .slice(0, 3);
    for (const j of near) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`;
      if (!keys.has(key)) { keys.add(key); edges.push([i, j]); }
    }
  }
  return { ps, nodes, edges };
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (t: number) => Math.max(0, Math.min(1, t));

export default function BrainField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const anchor = document.getElementById("brain-anchor");
    const { ps, nodes, edges } = makeField();
    const family = getComputedStyle(document.body).fontFamily;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const px = new Float32Array(ps.length), py = new Float32Array(ps.length);
    let w = 0, h = 0, raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      const r = anchor?.getBoundingClientRect();
      const cx = r ? r.left + r.width / 2 : w * 0.72;
      const cy = r ? r.top + r.height / 2 : h * 0.5;
      const scale = r ? Math.min(r.width, r.height * 1.25) * 0.46 : Math.min(w, h) * 0.3;
      // 0 until the brain is centred on screen (at once on desktop, after some scrolling on phones), 1 once it is gone
      const start = r ? Math.max(0, r.top + window.scrollY + r.height / 2 - h / 2) : 0;
      const p = clamp((window.scrollY - start) / (h * 1.1));

      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let i = 0; i < ps.length; i++) {
        const q = ps[i];
        // staggered start so the brain crumbles instead of moving as one block
        const e = still ? 0 : ease(clamp((p - q.delay * 0.35) / 0.65));
        const drift = still ? 0 : 1;
        const dx = Math.sin(t / 2400 + q.ph) * (2 + e * 10) * drift;
        const dy = Math.cos(t / 3100 + q.ph) * (2 + e * 10) * drift;
        const x = cx + q.bx * scale + (q.sx * w - (cx + q.bx * scale)) * e + dx;
        const y = cy + q.by * scale + (q.sy * h - (cy + q.by * scale)) * e + dy;
        px[i] = x;
        py[i] = y;
        // once scattered, only about a fifth stay visible as a quiet backdrop behind the text
        const rest = q.delay < 0.2 ? 0.3 : 0;
        const alpha = q.a * (1 - (still ? p : e) * (1 - rest));
        if (alpha < 0.02 || x < -10 || y < -10 || x > w + 10 || y > h + 10) continue;
        const rot = q.rot + (still ? 0 : t / 6000);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = q.c;
        ctx.beginPath();
        for (let k = 0; k < 3; k++) {
          const ang = rot + (k * Math.PI * 2) / 3;
          const vx = x + Math.cos(ang) * q.s, vy = y + Math.sin(ang) * q.s;
          if (k) ctx.lineTo(vx, vy); else ctx.moveTo(vx, vy);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // the graph inside the brain fades as it comes apart
      const g = 1 - ease(clamp(p / 0.6));
      if (g > 0.01) {
        ctx.strokeStyle = "#ffffff";
        ctx.globalAlpha = 0.22 * g;
        ctx.beginPath();
        for (const [i, j] of edges) {
          ctx.moveTo(px[i], py[i]);
          ctx.lineTo(px[j], py[j]);
        }
        ctx.stroke();
        nodes.forEach((n, k) => {
          ctx.globalAlpha = g;
          ctx.fillStyle = k < LABELS.length ? "#ffb829" : "#ffffff";
          ctx.beginPath();
          ctx.arc(px[n], py[n], k < LABELS.length ? 3.5 : 2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.font = `400 12px ${family}`;
        ctx.fillStyle = "#bdbdbd";
        ctx.globalAlpha = g;
        LABELS.forEach((label, k) => {
          const lw = ctx.measureText(label).width;
          const lx = px[nodes[k]] + 8 + lw > w - 8 ? px[nodes[k]] - 8 - lw : px[nodes[k]] + 8;
          ctx.fillText(label, lx, py[nodes[k]] + 4);
        });
      }
      ctx.globalAlpha = 1;
      if (!still) raf = requestAnimationFrame(draw);
    };

    const redraw = () => { if (still) draw(0); };
    const onResize = () => { resize(); redraw(); };
    resize();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", redraw, { passive: true });
    if (still) draw(0); else raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", redraw);
    };
  }, []);

  return <canvas ref={ref} className="brain-field" aria-hidden="true" />;
}
