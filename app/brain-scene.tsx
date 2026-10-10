"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const COLORS = ["#8052ff", "#a98bff", "#ffb829", "#2fd3b0", "#ff5fd2", "#4f8dff", "#ffffff"];
const LABELS = ["Acute appendicitis", "Fever", "Nausea", "Leukocytosis", "Abdominal pain", "Gastroenteritis", "Peritonitis", "Type 2 diabetes"];
const NODES = 110;

// Brain volume, x front→back, y up, z left→right, roughly in [-1, 1].
function inside(x: number, y: number, z: number) {
  const e = (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number) =>
    ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 <= 1;
  const cerebrum = e(0, 0.08, 0, 1, 0.68, 0.66) && y > -0.42 && !(Math.abs(z) < 0.025 && y > -0.2);
  const temporal = e(-0.08, -0.34, 0.36, 0.6, 0.22, 0.26) || e(-0.08, -0.34, -0.36, 0.6, 0.22, 0.26);
  const cerebellum = e(0.6, -0.48, 0, 0.3, 0.2, 0.44);
  const stem = Math.hypot(x - (0.27 - (y + 0.4) * 0.15), z) < 0.11 && y < -0.36 && y > -0.95;
  return cerebrum || temporal || cerebellum || stem;
}

function folds(x: number, y: number, z: number) {
  const f = Math.sin(x * 9 + Math.sin(y * 6) * 2.4) * Math.cos(y * 8 + Math.sin(z * 6) * 2) * Math.cos(z * 7 + x * 3);
  return 0.12 + 0.88 * (f * 0.5 + 0.5) ** 2;
}

function sampleBrain(count: number) {
  const pts: number[] = [];
  while (pts.length < count * 3) {
    const x = Math.random() * 2 - 1, y = Math.random() * 2 - 1, z = Math.random() * 2 - 1;
    if (!inside(x, y, z)) continue;
    const shell = !inside(x * 1.07, y * 1.07, z * 1.07);
    // mostly a folded shell, with a thin haze inside
    if (shell ? Math.random() > folds(x, y, z) : Math.random() > 0.05) continue;
    pts.push(x, y, z);
  }
  return pts;
}

const vertex = /* glsl */ `
  attribute vec3 aBrain;
  attribute vec3 aScatter;
  attribute vec4 aRand;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uExplode;
  uniform float uMotion;
  uniform float uSize;
  uniform vec2 uMouse;
  uniform float uAspect;
  varying vec3 vColor;
  varying float vAlpha;

  mat3 rot(vec3 a) {
    float cx = cos(a.x), sx = sin(a.x), cy = cos(a.y), sy = sin(a.y);
    return mat3(cy, 0., -sy, 0., 1., 0., sy, 0., cy) * mat3(1., 0., 0., 0., cx, sx, 0., -sx, cx);
  }

  void main() {
    // each particle leaves at its own moment, so the brain crumbles
    float e = smoothstep(aRand.x * 0.4, aRand.x * 0.4 + 0.6, uExplode);
    vec3 c = mix(aBrain, aScatter, e);
    float t = uTime * uMotion;
    c += vec3(sin(t * .6 + aRand.y * 6.28), cos(t * .5 + aRand.z * 6.28), sin(t * .4 + aRand.w * 6.28)) * (0.012 + e * 0.12);

    vec4 mv = modelViewMatrix * vec4(c, 1.0);
    vec4 clip = projectionMatrix * mv;
    vec2 d = clip.xy / clip.w - uMouse;
    d.x *= uAspect;
    float push = smoothstep(0.32, 0.0, length(d)) * (1.0 - e) * uMotion;
    mv.xy += normalize(d + 1e-5) * push * 0.22;

    mv.xyz += rot(vec3(t * (aRand.y - .5) + aRand.z * 6.28, t * (aRand.w - .5) + aRand.y * 6.28, 0.)) * position * uSize * (0.6 + aRand.w);
    gl_Position = projectionMatrix * mv;

    // fake depth of field: sharp at the brain's depth, faint in front and behind
    float focus = abs(-mv.z - 6.0);
    vAlpha = mix(0.8, 0.12, smoothstep(0.0, 2.6, focus)) * mix(1.0, 0.28 * step(aRand.x, 0.3), e);
    vColor = aColor;
  }
`;

