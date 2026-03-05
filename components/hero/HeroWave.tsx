"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import gsap from "gsap";
import { Navbar } from "@/components/ui/mini-navbar";

export type HeroWaveProps = {
  className?: string;
  style?: React.CSSProperties;
  extendLeftPx?: number;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  onPromptSubmit?: (value: string) => void;
  /** When provided, renders this instead of the hero form (e.g. chat UI) over the wave */
  children?: React.ReactNode;
  /** When provided, shows Chat vs Research mode toggle */
  researchMode?: boolean;
  onResearchModeChange?: (enabled: boolean) => void;
  notebookOpen?: boolean;
  onToggleNotebook?: () => void;
};

export function HeroWave({
  className,
  style,
  extendLeftPx = 320,
  title = "Research with AI.",
  subtitle = "Ask anything. Get structured answers with source citations.",
  placeholder = "Describe what you want to research...",
  buttonText = "Search",
  onPromptSubmit,
  children,
  researchMode = false,
  onResearchModeChange,
  notebookOpen,
  onToggleNotebook,
}: HeroWaveProps) {
  const [prompt, setPrompt] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<HTMLDivElement | null>(null);

  const basePlaceholder = "What is ";
  const suggestionsRef = useRef<string[]>([
    " the latest on climate change?",
    " causing inflation in 2025?",
    " the best approach to learn TypeScript?",
    " happening with AI agents?",
    " the state of quantum computing?",
    " the impact of remote work?",
  ]);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState<string>(basePlaceholder);
  const typingStateRef = useRef({
    suggestionIndex: 0,
    charIndex: 0,
    deleting: false,
    running: true,
  });
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    typingStateRef.current.running = true;
    const typeSpeed = 70;
    const deleteSpeed = 40;
    const pauseAtEnd = 1200;
    const pauseBetween = 500;

    function schedule(fn: () => void, delay: number) {
      const id = window.setTimeout(fn, delay);
      timersRef.current.push(id);
    }

    function clearTimers() {
      for (const id of timersRef.current) window.clearTimeout(id);
      timersRef.current = [];
    }

    function step() {
      if (!typingStateRef.current.running) return;
      if (prompt !== "") {
        setAnimatedPlaceholder(basePlaceholder);
        schedule(step, 300);
        return;
      }

      const state = typingStateRef.current;
      const suggestions = suggestionsRef.current;
      const current = suggestions[state.suggestionIndex % suggestions.length] || "";

      if (!state.deleting) {
        const nextIndex = state.charIndex + 1;
        const next = current.slice(0, nextIndex);
        setAnimatedPlaceholder(basePlaceholder + next);
        state.charIndex = nextIndex;
        if (nextIndex >= current.length) {
          schedule(() => {
            state.deleting = true;
            step();
          }, pauseAtEnd);
        } else {
          schedule(step, typeSpeed);
        }
      } else {
        const nextIndex = Math.max(0, state.charIndex - 1);
        const next = current.slice(0, nextIndex);
        setAnimatedPlaceholder(basePlaceholder + next);
        state.charIndex = nextIndex;
        if (nextIndex <= 0) {
          state.deleting = false;
          state.suggestionIndex = (state.suggestionIndex + 1) % suggestions.length;
          schedule(step, pauseBetween);
        } else {
          schedule(step, deleteSpeed);
        }
      }
    }

    clearTimers();
    schedule(step, 400);
    return () => {
      typingStateRef.current.running = false;
      clearTimers();
    };
  }, [prompt]);

  useEffect(() => {
    if (!containerRef.current || !waveRef.current) return;

    const FilmGrainShader = {
      uniforms: {
        tDiffuse: { value: null as THREE.Texture | null },
        time: { value: 0 },
        intensity: { value: 1.1 },
        grainScale: { value: 0.5 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        #ifdef GL_ES
          precision highp int;
          precision mediump float;
        #else
          precision mediump float;
        #endif
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        uniform float grainScale;
        varying vec2 vUv;

        float sparkleNoise(vec2 p) {
          vec2 jPos = p + vec2(37.0, 17.0) * fract(time * 0.07);
          vec3 p3 = fract(vec3(jPos.xyx) * vec3(.1031, .1030, .0973) + time * 0.1);
          p3 += dot(p3, p3.yxz + 19.19);
          return fract((p3.x + p3.y) * p3.z);
        }

        void main() {
          vec4 color = texture2D(tDiffuse, vUv);
          vec2 pos = gl_FragCoord.xy * 0.5 * grainScale;
          float noise = sparkleNoise(pos);
          noise = noise * 2.0 - 1.0;
          vec3 result = color.rgb + noise * intensity * 0.1;
          gl_FragColor = vec4(result, color.a);
        }
      `,
    };

    function createFilmGrainPass(intensity = 0.9, grainScale = 0.3) {
      const pass = new ShaderPass(FilmGrainShader as THREE.ShaderMaterialParameters & { uniforms: Record<string, { value: unknown }> });
      (pass.uniforms as Record<string, { value: number }>).intensity.value = intensity;
      (pass.uniforms as Record<string, { value: number }>).grainScale.value = grainScale;
      return pass;
    }

    const wave1 = { gain: 10, frequency: 0, waveLength: 0.5, currentAngle: 0 };
    const wave2 = { gain: 0, frequency: 0, waveLength: 0.5, currentAngle: 0 };

    const waveKeyframes1 = [
      { time: 0, gain: 10, frequency: 0, waveLength: 0.5 },
      { time: 4, gain: 300, frequency: 1, waveLength: 0.5 },
      { time: 6, gain: 300, frequency: 4, waveLength: Math.PI * 1.5 },
      { time: 8, gain: 225, frequency: 4, waveLength: Math.PI * 1.5 },
      { time: 10, gain: 500, frequency: 1, waveLength: Math.PI * 1.5 },
      { time: 14, gain: 225, frequency: 3, waveLength: Math.PI * 1.5 },
      { time: 22, gain: 100, frequency: 6, waveLength: Math.PI * 1.5 },
      { time: 28, gain: 0, frequency: 0.9, waveLength: 0.5 },
      { time: 30, gain: 128, frequency: 0.9, waveLength: 0.5 },
      { time: 32, gain: 190, frequency: 1.42, waveLength: 0.5 },
      { time: 39, gain: 499, frequency: 4.0, waveLength: Math.PI * 1.5 },
      { time: 40, gain: 500, frequency: 4.0, waveLength: Math.PI * 1.5 },
      { time: 42, gain: 400, frequency: 2.82, waveLength: Math.PI * 1.5 },
      { time: 44, gain: 327, frequency: 2.56, waveLength: Math.PI * 1.5 },
      { time: 48, gain: 188, frequency: 5.4, waveLength: 0.5 },
      { time: 52, gain: 32, frequency: 0.1, waveLength: 0.5 },
      { time: 55, gain: 10, frequency: 0, waveLength: 0.5 },
    ];

    const waveKeyframes2 = [
      { time: 0, gain: 0, frequency: 0, waveLength: 0.5 },
      { time: 9, gain: 0, frequency: 0, waveLength: 0.5 },
      { time: 10, gain: 400, frequency: 1, waveLength: 0.5 },
      { time: 13, gain: 300, frequency: 4, waveLength: Math.PI * 1.5 },
      { time: 24, gain: 96, frequency: 2, waveLength: 0.5 },
      { time: 28, gain: 0, frequency: 0.9, waveLength: 0.5 },
      { time: 30, gain: 142, frequency: 0.9, waveLength: 0.5 },
      { time: 36, gain: 374, frequency: 4.0, waveLength: Math.PI * 1.5 },
      { time: 38, gain: 375, frequency: 4.0, waveLength: Math.PI * 1.5 },
      { time: 40, gain: 300, frequency: 2.26, waveLength: Math.PI * 1.5 },
      { time: 44, gain: 245, frequency: 2.05, waveLength: Math.PI * 1.5 },
      { time: 48, gain: 141, frequency: 5.12, waveLength: 0.5 },
      { time: 52, gain: 24, frequency: 0.08, waveLength: 0.5 },
      { time: 55, gain: 8, frequency: 0, waveLength: 0.5 },
    ];

    const mouse = { x: 0, y: 0, active: false };
    let proxyMouseX = 0,
      proxyMouseY = 0,
      proxyInitialized = false;

    const glowConfig = {
      maxGlowDistance: 690,
      speedScale: 0.52,
      fadeSpeed: 4.4,
      glowFalloff: 0.6,
      mouseSmoothing: 30.0,
    };

    const glowDynamics = {
      accumulation: 1.2,
      decay: 3.3,
      max: 40.0,
      accumEase: 1.5,
      speedEase: 8.5,
    };

    let DPR_CAP = 2;
    const mm = gsap.matchMedia();
    mm.add("(max-resolution: 180dpi)", () => {
      DPR_CAP = 1.5;
    });
    const EFFECT_PR = Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, DPR_CAP) * 0.5;

    const waveContainer = waveRef.current;
    while (waveContainer.firstChild) {
      waveContainer.removeChild(waveContainer.firstChild);
    }
    const waveRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    waveRenderer.setPixelRatio(EFFECT_PR);
    waveRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    waveRenderer.toneMappingExposure = 1.0;
    waveRenderer.autoClear = false;
    waveContainer.appendChild(waveRenderer.domElement);

    const waveScene = new THREE.Scene();
    waveScene.add(new THREE.AmbientLight(0xffffff, 0.2));

    let waveCamera: THREE.OrthographicCamera;
    let waveComposer: EffectComposer;
    let waveRenderPass: RenderPass;
    let waveBloomPass: UnrealBloomPass;
    let grainPass: ShaderPass;
    let cameraWidth = 0,
      cameraHeight = 0,
      waveCameraInitialized = false;

    let setMouseNDC: (v: number) => void,
      setSmoothSpeed: (v: number) => void,
      setPhase1: (v: number) => void,
      setPhase2: (v: number) => void;

    const MAX_BARS = 256;
    const FIXED_BAR_WIDTH = 14;
    const FIXED_BAR_GAP = 10;
    const EXTEND_LEFT_PX = extendLeftPx;

    let instancedBars: THREE.InstancedMesh | null = null;
    let currentBarCount = 0;
    let barMaterial: THREE.ShaderMaterial;
    let barCenters: Float32Array | null = null;

    function updateGlowDistance() {
      if (!barMaterial) return;
      const totalWidth = currentBarCount * (FIXED_BAR_WIDTH + FIXED_BAR_GAP) - FIXED_BAR_GAP;
      const spanPx = totalWidth * 0.3;
      glowConfig.maxGlowDistance = spanPx;
      (barMaterial.uniforms as Record<string, { value: number }>).uMaxGlowDist.value = spanPx;
    }

    function createInstancedMaterial() {
      const baseCol = new THREE.Color("hsl(220,100%,50%)");
      const emisCol = new THREE.Color("#1f3dbc");

      return new THREE.ShaderMaterial({
        defines: { USE_INSTANCING: "" },
        uniforms: {
          uMouseClipX: { value: 0 },
          uHalfW: { value: 0 },
          uMaxGlowDist: { value: glowConfig.maxGlowDistance },
          uGlowFalloff: { value: glowConfig.glowFalloff },
          uSmoothSpeed: { value: 0 },
          uGainMul: { value: 1 },
          uBaseY: { value: 0 },
          w1Gain: { value: wave1.gain },
          w1Len: { value: wave1.waveLength },
          w1Phase: { value: 0 },
          w2Gain: { value: wave2.gain },
          w2Len: { value: wave2.waveLength },
          w2Phase: { value: 0 },
          uFixedTipPx: { value: 10 },
          uMinBottomWidthPx: { value: 0 },
          uColor: { value: baseCol },
          uEmissive: { value: emisCol },
          uBaseEmissive: { value: 0.05 },
          uRotationAngle: { value: THREE.MathUtils.degToRad(23.4) },
        },
        vertexShader: `
          attribute float aXPos, aPosNorm, aGroup, aGlow;
          uniform float uMouseClipX, uHalfW, uMaxGlowDist, uGlowFalloff;
          uniform float uGainMul, uBaseY;
          uniform float w1Gain, w1Len, w1Phase;
          uniform float w2Gain, w2Len, w2Phase;
          uniform float uRotationAngle;
          varying float vGlow, vPulse, vHeight;
          varying vec2 vUv;

          float sineH(float g, float len, float ph, float t){
            return max(20.0, (sin(ph + t * len) * 0.5 + 0.6) * g * uGainMul);
          }

          void main(){
            vUv = uv;
            float h1 = sineH(w1Gain, w1Len, w1Phase, aPosNorm);
            float h2 = sineH(w2Gain, w2Len, w2Phase, aPosNorm);
            vHeight = mix(h1, h2, aGroup);

            vec3 pos = position;
            pos.x += aXPos;
            pos.y = 0.0;

            float height = vHeight * uv.y;
            pos.x += height * tan(uRotationAngle);
            pos.y += height;

            pos.y += uBaseY;

            vec4 clip = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
            float dxPx = abs(uMouseClipX - clip.x/clip.w) * uHalfW;
            float prox = clamp(1.0 - pow(dxPx / uMaxGlowDist, uGlowFalloff), 0.0, 1.0);

            vGlow  = aGlow;
            vPulse = prox;
            gl_Position = clip;
          }
        `,
        fragmentShader: `
          #ifdef GL_ES
            precision highp int;
            precision mediump float;
          #else
            precision mediump float;
          #endif
          uniform vec3 uColor, uEmissive;
          uniform float uBaseEmissive;
          uniform float uFixedTipPx, uMinBottomWidthPx;
          varying float vGlow, vPulse, vHeight;
          varying vec2 vUv;

          void main(){
            float tipProp = clamp(uFixedTipPx / vHeight, 0.0, 0.95);
            float transitionY = 1.0 - tipProp;
            float xFromCenter = abs(vUv.x - 0.5) * 2.0;
            float px = fwidth(vUv.x);
            float allowedWidth;

            if (vUv.y >= transitionY){
              float topPos = (vUv.y - transitionY) / tipProp;
              allowedWidth = 1.0 - pow(topPos, 0.9);
            } else {
              float bottomPos = vUv.y / transitionY;
              allowedWidth = max(uMinBottomWidthPx * px * 10.0, pow(bottomPos, 0.5));
            }

            float alpha = smoothstep(-px, px, allowedWidth - xFromCenter);
            if (alpha < 0.01) discard;

            float emissiveStrength = uBaseEmissive + vGlow * 0.9 + vPulse * 0.15;
            vec3 finalColor = uColor + uEmissive * emissiveStrength;
            gl_FragColor = vec4(finalColor, 0.35 * alpha);
          }
        `,
        side: THREE.FrontSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
    }

    function setupQuickSetters() {
      const u = (instancedBars!.material as THREE.ShaderMaterial).uniforms as Record<string, { value: number }>;
      setMouseNDC = gsap.quickSetter(u.uMouseClipX, "value") as (v: number) => void;
      setSmoothSpeed = gsap.quickSetter(u.uSmoothSpeed, "value") as (v: number) => void;
      setPhase1 = gsap.quickSetter(u.w1Phase, "value") as (v: number) => void;
      setPhase2 = gsap.quickSetter(u.w2Phase, "value") as (v: number) => void;
    }

    const MAX_KEYFRAME_GAIN = 500;
    const SCREEN_COVERAGE = 0.6;
    function updateGainMultiplier() {
      if (!barMaterial) return;
      const targetPx = cameraHeight * SCREEN_COVERAGE;
      (barMaterial.uniforms as Record<string, { value: number }>).uGainMul.value = targetPx / MAX_KEYFRAME_GAIN;
    }

    const listeners: Array<() => void> = [];
    let rect = waveRenderer.domElement.getBoundingClientRect();

    function setupPointerTracking() {
      const el = waveRenderer.domElement;
      const readCoords = (e: PointerEvent | TouchEvent): { x: number; y: number } => {
        if ("clientX" in e) return { x: (e as PointerEvent).clientX, y: (e as PointerEvent).clientY };
        const t = (e as TouchEvent).touches?.[0] || (e as TouchEvent).changedTouches?.[0];
        return t ? { x: t.clientX, y: t.clientY } : { x: mouse.x, y: mouse.y };
      };
      const updatePos = (e: PointerEvent | TouchEvent, active: boolean) => {
        const { x, y } = readCoords(e);
        const r = rect;
        mouse.x = x - r.left;
        mouse.y = y - r.top;
        mouse.active = active;
        if (!proxyInitialized) {
          proxyMouseX = mouse.x;
          proxyMouseY = mouse.y;
          proxyInitialized = true;
        }
      };
      const activate = (e: PointerEvent | TouchEvent) => updatePos(e, true);
      const move = (e: PointerEvent | TouchEvent) => updatePos(e, true);
      const deactivate = () => {
        mouse.active = false;
      };

      el.addEventListener("pointerdown", activate as EventListener, { passive: true });
      el.addEventListener("pointermove", move as EventListener, { passive: true });
      window.addEventListener("pointerup", deactivate, { passive: true });
      el.addEventListener("pointerleave", deactivate, { passive: true });
      el.addEventListener("touchstart", activate as EventListener, { passive: true });
      el.addEventListener("touchmove", move as EventListener, { passive: true });
      window.addEventListener("touchend", deactivate, { passive: true });
      window.addEventListener("touchcancel", deactivate, { passive: true });

      listeners.push(() => {
        el.removeEventListener("pointerdown", activate as EventListener);
        el.removeEventListener("pointermove", move as EventListener);
        window.removeEventListener("pointerup", deactivate);
        el.removeEventListener("pointerleave", deactivate);
        el.removeEventListener("touchstart", activate as EventListener);
        el.removeEventListener("touchmove", move as EventListener);
        window.removeEventListener("touchend", deactivate);
        window.removeEventListener("touchcancel", deactivate);
      });
    }

    function accumulateGlow(dt: number) {
      if (!instancedBars) return;
      const attr = instancedBars.geometry.getAttribute("aGlow") as THREE.InstancedBufferAttribute;
      const arr = attr.array as Float32Array;

      const mouseWorldX = proxyMouseX - cameraWidth * 0.5;
      const mDist = glowConfig.maxGlowDistance;
      const fall = glowConfig.glowFalloff;

      const decayLerp = 1.0 - Math.exp(-glowDynamics.decay * dt);
      const addEase = 1.0 - Math.exp(-glowDynamics.accumEase * dt);
      const vmax = glowDynamics.max;

      for (let i = 0; i < currentBarCount; i++) {
        const dx = Math.abs(mouseWorldX - (barCenters as Float32Array)[i]);
        const hit = dx < mDist ? 1.0 - Math.pow(dx / mDist, fall) : 0.0;

        const targetAdd = hit * smoothSpeed;
        const add = targetAdd * addEase;

        let g = (arr as unknown as number[])[i] + add - (arr as unknown as number[])[i] * decayLerp;

        if (g > vmax) g = vmax;
        (arr as unknown as number[])[i] = (arr as unknown as number[])[i + currentBarCount] = g;
      }
      (attr as THREE.BufferAttribute & { needsUpdate: boolean }).needsUpdate = true;
    }

    function createInstancedBars() {
      if (instancedBars) {
        waveScene.remove(instancedBars);
        instancedBars.geometry.dispose();
        (instancedBars.material as THREE.Material).dispose();
        instancedBars = null;
      }

      const waveWidth = cameraWidth;
      const span = waveWidth + EXTEND_LEFT_PX;
      const barCount = Math.min(
        MAX_BARS,
        Math.max(1, Math.floor((span + FIXED_BAR_GAP) / (FIXED_BAR_WIDTH + FIXED_BAR_GAP)))
      );
      const gap = barCount > 1 ? (span - barCount * FIXED_BAR_WIDTH) / (barCount - 1) : 0;
      currentBarCount = barCount;

      barCenters = new Float32Array(barCount);

      const instCnt = barCount * 2;
      const aXPos = new Float32Array(instCnt);
      const aPosNorm = new Float32Array(instCnt);
      const aGroup = new Float32Array(instCnt);
      const aGlow = new Float32Array(instCnt).fill(0);

      const startX = -waveWidth / 2 - EXTEND_LEFT_PX;

      for (let i = 0; i < barCount; i++) {
        const x = startX + FIXED_BAR_WIDTH / 2 + i * (FIXED_BAR_WIDTH + gap);
        (barCenters as Float32Array)[i] = x;
        const t = barCount > 1 ? i / (barCount - 1) : 0;
        aXPos[i] = x;
        aXPos[i + barCount] = x;
        aPosNorm[i] = t;
        aPosNorm[i + barCount] = t;
        aGroup[i] = 0;
        aGroup[i + barCount] = 1;
      }

      const geo = new THREE.PlaneGeometry(FIXED_BAR_WIDTH, 1, 1, 1);
      geo.translate(0, 0.5, 0);
      geo.setAttribute("aXPos", new THREE.InstancedBufferAttribute(aXPos, 1));
      geo.setAttribute("aPosNorm", new THREE.InstancedBufferAttribute(aPosNorm, 1));
      geo.setAttribute("aGroup", new THREE.InstancedBufferAttribute(aGroup, 1));
      geo.setAttribute(
        "aGlow",
        new THREE.InstancedBufferAttribute(aGlow, 1).setUsage(THREE.DynamicDrawUsage)
      );

      barMaterial = createInstancedMaterial();
      instancedBars = new THREE.InstancedMesh(geo, barMaterial, instCnt);
      instancedBars.frustumCulled = false;
      waveScene.add(instancedBars);

      setupQuickSetters();
      updateGlowDistance();
    }

    function buildKeyframeTweens(target: { gain: number; frequency: number; waveLength: number }, keyframes: Array<{ time: number; gain: number; frequency: number; waveLength: number }>) {
      const tl = gsap.timeline();
      for (let i = 0; i < keyframes.length - 1; i++) {
        const cur = keyframes[i];
        const nxt = keyframes[i + 1];
        const duration = nxt.time - cur.time;
        tl.to(
          target,
          {
            gain: nxt.gain,
            frequency: nxt.frequency,
            waveLength: nxt.waveLength,
            duration,
            ease: "power2.inOut",
          },
          cur.time
        );
      }
      return tl;
    }

    function showScene1() {
      if (!waveCameraInitialized) {
        initWaveThree();
        onResize(waveContainer.clientWidth, waveContainer.clientHeight);
      }
      const canvas = waveContainer.querySelector("canvas");
      if (canvas) {
        gsap.to(canvas, { opacity: 1, duration: 1, ease: "power2.out" });
      }
    }

    function buildScene1Timeline() {
      const tl = gsap.timeline({
        repeat: -1,
        onStart: showScene1,
      });
      tl.add(buildKeyframeTweens(wave1, waveKeyframes1), 0);
      tl.add(buildKeyframeTweens(wave2, waveKeyframes2), 0);
      return tl;
    }

    function initWaveThree() {
      cameraWidth = waveContainer.clientWidth;
      cameraHeight = waveContainer.clientHeight;
      waveCamera = new THREE.OrthographicCamera(
        -cameraWidth / 2,
        cameraWidth / 2,
        cameraHeight / 2,
        -cameraHeight / 2,
        -1000,
        1000
      );
      waveCamera.position.z = 10;
      waveCamera.lookAt(0, 0, 0);

      waveRenderer.setSize(cameraWidth, cameraHeight);
      waveComposer = new EffectComposer(waveRenderer);
      (waveComposer as unknown as { setPixelRatio: (n: number) => void }).setPixelRatio(EFFECT_PR);

      waveRenderPass = new RenderPass(waveScene, waveCamera);
      waveComposer.addPass(waveRenderPass);

      waveBloomPass = new UnrealBloomPass(new THREE.Vector2(cameraWidth, cameraHeight), 1.0, 0.68, 0.0);
      (waveBloomPass as unknown as { resolution: THREE.Vector2 }).resolution.set(cameraWidth * 0.5, cameraHeight * 0.5);
      waveComposer.addPass(waveBloomPass);

      grainPass = createFilmGrainPass();
      waveComposer.addPass(grainPass);

      createInstancedBars();
      setupPointerTracking();
      updateGainMultiplier();
      waveCameraInitialized = true;
    }

    let pendingW = 0,
      pendingH = 0,
      heavyResizeTimer: ReturnType<typeof setTimeout> | null = null;

    function onResize(newW: number, newH: number) {
      if (!waveCameraInitialized) return;
      pendingW = newW;
      pendingH = newH;

      cameraWidth = newW;
      cameraHeight = newH;
      waveCamera.left = -cameraWidth / 2;
      waveCamera.right = cameraWidth / 2;
      waveCamera.top = cameraHeight / 2;
      waveCamera.bottom = -cameraHeight / 2;
      waveCamera.updateProjectionMatrix();

      const waveWidth = cameraWidth;
      const span = waveWidth + EXTEND_LEFT_PX;
      const barCount = Math.min(
        MAX_BARS,
        Math.max(1, Math.floor((span + FIXED_BAR_GAP) / (FIXED_BAR_WIDTH + FIXED_BAR_GAP)))
      );
      const gap = barCount > 1 ? (span - barCount * FIXED_BAR_WIDTH) / (barCount - 1) : 0;

      if (barCount !== currentBarCount) {
        currentBarCount = barCount;
        createInstancedBars();
      } else if (instancedBars) {
        const startX = -waveWidth / 2 - EXTEND_LEFT_PX;
        const aX = instancedBars.geometry.getAttribute("aXPos") as THREE.InstancedBufferAttribute;
        const aT = instancedBars.geometry.getAttribute("aPosNorm") as THREE.InstancedBufferAttribute;

        for (let i = 0; i < barCount; i++) {
          const x = startX + FIXED_BAR_WIDTH / 2 + i * (FIXED_BAR_WIDTH + gap);
          const t = barCount > 1 ? i / (barCount - 1) : 0;
          (aX.array as Float32Array)[i] = (aX.array as Float32Array)[i + barCount] = x;
          (aT.array as Float32Array)[i] = (aT.array as Float32Array)[i + barCount] = t;
        }
        aX.needsUpdate = true;
        aT.needsUpdate = true;
      }

      if (barMaterial) (barMaterial.uniforms as Record<string, { value: number }>).uHalfW.value = cameraWidth * 0.5;
      updateGainMultiplier();
      updateGlowDistance();

      clearTimeout(heavyResizeTimer!);
      heavyResizeTimer = setTimeout(applyHeavyResize, 10);
      rect = waveRenderer.domElement.getBoundingClientRect();
    }

    function applyHeavyResize() {
      heavyResizeTimer = null;
      waveRenderer.setPixelRatio(EFFECT_PR);
      waveRenderer.setSize(pendingW, pendingH);
      (waveComposer as unknown as { setSize: (w: number, h: number) => void }).setSize(pendingW, pendingH);
      (waveBloomPass as unknown as { setSize: (w: number, h: number) => void })?.setSize(pendingW, pendingH);
      (grainPass as unknown as { setSize?: (w: number, h: number) => void })?.setSize?.(pendingW, pendingH);
      (grainPass.uniforms as Record<string, { value: number }>).grainScale.value = 0.5;
    }

    function disposeWaveScene() {
      gsap.globalTimeline.clear();
      waveScene.traverse((obj: THREE.Object3D) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.isMesh) {
          mesh.geometry.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      (grainPass as unknown as { dispose?: () => void })?.dispose?.();
      (waveBloomPass as unknown as { dispose?: () => void })?.dispose?.();
      (waveComposer as unknown as { dispose?: () => void })?.dispose?.();
      (waveRenderer as unknown as { dispose?: () => void })?.dispose?.();
      instancedBars = null;
    }

    let smoothSpeed = 0;

    const ticker = () => {
      if (!waveCameraInitialized || !instancedBars) return;
      const dt = (gsap.ticker.deltaRatio() as number) * (1 / 60);

      wave1.currentAngle = (wave1.currentAngle + wave1.frequency * dt) % (Math.PI * 2);
      wave2.currentAngle = (wave2.currentAngle + wave2.frequency * dt) % (Math.PI * 2);
      setPhase1(wave1.currentAngle);
      setPhase2(wave2.currentAngle);

      const kMouse = 1.0 - Math.exp(-glowConfig.mouseSmoothing * dt);
      proxyMouseX += (mouse.x - proxyMouseX) * kMouse;
      proxyMouseY += (mouse.y - proxyMouseY) * kMouse;

      const dx = mouse.active ? mouse.x - proxyMouseX : 0;
      const dy = mouse.active ? mouse.y - proxyMouseY : 0;
      const rawSpeed = Math.hypot(dx, dy * 0.1) * glowConfig.speedScale;

      const kSpeed = 1.0 - Math.exp(-glowDynamics.speedEase * dt);
      smoothSpeed += (rawSpeed - smoothSpeed) * kSpeed;
      setSmoothSpeed(smoothSpeed);

      const u = (instancedBars.material as THREE.ShaderMaterial).uniforms as Record<string, { value: number }>;
      u.w1Gain.value = wave1.gain;
      u.w1Len.value = wave1.waveLength;
      u.w2Gain.value = wave2.gain;
      u.w2Len.value = wave2.waveLength;

      const mouseClipX = (proxyMouseX / cameraWidth) * 2 - 1;
      setMouseNDC(mouseClipX);
      let baseOffset = 40;
      if (typeof window !== "undefined" && window.innerWidth < 768) baseOffset = 20;
      u.uBaseY.value = -cameraHeight * 0.5 + baseOffset;

      (grainPass.uniforms as Record<string, { value: number }>).time.value += dt * 0.2;

      accumulateGlow(dt);
      waveComposer.render();
    };

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.target === waveContainer) {
          onResize(e.contentRect.width, e.contentRect.height);
        }
      }
    });

    const mainTimeline = buildScene1Timeline();
    mainTimeline.play(0);

    gsap.ticker.add(ticker);
    ro.observe(waveContainer);
    listeners.push(() => gsap.ticker.remove(ticker));
    listeners.push(() => ro.disconnect());

    const onVisibility = () => {
      document.hidden ? gsap.globalTimeline.pause() : gsap.globalTimeline.resume();
    };
    document.addEventListener("visibilitychange", onVisibility);
    listeners.push(() => document.removeEventListener("visibilitychange", onVisibility));

    return () => {
      listeners.forEach((fn) => fn());
      try {
        disposeWaveScene();
      } catch {
        /* ignore */
      }
      try {
        const canvas = waveRenderer.domElement;
        if (canvas?.parentElement === waveContainer) {
          waveContainer.removeChild(canvas);
        }
      } catch {
        /* ignore */
      }
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100vh", minHeight: "100vh", ...style }}
      aria-label="Animated hero"
    >
      <Navbar notebookOpen={notebookOpen} onToggleNotebook={onToggleNotebook} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          display: "flex",
          flexDirection: "column",
          alignItems: children ? "stretch" : "center",
          justifyContent: children ? "stretch" : "center",
          pointerEvents: "none",
          padding: children ? 0 : "24px 40px 24px 24px",
        }}
      >
        {children ? (
          <div className="flex flex-1 flex-col min-h-0 pointer-events-auto w-full">
            {children}
          </div>
        ) : (
          <div className="max-w-3xl w-full text-center pointer-events-auto">
            <h1 className="text-white text-3xl sm:text-5xl font-semibold tracking-tight drop-shadow-[0_1px_8px_rgba(31,61,188,0.25)]">
              {title}
            </h1>
            <p className="text-gray-300/90 mt-3 sm:mt-4 text-sm sm:text-base">
              {subtitle}
            </p>
            {onResearchModeChange && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <span className="text-[13px] text-gray-500 mr-2">Mode:</span>
                <button
                  type="button"
                  onClick={() => onResearchModeChange(false)}
                  className={`rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors ${
                    !researchMode ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Chat
                </button>
                <button
                  type="button"
                  onClick={() => onResearchModeChange(true)}
                  className={`rounded-lg px-3 py-1.5 text-[14px] font-medium transition-colors ${
                    researchMode ? "bg-white/10 text-white" : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Research
                </button>
              </div>
            )}
            <form
              className="mt-6 sm:mt-8 flex items-center justify-center"
              onSubmit={(e) => {
                e.preventDefault();
                onPromptSubmit?.(prompt);
              }}
            >
              <div className="relative w-full sm:w-[720px]">
                <div className="relative rounded-2xl p-[2px] shadow-[0_1px_2px_0_rgba(0,0,0,0.06)] bg-gradient-to-br from-white/10 via-white/5 to-black/20">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={animatedPlaceholder}
                    rows={5}
                    className="w-full h-32 sm:h-36 resize-none rounded-2xl bg-[rgba(15,15,20,0.55)] border border-white/10 text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-[#1f3dbc]/40 focus:border-[#1f3dbc]/40 backdrop-blur-md px-4 py-4 pr-16"
                  />
                </div>
                <button
                  type="submit"
                  aria-label={buttonText}
                  className="absolute right-3 bottom-3 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#f0f2ff] text-black hover:bg-white transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      <div
        ref={waveRef}
        id="waveCanvas"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          opacity: 0.8,
        }}
      />
    </section>
  );
}
