"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// surface patches; amber is kept for the rim so outlines glow warm. Light theme swaps in darker inks.
const PALETTES = {
  dark: { patches: ["#ffffff", "#c9b8ff", "#8052ff", "#2fd3b0", "#a98bff"], bg: 0x000000, rim: [1, 0.72, 0.16], hover: [1, 1, 1], head: [1, 1, 1], line: 0.55 },
  light: { patches: ["#1b1340", "#5b3fd9", "#8052ff", "#0f8a74", "#3a2a8a"], bg: 0xffffff, rim: [0.85, 0.5, 0], hover: [0.05, 0.05, 0.1], head: [0.5, 0.32, 1], line: 0.35 },
};
type Theme = keyof typeof PALETTES;
const COLORS = PALETTES.dark.patches;
const NODES = 110;

/* ---------- shapes, each roughly in a [-1, 1] box, y up, facing +z ---------- */

// Brain, x front→back.
function inBrain(x: number, y: number, z: number) {
  const e = (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) =>
    ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1;
  const cerebrum = e(0, 0.08, 0, 1, 0.68, 0.66) && y > -0.42 && !(Math.abs(z) < 0.025 && y > -0.2);
  const temporal = e(-0.08, -0.34, 0.36, 0.6, 0.22, 0.26) || e(-0.08, -0.34, -0.36, 0.6, 0.22, 0.26);
  const cerebellum = e(0.6, -0.48, 0, 0.3, 0.2, 0.44);
  const stem = Math.hypot(x - (0.27 - (y + 0.4) * 0.15), z) < 0.11 && y < -0.36 && y > -0.95;
  return cerebrum || temporal || cerebellum || stem;
}

function sampleBrain(count: number) {
  const folds = (x: number, y: number, z: number) => {
    const f = Math.sin(x * 9 + Math.sin(y * 6) * 2.4) * Math.cos(y * 8 + Math.sin(z * 6) * 2) * Math.cos(z * 7 + x * 3);
    return 0.12 + 0.88 * (f * 0.5 + 0.5) ** 2;
  };
  const pts: number[] = [];
  while (pts.length < count * 3) {
    const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1, z = Math.random() * 2 - 1;
    if (!inBrain(x, y, z)) continue;
    const shell = !inBrain(x * 1.07, y * 1.07, z * 1.07);
    // lateral (Sylvian) fissure along each side
    const sylvian = Math.abs(z) > 0.3 && x > -0.5 && x < 0.45 && Math.abs(y - (-0.12 + (x + 0.5) * 0.32)) < 0.035;
    if (sylvian || (shell ? Math.random() > folds(x, y, z) : Math.random() > 0.1)) continue;
    pts.push(x, y, z);
  }
  return pts;
}

// Standing human body as capsules: [ax, ay, bx, by, radius, depth scale]; arms and legs are mirrored.
const BODY: number[][] = [
  [0, 0.83, 0, 0.83, 0.12, 1], // head
  [0, 0.64, 0, 0.72, 0.05, 1], // neck
  [0, 0.48, 0, 0.12, 0.2, 1.7], // chest and abdomen, flatter front to back
  [0, 0.06, 0, -0.08, 0.17, 1.5], // pelvis
  [0.25, 0.53, 0.3, 0.2, 0.055, 1], // upper arm
  [0.3, 0.2, 0.33, -0.13, 0.045, 1], // forearm
  [0.335, -0.19, 0.335, -0.19, 0.05, 1], // hand
  [0.1, -0.1, 0.12, -0.52, 0.085, 1], // thigh
  [0.12, -0.52, 0.12, -0.92, 0.06, 1], // shin
  [0.12, -0.96, 0.12, -0.96, 0.045, 1], // foot
];
const LIMBS = BODY.flatMap((s, i) => (i >= 4 ? [s, [-s[0], s[1], -s[2], s[3], s[4], s[5]]] : [s]));

function bodyDistance(x: number, y: number, z: number) {
  let d = Infinity;
  for (const [ax, ay, bx, by, r, k] of LIMBS) {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    d = Math.min(d, Math.hypot(x - ax - dx * t, y - ay - dy * t, z * k) - r);
  }
  return d;
}