const fragment = /* glsl */ `
  uniform float uFade;
  varying vec3 vColor;
  varying float vAlpha;
  void main() { gl_FragColor = vec4(vColor, vAlpha * uFade); }
`;

export default function BrainScene() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current!;
    const mobile = window.innerWidth < 760;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const COUNT = mobile ? 2800 : 5500;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 6);
    const brain = new THREE.Group();
    scene.add(brain);

    const brainPts = sampleBrain(COUNT);
    const scatter = new Float32Array(COUNT * 3);
    const rand = new Float32Array(COUNT * 4);
    const color = new Float32Array(COUNT * 3);
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      scatter.set([(Math.random() - 0.5) * 12, (Math.random() - 0.5) * 8, -6 + Math.random() * 9], i * 3);
      rand.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      c.set(COLORS[(Math.random() * COLORS.length) | 0]);
      color.set([c.r, c.g, c.b], i * 3);
    }

    const uniforms = {
      uTime: { value: 0 }, uExplode: { value: 0 }, uMotion: { value: still ? 0 : 1 }, uSize: { value: 0.022 },
      uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: 1 }, uFade: { value: 1 },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, uniforms,
      transparent: true, depthWrite: false,
    });

    // particles: outlined tetrahedra, instanced
    const tetra = new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(1));
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute("position", tetra.getAttribute("position"));
    geo.setAttribute("aBrain", new THREE.InstancedBufferAttribute(new Float32Array(brainPts), 3));
    geo.setAttribute("aScatter", new THREE.InstancedBufferAttribute(scatter, 3));
    geo.setAttribute("aRand", new THREE.InstancedBufferAttribute(rand, 4));
    geo.setAttribute("aColor", new THREE.InstancedBufferAttribute(color, 3));
    geo.instanceCount = COUNT;
    brain.add(new THREE.LineSegments(geo, material));

    // the knowledge graph: nodes spread by farthest-point sampling, linked to near neighbours
    const nodes = [0];
    const dist = new Float32Array(COUNT).fill(Infinity);
    const P = (i: number) => new THREE.Vector3(brainPts[i * 3], brainPts[i * 3 + 1], brainPts[i * 3 + 2]);
    while (nodes.length < NODES) {
      const last = P(nodes[nodes.length - 1]);
      let best = 0;
      for (let i = 0; i < COUNT; i++) {
        dist[i] = Math.min(dist[i], P(i).distanceTo(last));
        if (dist[i] > dist[best]) best = i;
      }
      nodes.push(best);
    }
    const pairs = new Set<string>();
    const ends: number[] = [];
    for (const i of nodes) {
      const near = nodes.filter((j) => j !== i).sort((a, b) => P(a).distanceTo(P(i)) - P(b).distanceTo(P(i))).slice(0, 3);
      for (const j of near) {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!pairs.has(key)) { pairs.add(key); ends.push(i, j); }
      }
    }
    const lineGeo = new THREE.BufferGeometry();
    const attr = (src: Float32Array | number[], size: number) =>
      new THREE.BufferAttribute(new Float32Array(ends.flatMap((i) => Array.from({ length: size }, (_, k) => src[i * size + k]))), size);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(ends.length * 3), 3));
    lineGeo.setAttribute("aBrain", attr(brainPts, 3));
    lineGeo.setAttribute("aScatter", attr(scatter, 3));
    lineGeo.setAttribute("aRand", attr(rand, 4));
    lineGeo.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(ends.length * 3).fill(0.55), 3));
    // shares every uniform with the particles except its own fade
    const lineUniforms = { ...uniforms, uFade: { value: 0.5 } };
    const lineMat = new THREE.ShaderMaterial({
      vertexShader: vertex, fragmentShader: fragment, uniforms: lineUniforms,
      transparent: true, depthWrite: false,
    });
    brain.add(new THREE.LineSegments(lineGeo, lineMat));

    // labels follow their nodes as HTML so they stay crisp
    const labels = LABELS.map((text) => {
      const el = document.createElement("span");
      el.className = "node-label";
      el.textContent = text;
      host.appendChild(el);
      return el;
    });

    const target = { explode: 0, x: 0, y: 0, rotY: 0, rotX: 0 };
    const state = { explode: 0, x: 0, y: 0, rotY: 0, rotX: 0 };
    let w = 0, h = 0, raf = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uAspect.value = w / h;
      brain.scale.setScalar(w < 760 ? 0.85 : 1.45);
    };
    const onScroll = () => {
      const y = window.scrollY, max = document.documentElement.scrollHeight - h;
      const away = Math.min(1, y / (h * 1.1));
      const back = Math.min(1, Math.max(0, (y - (max - h * 1.3)) / (h * 1.1)));
      target.explode = Math.max(0, away - back);
      // right of the headline in the hero, back there again for the closing section
      target.x = w < 760 ? 0 : 1.75 * Math.max(1 - away, back);
      // phones: above the headline instead of beside it
      target.y = w < 760 ? 0.85 : 0;
    };
    const onMove = (e: PointerEvent) => {
      uniforms.uMouse.value.set((e.clientX / w) * 2 - 1, -(e.clientY / h) * 2 + 1);
      target.rotY = ((e.clientX / w) - 0.5) * 0.5;
      target.rotX = ((e.clientY / h) - 0.5) * 0.25;
    };
    const onLeave = () => uniforms.uMouse.value.set(9, 9);

    const v = new THREE.Vector3();
    const tick = (now: number) => {
      // ease toward targets so scroll and pointer feel weighted
      const k = still ? 1 : 0.07;
      state.explode += (target.explode - state.explode) * k;
      state.x += (target.x - state.x) * k;
      state.y += (target.y - state.y) * k;
      state.rotY += (target.rotY - state.rotY) * 0.05;
      state.rotX += (target.rotX - state.rotX) * 0.05;
      const t = now / 1000;
      uniforms.uTime.value = t;
      if (still) uniforms.uFade.value = 1 - state.explode * 0.8;
      else uniforms.uExplode.value = state.explode;
      // edges would streak across the screen once scattered, so they fade out first
      lineUniforms.uFade.value = 0.5 * Math.max(0, 1 - state.explode * 2.5);
      brain.position.set(state.x, state.y, 0);
      brain.rotation.y = -0.35 + state.rotY + (still ? 0 : Math.sin(t * 0.15) * 0.25);
      brain.rotation.x = state.rotX;
      renderer.render(scene, camera);

      const show = Math.max(0, 1 - state.explode * 4);
      brain.updateMatrixWorld();
      labels.forEach((el, i) => {
        const n = nodes[i];
        v.set(brainPts[n * 3], brainPts[n * 3 + 1], brainPts[n * 3 + 2]).applyMatrix4(brain.matrixWorld).project(camera);
        el.style.opacity = String(show);
        el.style.transform = `translate(${((v.x + 1) / 2) * w + 10}px, ${((1 - v.y) / 2) * h - 7}px)`;
      });
      if (!still) raf = requestAnimationFrame(tick);
    };

    const onScrollFrame = () => { onScroll(); if (still) tick(0); };
    const onResize = () => { resize(); onScrollFrame(); };
    resize();
    onScroll();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScrollFrame, { passive: true });
    window.addEventListener("pointermove", onMove);
    document.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScrollFrame);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      labels.forEach((el) => el.remove());
      geo.dispose(); lineGeo.dispose(); tetra.dispose(); material.dispose(); lineMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={ref} className="brain-scene" aria-hidden="true" />;
}
