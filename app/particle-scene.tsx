"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// surface patches; amber is kept for the rim so outlines glow warm. Light theme swaps in darker inks.
const PALETTES = {
  dark: { patches: ["#ffffff", "#c9b8ff", "#8052ff", "#2fd3b0", "#a98bff"], bg: 0x000000, rim: [1, 0.72, 0.16], hover: [1, 1, 1], line: 0.55 },
  light: { patches: ["#1b1340", "#5b3fd9", "#8052ff", "#0f8a74", "#3a2a8a"], bg: 0xffffff, rim: [0.85, 0.5, 0], hover: [0.05, 0.05, 0.1], line: 0.35 },
};
type Theme = keyof typeof PALETTES;
const COLORS = PALETTES.dark.patches;
const BRAIN_LABELS = ["Acute appendicitis", "Fever", "Nausea", "Leukocytosis", "Abdominal pain", "Gastroenteritis", "Peritonitis", "Type 2 diabetes"];
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
  { label: "Acute appendicitis", p: [0, 0.05, 0.1], r: 0.2 },
  { label: "Abdominal pain", p: [-0.75, 0.45, 0.2], r: 0.14 },
  { label: "Fever", p: [-0.6, -0.55, -0.2], r: 0.13 },
  { label: "Nausea", p: [0.15, 0.8, -0.3], r: 0.12 },
  { label: "Leukocytosis", p: [0.75, -0.5, 0.25], r: 0.13 },
  { label: "Gastroenteritis", p: [0.8, 0.45, -0.1], r: 0.16 },
  { label: "Peritonitis", p: [0.1, -0.85, -0.25], r: 0.12 },
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
  pain: number; // 0 pain at the navel, 1 moved to the lower right abdomen
};
const P = (w: Pose["w"], explode: number, x: number, rotY: number, scale: number, extra: Partial<Pose> = {}): Pose =>
  ({ w, explode, x, y: 0, rotY, rotX: 0.15, scale, pain: 0, ...extra });
const BRAIN: Pose["w"] = [1, 0, 0], BODYW: Pose["w"] = [0, 1, 0], GRAPH: Pose["w"] = [0, 0, 1];