function sampleBody(count: number) {
  const pts: number[] = [];
  while (pts.length < count * 3) {
    const x = (Math.random() - 0.5) * 0.9, y = Math.random() * 2 - 1, z = (Math.random() - 0.5) * 0.5;
    const d = bodyDistance(x, y, z);
    if (d > 0) continue;
    // a skin of particles with a faint fill
    if (d < -0.03 && Math.random() > 0.08) continue;
    pts.push(x, y, z);
  }
  return pts;
}

// A knowledge graph: concept clusters and the edges between them.
const CLUSTERS = [
  { label: "Health history", p: [0, 0.05, 0.1], r: 0.2 },
  { label: "Visits", p: [-0.75, 0.45, 0.2], r: 0.14 },
  { label: "Results", p: [-0.6, -0.55, -0.2], r: 0.13 },
  { label: "Findings", p: [0.15, 0.8, -0.3], r: 0.12 },
  { label: "Medications", p: [0.75, -0.5, 0.25], r: 0.13 },
  { label: "Sources", p: [0.8, 0.45, -0.1], r: 0.16 },
  { label: "Follow-up", p: [0.1, -0.85, -0.25], r: 0.12 },
];
const LINKS = [[0, 1], [0, 2], [0, 3], [0, 4], [0, 6], [0, 5], [5, 1], [5, 2], [5, 3], [1, 3], [2, 6], [4, 6]];

function sampleGraph(count: number) {
  const g = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
  const pts: number[] = [];
  while (pts.length < count * 3) {
    if (Math.random() < 0.62) {
      const c = CLUSTERS[(Math.random() * CLUSTERS.length) | 0];
      pts.push(c.p[0] + g() * c.r, c.p[1] + g() * c.r, c.p[2] + g() * c.r);
    } else {
      const [i, j] = LINKS[(Math.random() * LINKS.length) | 0];
      const a = CLUSTERS[i].p, b = CLUSTERS[j].p, t = Math.random();
      pts.push(a[0] + (b[0] - a[0]) * t + g() * 0.02, a[1] + (b[1] - a[1]) * t + g() * 0.02, a[2] + (b[2] - a[2]) * t + g() * 0.02);
    }
  }
  return pts;
}

/* ---------- scroll choreography ---------- */

type Pose = {
  w: [number, number, number]; // weight of brain, body, graph
  explode: number; x: number; y: number; rotY: number; rotX: number; scale: number;
  fade: number; // overall opacity, lowered where interactive content sits on top
  pulse: number; // light travelling along the graph's edges
};
const P = (w: Pose["w"], explode: number, x: number, rotY: number, scale: number, extra: Partial<Pose> = {}): Pose =>
  ({ w, explode, x, y: 0, rotY, rotX: 0.15, scale, fade: 1, pulse: 0, ...extra });
const BRAIN: Pose["w"] = [1, 0, 0], BODYW: Pose["w"] = [0, 1, 0], GRAPH: Pose["w"] = [0, 0, 1];

// Each section marks itself with data-scene; the scene settles into its pose when that section is centred.
const POSES: Record<string, Pose> = {
  hero: P(BRAIN, 0, 0, 0.55, 1.35),
  intro: P(BRAIN, 0.15, 0, -0.35, 1),
  patients: P(BODYW, 0, 0, 0.15, 1.3, { rotX: 0.02 }),
  clinicians: P(GRAPH, 0, 0, -0.12, 1.25, { rotX: 0.04 }),
  case: P(GRAPH, 0.2, 0, 0, 1, { fade: 0 }),
  how: P(GRAPH, 0, 0, 0.12, 1.25, { rotX: 0.03, pulse: 1 }),
  measure: P(GRAPH, 0.15, 0, 0, 1, { fade: 0 }),
  team: P(BRAIN, 0.15, 0, -0.4, 1, { fade: 0 }),
  closing: P(BRAIN, 0, 0, 0.55, 1.25),
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

function blend(a: Pose, b: Pose, t: number): Pose {
  const s = smooth(t);
  // scattering starts slowly and gathering finishes early
  const te = b.explode > a.explode ? t * t * t : 1 - (1 - t) ** 3;
  // a change of shape dissolves and reforms instead of morphing through a blob; the swap happens while scattered
  const morph = a.w.some((v, i) => v !== b.w[i]);
  const sw = morph ? smooth(s) : s;
  return {
    w: [mix(a.w[0], b.w[0], sw), mix(a.w[1], b.w[1], sw), mix(a.w[2], b.w[2], sw)],
    explode: Math.max(mix(a.explode, b.explode, te), morph ? Math.sin(Math.PI * t) * 0.6 : 0),
    x: mix(a.x, b.x, s), y: mix(a.y, b.y, s), rotY: mix(a.rotY, b.rotY, s), rotX: mix(a.rotX, b.rotX, s),
    scale: mix(a.scale, b.scale, s), fade: mix(a.fade, b.fade, s), pulse: mix(a.pulse, b.pulse, s),
  };
}

/* ---------- shaders ---------- */

const vertex = /* glsl */ `
  attribute vec3 aBrain;
  attribute vec3 aBody;
  attribute vec3 aGraph;
  attribute vec3 aScatter;
  attribute vec4 aRand;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uExplode;
  uniform vec3 uW;
  uniform float uMotion;
  uniform float uSize;
  uniform vec2 uMouse;
  uniform vec2 uDelta;
  uniform float uAspect;
  uniform vec3 uRim;
  uniform vec3 uHover;
  varying vec3 vColor;
  varying float vAlpha;

  mat3 rot(vec3 a) {
    float cx = cos(a.x), sx = sin(a.x), cy = cos(a.y), sy = sin(a.y);
    return mat3(cy, 0., -sy, 0., 1., 0., sy, 0., cy) * mat3(1., 0., 0., 0., cx, sx, 0., -sx, cx);
  }

  void main() {
    vec3 shape = aBrain * uW.x + aBody * uW.y + aGraph * uW.z;
    // each particle leaves at its own moment, so shapes crumble instead of fading
    float e = smoothstep(aRand.x * 0.7, aRand.x * 0.7 + 0.3, uExplode);
    vec3 c = mix(shape, aScatter, e);
    float t = uTime;
    c += vec3(sin(t * .6 + aRand.y * 6.28), cos(t * .5 + aRand.z * 6.28), sin(t * .4 + aRand.w * 6.28)) * (0.012 + e * 0.12);

    vec4 mv = modelViewMatrix * vec4(c, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 d = clip.xy / clip.w - uMouse;
    d.x *= uAspect;
    // near the cursor particles stir in place and get flung along the pointer's motion; nothing is pushed out
    float near = smoothstep(0.3, 0.0, length(d)) * (1.0 - e) * uMotion;
    vec2 stir = vec2(sin(uTime * (2.0 + aRand.y * 4.0) + aRand.z * 6.28), cos(uTime * (2.0 + aRand.y * 4.0) + aRand.w * 6.28));
    mv.xy += near * (stir * (0.018 + aRand.z * 0.03) + uDelta * (0.08 + aRand.y * 0.15));

    // brighter, warmer rim where the surface turns away from the viewer
    vec3 nShape = normalize(aBrain / vec3(1.0, 0.7, 0.66)) * uW.x
                + normalize(vec3(aBody.x, 0.0, aBody.z * 1.7) + 1e-4) * uW.y
                + normalize(aGraph + 1e-4) * uW.z;
    vec3 n = normalize(normalMatrix * normalize(nShape + 1e-4));
    float rim = pow(1.0 - abs(n.z), 2.0) * (1.0 - e);

    mv.xyz += rot(vec3(t * (aRand.y - .5) + aRand.z * 6.28, t * (aRand.w - .5) + aRand.y * 6.28, 0.)) * position * uSize * (0.6 + aRand.w) * (1.0 + near * 0.8);
    gl_Position = projectionMatrix * mv;

    // fake depth of field: sharp at the shape's depth, faint in front and behind
    float focus = abs(-mv.z - 6.0);
    vAlpha = mix(0.62, 0.1, smoothstep(0.0, 2.6, focus)) * mix(1.0, 0.28 * step(aRand.x, 0.3), e);
    vAlpha = max(vAlpha + rim * 0.45, near * 0.7);
    vColor = mix(mix(aColor, uRim, min(1.0, rim * 1.4) * step(0.3, aRand.z)), uHover, near * 0.35);
  }
`;

const fragment = /* glsl */ `
  uniform float uFade;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uDpr;
  uniform vec4 uClearRects[16];
  uniform int uClearCount;
  void main() {
    // Clear space around readable content with a feather, never an opaque rectangle.
    vec2 pixel = gl_FragCoord.xy / uDpr;
    float visibility = 1.0;
    for (int i = 0; i < 16; i++) {
      if (i >= uClearCount) break;
      vec4 rect = uClearRects[i];
      vec2 delta = abs(pixel - rect.xy) - rect.zw;
      float distance = length(max(delta, 0.0));
      visibility *= smoothstep(0.0, 72.0, distance);
    }
  #ifdef PULSE
    float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vColor, glow * glow * vAlpha * uFade * visibility);
  #else
    gl_FragColor = vec4(vColor, vAlpha * uFade * visibility);
  #endif
  }
`;

// Agents at work: comets that run along the graph's edges, each drawn as a head and a fading tail.
const pulseVertex = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute vec3 aPulse; // phase, speed, tail index
  uniform float uTime;
  uniform float uDpr;
  uniform vec3 uRim;
  uniform vec3 uHead;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float p = fract(uTime * aPulse.y + aPulse.x) * 1.2 - aPulse.z * 0.03;
    vec4 mv = modelViewMatrix * vec4(mix(aFrom, aTo, clamp(p, 0.0, 1.0)), 1.0);
    gl_Position = projectionMatrix * mv;
    float tail = 1.0 - aPulse.z / 6.0;
    gl_PointSize = (4.0 + 14.0 * tail * tail) * uDpr;
    // fade in as it leaves a node and out as it arrives; rest a moment before the next run
    vAlpha = step(0.0, p) * step(p, 1.0) * sin(clamp(p, 0.0, 1.0) * 3.14159) * tail;
    vColor = mix(uRim, uHead, 0.75 * tail * tail);
  }