// Each section marks itself with data-scene; the scene settles into its pose when that section is centred.
const POSES: Record<string, Pose> = {
  hero: P(BRAIN, 0, 1.75, 0.55, 1.45),
  intro: P(BRAIN, 0.35, 1.9, -0.8, 1.35), // turns away first, then starts to come apart
  patients: P(BODYW, 0, -2.2, 0.3, 1.5, { rotX: 0.02 }),
  clinicians: P(BODYW, 0, 2.2, -0.3, 1.5, { rotX: 0.02, pain: 1 }),
  case: P(BODYW, 1, 0, 0, 1.5, { pain: 1 }),
  how: P(GRAPH, 0, 2.1, 0.4, 1.25),
  privacy: P(GRAPH, 0, -2.1, -0.5, 1.3),
  measure: P(GRAPH, 0.9, 0, 0, 1.3),
  plan: P(BODYW, 0, -2.2, 0.5, 1.45, { rotX: 0.02 }),
  team: P(BODYW, 1, 0, 0, 1.45),
  closing: P(BRAIN, 0, 1.75, 0.55, 1.45),
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

function blend(a: Pose, b: Pose, t: number): Pose {
  const s = smooth(t);
  // scattering starts slowly and gathering finishes early
  const te = b.explode > a.explode ? t * t * t : 1 - (1 - t) ** 3;
  return {
    w: [mix(a.w[0], b.w[0], s), mix(a.w[1], b.w[1], s), mix(a.w[2], b.w[2], s)],
    explode: mix(a.explode, b.explode, te),
    x: mix(a.x, b.x, s), y: mix(a.y, b.y, s), rotY: mix(a.rotY, b.rotY, s), rotX: mix(a.rotX, b.rotX, s),
    scale: mix(a.scale, b.scale, s), pain: mix(a.pain, b.pain, s),
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
    float t = uTime * uMotion;
    c += vec3(sin(t * .6 + aRand.y * 6.28), cos(t * .5 + aRand.z * 6.28), sin(t * .4 + aRand.w * 6.28)) * (0.012 + e * 0.12);

    vec4 mv = modelViewMatrix * vec4(c, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 d = clip.xy / clip.w - uMouse;
    d.x *= uAspect;
    // near the cursor particles stir in place and get flung along the pointer's motion; nothing is pushed out
    float near = smoothstep(0.3, 0.0, length(d)) * (1.0 - e) * uMotion;
    vec2 stir = vec2(sin(uTime * (2.0 + aRand.y * 4.0) + aRand.z * 6.28), cos(uTime * (2.0 + aRand.y * 4.0) + aRand.w * 6.28));
    mv.xy += near * (stir * (0.08 + aRand.z * 0.16) + uDelta * (0.5 + aRand.y * 1.5));

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
  void main() { gl_FragColor = vec4(vColor, vAlpha * uFade); }
`;

function label(host: HTMLElement, text: string, className = "node-label") {
  const el = document.createElement("span");
  el.className = className;
  el.textContent = text;
  host.appendChild(el);
  return el;
}

export default function ParticleScene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current!;
    const mobile = window.innerWidth < 760;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const COUNT = mobile ? 2400 : 4200;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
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
      uMotion: { value: still ? 0 : 1 }, uSize: { value: 0.03 },
      uMouse: { value: new THREE.Vector2(9, 9) }, uDelta: { value: new THREE.Vector2() }, uAspect: { value: 1 }, uFade: { value: 1 },
      uRim: { value: new THREE.Vector3() }, uHover: { value: new THREE.Vector3() },
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

    // HTML overlays stay crisp: brain node names, graph cluster names, and the patient's pain point
    const brainLabels = BRAIN_LABELS.map((t) => label(host, t));
    const graphLabels = CLUSTERS.map((cl) => label(host, cl.label));
    const pain = label(host, "", "pain-marker");
    const painText = document.createElement("span");
    pain.append(document.createElement("i"), painText);

    const applyTheme = () => {
      const theme: Theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      const p = PALETTES[theme];
      renderer.setClearColor(p.bg, 1);
      colorAttr.copyArray(color[theme]);
      colorAttr.needsUpdate = true;
      lineColor.copyArray(new Float32Array(ends.length * 3).fill(p.line));
      lineColor.needsUpdate = true;
      uniforms.uRim.value.fromArray(p.rim);
      uniforms.uHover.value.fromArray(p.hover);
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

    const onScroll = () => {
      // keyframes: the scroll position at which each marked section is centred
      const keys = Array.from(document.querySelectorAll<HTMLElement>("[data-scene]")).map((el, i) => {
        const r = el.getBoundingClientRect();
        return { at: i === 0 ? 0 : r.top + window.scrollY + r.height / 2 - h / 2, pose: POSES[el.dataset.scene!] };
      }).filter((k) => k.pose);
      const y = window.scrollY;
      let pose = keys[keys.length - 1].pose;
      for (let i = 0; i < keys.length - 1; i++) {
        if (y < keys[i + 1].at) { pose = blend(keys[i].pose, keys[i + 1].pose, Math.max(0, (y - keys[i].at) / (keys[i + 1].at - keys[i].at))); break; }
      }
      Object.assign(target, pose);
      if (w < 760) {
        // phones: centred behind the text and dimmer, except the hero where it sits above the headline
        target.x = 0;
        target.y = y < h * 0.5 ? 0.85 : 0;
        target.scale = pose.scale * 0.6;
      }
    };

    let tiltX = 0, tiltY = 0;
    const onMove = (e: PointerEvent) => {
      uniforms.uMouse.value.set((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
      tiltY = ((e.clientX / w) - 0.5) * 0.3;
      tiltX = ((e.clientY / h) - 0.5) * 0.15;
    };
    const onLeave = () => uniforms.uMouse.value.set(9, 9);

    const v = new THREE.Vector3();
    const place = (el: HTMLElement, x: number, y: number, z: number, opacity: number, dx = 10, dy = -7) => {
      v.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera);
      el.style.opacity = String(Math.max(0, opacity));
      el.style.transform = `translate(${((v.x + 1) / 2) * w + dx}px, ${((1 - v.y) / 2) * h + dy}px)`;
    };
    const lastMouse = new THREE.Vector2(9, 9);
    const motion = new THREE.Vector2();
    let sway = { y: 0, x: 0 };

    const tick = (now: number) => {
      // ease toward the scroll pose so movement feels weighted
      const k = still ? 1 : 0.06;
      for (const key of ["explode", "x", "y", "rotY", "rotX", "scale", "pain"] as const) state[key] += (target[key] - state[key]) * k;
      for (let i = 0; i < 3; i++) state.w[i] += (target.w[i] - state.w[i]) * k;
      sway = { y: sway.y + (tiltY - sway.y) * 0.05, x: sway.x + (tiltX - sway.x) * 0.05 };

      const t = now / 1000;
      uniforms.uTime.value = t;
      // pointer velocity, smoothed and decaying, in view-space units
      const m = uniforms.uMouse.value;
      if (lastMouse.x < 5 && m.x < 5) motion.lerp(new THREE.Vector2(m.x - lastMouse.x, m.y - lastMouse.y).multiplyScalar(18), 0.15);
      motion.multiplyScalar(0.92).clampLength(0, 0.9);
      lastMouse.copy(m);
      uniforms.uDelta.value.copy(motion);

      uniforms.uW.value.set(state.w[0], state.w[1], state.w[2]);
      if (still) uniforms.uFade.value = 1 - state.explode * 0.8;
      else uniforms.uExplode.value = state.explode;
      const dim = w < 760 && window.scrollY > h * 0.5 ? 0.3 : 1;
      if (!still) uniforms.uFade.value = dim;
      // the brain's network only belongs to the brain, and would streak once scattered
      lineUniforms.uFade.value = 0.5 * state.w[0] ** 4 * Math.max(0, 1 - state.explode * 2.5) * dim;

      group.position.set(state.x, state.y, 0);
      group.scale.setScalar(state.scale);
      group.rotation.y = state.rotY + sway.y + (still ? 0 : Math.sin(t * 0.15) * 0.12);
      group.rotation.x = state.rotX + sway.x;
      renderer.render(scene, camera);
      group.updateMatrixWorld();

      const settled = Math.max(0, 1 - state.explode * 4);
      brainLabels.forEach((el, i) => {
        const n = nodes[i];
        place(el, brainPts[n * 3], brainPts[n * 3 + 1], brainPts[n * 3 + 2], settled * state.w[0] ** 6);
      });
      graphLabels.forEach((el, i) => {
        const p = CLUSTERS[i].p;
        place(el, p[0], p[1] + CLUSTERS[i].r + 0.04, p[2], settled * state.w[2] ** 6, -20, -18);
      });
      // pain starts around the navel and moves to the lower right abdomen (the patient's right is our left)
      place(pain, mix(0, -0.11, state.pain), mix(0.02, -0.1, state.pain), 0.13, settled * state.w[1] ** 6, -9, -9);
      pain.classList.toggle("flip", state.x > 0);
      const text = state.pain < 0.5 ? "Day 0, 08:00 · pain around the navel" : "Day 0, 14:00 · pain moves to the lower right";
      if (painText.textContent !== text) painText.textContent = text;

      if (!still) raf = requestAnimationFrame(tick);
    };

    const onScrollFrame = () => { onScroll(); if (still) tick(0); };
    const onResize = () => { resize(); onScrollFrame(); };
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
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScrollFrame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      [...brainLabels, ...graphLabels, pain].forEach((el) => el.remove());
      geo.dispose(); lineGeo.dispose(); tetra.dispose(); material.dispose(); lineMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={ref} className="brain-scene" aria-hidden="true" />;
}