`;

export default function ParticleScene() {
  const ref = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const host = ref.current!;
    const mobile = window.innerWidth < 760;
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let still = motionPreference.matches;
    const COUNT = mobile ? 2400 : 4200;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 6);
    const group = new THREE.Group();
    scene.add(group);

    const brainPts = sampleBrain(COUNT);
    const bodyPts = sampleBody(COUNT);
    const graphPts = sampleGraph(COUNT);
    const scatter = new Float32Array(COUNT * 3);
    const rand = new Float32Array(COUNT * 4);
    const color = { dark: new Float32Array(COUNT * 3), light: new Float32Array(COUNT * 3) };
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      scatter.set([(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, -6 + Math.random() * 9], i * 3);
      rand.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      // colour in patches by position, as regions of one surface, with a little random speckle
      const [bx, by, bz] = [brainPts[i * 3], brainPts[i * 3 + 1], brainPts[i * 3 + 2]];
      const f = Math.sin(bx * 2.2 + bz * 1.3) + Math.cos(by * 2.6 - bx * 1.1) + Math.sin(bz * 3.1 + by);
      const patch = Math.min(COLORS.length - 1, Math.floor(((f + 3) / 6) * COLORS.length));
      const pick = Math.random() < 0.8 ? patch : (Math.random() * COLORS.length) | 0;
      for (const theme of ["dark", "light"] as const) {
        c.set(PALETTES[theme].patches[pick]);
        color[theme].set([c.r, c.g, c.b], i * 3);
      }
    }

    const uniforms = {
      uTime: { value: 0 }, uExplode: { value: 0 }, uW: { value: new THREE.Vector3(1, 0, 0) },
      uMotion: { value: still ? 0 : 1 }, uSize: { value: 0.012 },
      uMouse: { value: new THREE.Vector2(9, 9) }, uDelta: { value: new THREE.Vector2() }, uAspect: { value: 1 }, uFade: { value: 1 },
      uDpr: { value: renderer.getPixelRatio() },
      uClearRects: { value: Array.from({ length: 16 }, () => new THREE.Vector4()) }, uClearCount: { value: 0 },
      uRim: { value: new THREE.Vector3() }, uHover: { value: new THREE.Vector3() }, uHead: { value: new THREE.Vector3() },
    };
    const makeMaterial = (u: typeof uniforms) => new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, uniforms: u, transparent: true, depthWrite: false,
    });
    const material = makeMaterial(uniforms);

    // particles: outlined tetrahedra, instanced
    const tetra = new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(1));
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute("position", tetra.getAttribute("position"));
    const shapes = { aBrain: brainPts, aBody: bodyPts, aGraph: graphPts };
    for (const [name, pts] of Object.entries(shapes)) geo.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(pts), 3));
    geo.setAttribute("aScatter", new THREE.InstancedBufferAttribute(scatter, 3));
    geo.setAttribute("aRand", new THREE.InstancedBufferAttribute(rand, 4));
    const colorAttr = new THREE.InstancedBufferAttribute(new Float32Array(color.dark), 3);
    geo.setAttribute("aColor", colorAttr);
    geo.instanceCount = COUNT;
    group.add(new THREE.LineSegments(geo, material));

    // network inside the brain: nodes spread by farthest-point sampling, linked to near neighbours
    const nodes = [0];
    const dist = new Float32Array(COUNT).fill(Infinity);
    const V = (i: number) => new THREE.Vector3(brainPts[i * 3], brainPts[i * 3 + 1], brainPts[i * 3 + 2]);
    while (nodes.length < NODES) {
      const last = V(nodes[nodes.length - 1]);
      let best = 0;
      for (let i = 0; i < COUNT; i++) {
        dist[i] = Math.min(dist[i], V(i).distanceTo(last));
        if (dist[i] > dist[best]) best = i;
      }
      nodes.push(best);
    }
    const pairs = new Set<string>();
    const ends: number[] = [];
    for (const i of nodes) {
      const near = nodes.filter((j) => j !== i).sort((a, b) => V(a).distanceTo(V(i)) - V(b).distanceTo(V(i))).slice(0, 3);
      for (const j of near) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!pairs.has(key)) { pairs.add(key); ends.push(i, j); }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    const attr = (src: ArrayLike<number>, size: number) =>
      new THREE.BufferAttribute(new Float32Array(ends.flatMap((i) => Array.from({ length: size }, (_, k) => src[i * size + k]))), size);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ends.length * 3), 3));
    for (const [name, pts] of Object.entries(shapes)) lineGeo.setAttribute(name, attr(pts, 3));
    lineGeo.setAttribute("aScatter", attr(scatter, 3));
    lineGeo.setAttribute("aRand", attr(rand, 4));
    const lineColor = new THREE.BufferAttribute(new Float32Array(ends.length * 3), 3);
    lineGeo.setAttribute("aColor", lineColor);
    // shares every uniform with the particles except its own fade
    const lineUniforms = { ...uniforms, uFade: { value: 0.5 } };
    const lineMat = makeMaterial(lineUniforms);
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    // three comets per edge, leaving the central record outwards; elsewhere in either direction
    const TAIL = 6;
    const comets = LINKS.flatMap(([i, j]) => [0, 1, 2].map((n) => {
      const out = i === 0 || Math.random() < 0.5;
      return { from: CLUSTERS[out ? i : j].p, to: CLUSTERS[out ? j : i].p, phase: n / 3 + Math.random() * 0.2, speed: 0.12 + Math.random() * 0.1 };
    }));
    const pulseGeo = new THREE.BufferGeometry();
    const each = (f: (c: (typeof comets)[number], k: number) => number[]) => new Float32Array(comets.flatMap((c) => Array.from({ length: TAIL }, (_, k) => f(c, k)).flat()));
    pulseGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(comets.length * TAIL * 3), 3));
    pulseGeo.setAttribute("aFrom", new THREE.BufferAttribute(each((c) => c.from), 3));
    pulseGeo.setAttribute("aTo", new THREE.BufferAttribute(each((c) => c.to), 3));
    pulseGeo.setAttribute("aPulse", new THREE.BufferAttribute(each((c, k) => [c.phase, c.speed, k]), 3));
    const pulseUniforms = { ...uniforms, uFade: { value: 0 } };
    const pulseMat = new THREE.ShaderMaterial({
      vertexShader: pulseVertex, fragmentShader: fragment, uniforms: pulseUniforms, defines: { PULSE: "" },
      transparent: true, depthWrite: false,
    });
    const pulses = new THREE.Points(pulseGeo, pulseMat);
    pulses.frustumCulled = false; // positions are computed in the shader
    group.add(pulses);


    const applyTheme = () => {
      const theme: Theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      const p = PALETTES[theme];
      renderer.setClearColor(p.bg, 0);
      colorAttr.copyArray(color[theme]);
      colorAttr.needsUpdate = true;
      lineColor.copyArray(new Float32Array(ends.length * 3).fill(p.line));
      lineColor.needsUpdate = true;
      uniforms.uRim.value.fromArray(p.rim);
      uniforms.uHover.value.fromArray(p.hover);
      uniforms.uHead.value.fromArray(p.head);
      if (still) tick(0);
    };
    const themeWatch = new MutationObserver(applyTheme);

    let w = 0, h = 0, raf = 0;
    const target: Pose = { ...POSES.hero, w: [...POSES.hero.w] };
    const state: Pose = { ...POSES.hero, w: [...POSES.hero.w] };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uAspect.value = w / h;
    };

    // Layout is measured on scroll/resize, never once per particle or render frame.
    // The same object travels between actual illustration space in the document.
    const onScroll = () => {
      const pixelsPerUnit = h / (2 * Math.tan(THREE.MathUtils.degToRad(20)) * 6);
      const y = window.scrollY;
      const keys: { at: number; pose: Pose }[] = [];
      for (const el of document.querySelectorAll<HTMLElement>("[data-scene]")) {
        const base = POSES[el.dataset.scene!];
        if (!base) continue;
        const slot = el.querySelector<HTMLElement>(".scene-slot");
        const rect = (slot ?? el).getBoundingClientRect();
        const centerY = slot ? rect.top + rect.height / 2 : rect.top + Math.min(rect.height / 2, h / 2);
        const pose: Pose = { ...base, w: [...base.w] };
        const prev = keys.at(-1)?.pose;
        if (slot) {
          pose.x = (rect.left + rect.width / 2 - w / 2) / pixelsPerUnit;
          pose.y = (h / 2 - centerY) / pixelsPerUnit;
          pose.scale = Math.min(rect.width, rect.height) * .36 / pixelsPerUnit * base.scale; // base.scale: size within the slot
        } else if (prev) {
          // no illustration here: stay with the last one and scroll away with it rather than shrink to a dot
          Object.assign(pose, { x: prev.x, y: prev.y, scale: prev.scale });
        }
        keys.push({ at: el.dataset.scene === "hero" ? 0 : centerY + y - h / 2, pose });
      }
      if (!keys.length) return;
      let pose = keys[keys.length - 1].pose;
      for (let i = 0; i < keys.length - 1; i++) {
        if (y < keys[i + 1].at) {
          pose = blend(keys[i].pose, keys[i + 1].pose, THREE.MathUtils.clamp((y - keys[i].at) / Math.max(1, keys[i + 1].at - keys[i].at), 0, 1));
          break;
        }
      }
      Object.assign(target, pose);

      // A broad transparent feather is a safety margin during the travel between columns.
      const readable = document.querySelectorAll<HTMLElement>(".nav,.hero-copy,.art-caption,.scroll-cue,.intro-section,.block,.walkthrough-section,.agent-intro .section-heading,.agent-workspace,.source-strip,.research-section,.team-section,.closing-copy,.foot");
      let count = 0;
      for (const el of readable) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -72 || rect.top > h + 72 || count === 16) continue;
        uniforms.uClearRects.value[count++].set(rect.left + rect.width / 2, h - rect.top - rect.height / 2, rect.width / 2 + 12, rect.height / 2 + 12);
      }
      uniforms.uClearCount.value = count;
    };

    let tiltX = 0, tiltY = 0;
    const onMove = (e: PointerEvent) => {
      uniforms.uMouse.value.set((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
      tiltY = ((e.clientX / w) - 0.5) * 0.3;
      tiltX = ((e.clientY / h) - 0.5) * 0.15;
    };
    const onLeave = () => uniforms.uMouse.value.set(9, 9);

    const lastMouse = new THREE.Vector2(9, 9);
    const motion = new THREE.Vector2();
    let sway = { y: 0, x: 0 };

    let elapsed = 0, previous = 0;
    const tick = (now: number) => {
      // ease toward the scroll pose so movement feels weighted
      const k = still || pausedRef.current ? 1 : 1 - Math.exp(-Math.min(now - previous || 16, 50) / 110);
      for (const key of ["explode", "x", "y", "rotY", "rotX", "scale", "fade", "pulse"] as const) state[key] += (target[key] - state[key]) * k;
      for (let i = 0; i < 3; i++) state.w[i] += (target.w[i] - state.w[i]) * k;
      if (!still && !pausedRef.current) sway = { y: sway.y + (tiltY - sway.y) * 0.05, x: sway.x + (tiltX - sway.x) * 0.05 };

      if (!pausedRef.current && !still) elapsed += Math.min(now-previous,50)/1000;
      previous = now;
      const t = elapsed;
      uniforms.uMotion.value = still || pausedRef.current ? 0 : 1;
      uniforms.uTime.value = t;
      // pointer velocity, smoothed and decaying, in view-space units
      const m = uniforms.uMouse.value;
      if (lastMouse.x < 5 && m.x < 5) motion.lerp(new THREE.Vector2(m.x - lastMouse.x, m.y - lastMouse.y).multiplyScalar(18), 0.15);
      motion.multiplyScalar(0.92).clampLength(0, 0.9);
      lastMouse.copy(m);
      uniforms.uDelta.value.copy(motion);

      uniforms.uW.value.set(state.w[0], state.w[1], state.w[2]);
      if (still) uniforms.uFade.value = (1 - state.explode * 0.8) * state.fade;
      uniforms.uExplode.value = still ? 0 : state.explode;
      const dim = state.fade;
      if (!still) uniforms.uFade.value = dim;
      // the brain's network only belongs to the brain, and would streak once scattered
      lineUniforms.uFade.value = 0.5 * state.w[0] ** 4 * Math.max(0, 1 - state.explode * 2.5) * dim;
      // motion, so hidden for reduced motion; only on a gathered graph
      pulseUniforms.uFade.value = still ? 0 : state.pulse * state.w[2] ** 4 * Math.max(0, 1 - state.explode * 2.5) * dim;

      group.position.set(state.x, state.y, 0);
      group.scale.setScalar(state.scale);
      group.rotation.y = state.rotY + sway.y + (still ? 0 : Math.sin(t * 0.15) * 0.12);
      group.rotation.x = state.rotX + sway.x;
      renderer.render(scene, camera);
      group.updateMatrixWorld();

      if (!still && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const onScrollFrame = () => { onScroll(); if (still) tick(0); };
    const onResize = () => { resize(); onScrollFrame(); };
    const onMotionChange = () => {
      still = motionPreference.matches;
      cancelAnimationFrame(raf);
      onScroll();
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) { previous = performance.now(); raf = requestAnimationFrame(tick); }
    };
    const layoutObserver = new ResizeObserver(onResize);
    layoutObserver.observe(document.querySelector("main")!);
    motionPreference.addEventListener("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    onScroll();
    applyTheme();
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    Object.assign(state, { ...target, w: [...target.w] });
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScrollFrame, { passive: true });
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      themeWatch.disconnect();
      layoutObserver.disconnect();
      motionPreference.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScrollFrame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      geo.dispose(); lineGeo.dispose(); pulseGeo.dispose(); tetra.dispose(); material.dispose(); lineMat.dispose(); pulseMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <><div ref={ref} className="brain-scene" aria-hidden="true" /><button className="motion-control" aria-pressed={paused} onClick={() => { pausedRef.current = !paused; setPaused(!paused); }}>{paused ? "Play motion" : "Pause motion"}</button></>;
}
