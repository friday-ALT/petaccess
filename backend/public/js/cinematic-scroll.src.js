/**
 * CinematicScroll — full-screen Three.js + GSAP ScrollTrigger parallax journey
 */
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BG_COLOR = 0x050a14;
const LERP = 0.05;

function makeGradientTexture(stops, w = 512, h = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach(({ offset, color }) => g.addColorStop(offset, color));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeRadialTexture(inner, outer) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(256, 256, 40, 256, 256, 256);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const LAYER_DEFS = [
  { id: "sky", z: -28, parallax: 0.12, w: 56, h: 32, stops: [{ offset: 0, color: "#050a14" }, { offset: 1, color: "#0a1628" }], opacity: 1 },
  { id: "deep", z: -18, parallax: 0.22, w: 50, h: 28, stops: [{ offset: 0, color: "#061018" }, { offset: 1, color: "#0d4a45" }], opacity: 0.85 },
  { id: "mid", z: -10, parallax: 0.38, w: 44, h: 26, stops: [{ offset: 0, color: "#0f766e" }, { offset: 1, color: "#134e4a" }], opacity: 0.55, fadeAct3: true },
  { id: "focal", z: -5, parallax: 0.55, w: 38, h: 22, radial: true, inner: "rgba(20,184,166,0.35)", outer: "rgba(5,10,20,0)", opacity: 0.7, scaleAct2: true },
  { id: "fog", z: -2, parallax: 0.72, w: 36, h: 20, stops: [{ offset: 0, color: "rgba(204,251,241,0.08)" }, { offset: 1, color: "rgba(5,10,20,0)" }], opacity: 0.45 },
  { id: "near", z: 0, parallax: 0.9, w: 32, h: 18, stops: [{ offset: 0, color: "rgba(15,118,110,0.15)" }, { offset: 1, color: "rgba(5,10,20,0)" }], opacity: 0.35 }
];

const MOBILE_LAYER_IDS = new Set(["sky", "mid", "focal"]);

export function initCinematicScroll(rootEl) {
  if (!rootEl || rootEl.dataset.cinematicInit === "1") return () => {};

  const wrapper = rootEl;
  const sticky = rootEl.querySelector(".cinematic-scroll-sticky");
  const canvas = rootEl.querySelector(".cinematic-canvas");
  const fadeOverlay = rootEl.querySelector(".cinematic-fade-overlay");
  const vignette = rootEl.querySelector(".cinematic-vignette");
  const actLabel = rootEl.querySelector(".cinematic-act-label");
  const ctaBlock = rootEl.querySelector(".cinematic-cta");

  if (!sticky || !canvas) return () => {};

  rootEl.dataset.cinematicInit = "1";

  const isMobile = () => window.innerWidth < 768;
  let mobile = isMobile();
  let disposed = false;
  let isActive = false;
  let rafId = 0;
  let scrollTriggerInstance = null;
  let masterTimeline = null;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_COLOR);
  scene.fog = new THREE.FogExp2(BG_COLOR, 0);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
  const cameraCurrent = { x: 0, y: 0.2, z: 30, rotX: 0 };
  const cameraTarget = { x: 0, y: 0.2, z: 30, rotX: 0 };

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: "high-performance"
  });
  renderer.setClearColor(BG_COLOR, 1);
  renderer.shadowMap.enabled = !mobile;
  if (!mobile) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const ambient = new THREE.AmbientLight(0xfff5eb, 0.4);
  scene.add(ambient);

  const directional = new THREE.DirectionalLight(0xfff0e0, 1.2);
  directional.position.set(-4, 6, 8);
  if (!mobile) {
    directional.castShadow = true;
    directional.shadow.mapSize.set(1024, 1024);
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 50;
    directional.shadow.camera.left = -20;
    directional.shadow.camera.right = 20;
    directional.shadow.camera.top = 20;
    directional.shadow.camera.bottom = -20;
  }
  scene.add(directional);

  const pointLight = new THREE.PointLight(0x5eead4, 1.4, 80, 1.5);
  pointLight.position.set(0, 2, 10);
  scene.add(pointLight);

  const layers = [];
  const layerState = [];

  const scrollState = {
    fogDensity: 0,
    sceneOpacity: 0,
    fadeOut: 0,
    lightX: -4,
    pointX: 0,
    pointZ: 10,
    parallaxSpread: 0,
    bgDrift: 0
  };

  function buildLayers() {
    layers.forEach((mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    });
    layers.length = 0;
    layerState.length = 0;

    const defs = mobile
      ? LAYER_DEFS.filter((d) => MOBILE_LAYER_IDS.has(d.id))
      : LAYER_DEFS;

    defs.forEach((def) => {
      const map = def.radial
        ? makeRadialTexture(def.inner, def.outer)
        : makeGradientTexture(def.stops);
      const mat = new THREE.MeshStandardMaterial({
        map,
        transparent: true,
        opacity: def.opacity,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const geo = new THREE.PlaneGeometry(def.w, def.h);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.z = def.z;
      mesh.userData = {
        id: def.id,
        parallax: def.parallax,
        baseZ: def.z,
        baseOpacity: def.opacity,
        fadeAct3: !!def.fadeAct3,
        scaleAct2: !!def.scaleAct2
      };
      if (!mobile) mesh.receiveShadow = true;
      scene.add(mesh);
      layers.push(mesh);
      layerState.push({ offsetX: 0, offsetY: 0, scale: 1, opacity: def.opacity });
    });
  }

  function buildTimeline() {
    if (masterTimeline) masterTimeline.kill();
    if (scrollTriggerInstance) scrollTriggerInstance.kill();

    gsap.set(cameraTarget, { x: 0, y: 0.2, z: 30, rotX: 0 });
    gsap.set(cameraCurrent, { x: 0, y: 0.2, z: 30, rotX: 0 });
    gsap.set(scrollState, {
      fogDensity: 0,
      sceneOpacity: 0,
      fadeOut: 0,
      lightX: -4,
      pointX: 0,
      pointZ: 10,
      parallaxSpread: 0,
      bgDrift: 0
    });
    if (fadeOverlay) gsap.set(fadeOverlay, { opacity: 0 });
    if (ctaBlock) gsap.set(ctaBlock, { opacity: 0, y: 24 });

    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

    const acts = [
      { title: "Act I — Arrival", sub: "Enter the depth of your pet's health world" },
      { title: "Act II — Approach", sub: "Layers of care draw closer" },
      { title: "Act III — Immersion", sub: "Fog, light, and motion converge" },
      { title: "Act IV — Horizon", sub: "One platform for every stage of life" }
    ];

    const setActLabel = (index) => {
      if (!actLabel) return;
      actLabel.querySelector(".cinematic-act-title").textContent = acts[index].title;
      actLabel.querySelector(".cinematic-act-sub").textContent = acts[index].sub;
    };

    // ACT 1 (0–25%)
    tl.to(scrollState, { sceneOpacity: 1, duration: 0.25, ease: "sine.inOut" }, 0);
    tl.to(cameraTarget, { z: 15, duration: 0.25, ease: "power2.inOut" }, 0);
    tl.to(scrollState, { parallaxSpread: 1, duration: 0.25, ease: "sine.inOut" }, 0);
    tl.call(() => setActLabel(0), [], 0.02);

    // ACT 2 (25–50%)
    tl.to(cameraTarget, { z: 5, rotX: -0.05, duration: 0.25, ease: "power2.inOut" }, 0.25);
    tl.to(scrollState, { lightX: 6, pointX: 4, pointZ: 6, duration: 0.25, ease: "sine.inOut" }, 0.25);
    tl.call(() => setActLabel(1), [], 0.26);
    layers.forEach((mesh, idx) => {
      if (mesh.userData.scaleAct2) {
        tl.to(layerState[idx], { scale: 1.3, duration: 0.25, ease: "power2.inOut" }, 0.25);
      }
    });

    // ACT 3 (50–75%)
    tl.to(cameraTarget, { z: 2, x: 2, duration: 0.25, ease: "power2.inOut" }, 0.5);
    tl.to(scrollState, { fogDensity: 0.04, bgDrift: -2.5, pointX: 8, pointZ: 2, duration: 0.25, ease: "sine.inOut" }, 0.5);
    tl.call(() => setActLabel(2), [], 0.51);
    layers.forEach((mesh, idx) => {
      if (mesh.userData.fadeAct3) {
        tl.to(layerState[idx], { opacity: 0, duration: 0.2, ease: "sine.inOut" }, 0.55);
      }
    });

    // ACT 4 (75–100%)
    tl.to(cameraTarget, { z: 8, x: 0, rotX: 0, duration: 0.25, ease: "power2.inOut" }, 0.75);
    tl.to(scrollState, { fadeOut: 1, fogDensity: 0.02, parallaxSpread: 0.2, bgDrift: 0, lightX: -2, duration: 0.25, ease: "sine.inOut" }, 0.75);
    tl.call(() => setActLabel(3), [], 0.76);
    layers.forEach((mesh, idx) => {
      tl.to(
        layerState[idx],
        { opacity: mesh.userData.baseOpacity, scale: 1, duration: 0.2, ease: "sine.inOut" },
        0.8
      );
    });
    if (ctaBlock) {
      tl.to(ctaBlock, { opacity: 1, y: 0, duration: 0.15, ease: "power2.out" }, 0.88);
    }

    scrollTriggerInstance = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5,
      pin: sticky,
      animation: tl,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter: () => { isActive = true; },
      onEnterBack: () => { isActive = true; },
      onLeave: () => { isActive = false; },
      onLeaveBack: () => { isActive = false; },
      onToggle: (self) => { isActive = self.isActive; }
    });

    masterTimeline = tl;
    isActive = scrollTriggerInstance.isActive;
    setActLabel(0);
  }

  function applyLayerTransforms() {
    layers.forEach((mesh, i) => {
      const st = layerState[i];
      const spread = scrollState.parallaxSpread;
      const drift = scrollState.bgDrift;
      const px = st.offsetX + drift * mesh.userData.parallax * (mesh.userData.baseZ < -8 ? -1 : 0.3);
      mesh.position.x = px;
      mesh.position.y = st.offsetY;
      mesh.position.z = mesh.userData.baseZ + spread * mesh.userData.parallax * 4;
      mesh.scale.set(st.scale, st.scale, 1);
      mesh.material.opacity = st.opacity;
    });
  }

  function syncScene() {
    directional.position.set(scrollState.lightX, 6, 8);
    pointLight.position.set(scrollState.pointX, 2, scrollState.pointZ);
    scene.fog.density = scrollState.fogDensity;
    if (fadeOverlay) fadeOverlay.style.opacity = String(scrollState.fadeOut);
    if (vignette) vignette.style.opacity = String(0.3 + scrollState.parallaxSpread * 0.3);
    renderer.domElement.style.opacity = String(scrollState.sceneOpacity);
  }

  function renderFrame() {
    if (disposed) return;
    cameraCurrent.x += (cameraTarget.x - cameraCurrent.x) * LERP;
    cameraCurrent.y += (cameraTarget.y - cameraCurrent.y) * LERP;
    cameraCurrent.z += (cameraTarget.z - cameraCurrent.z) * LERP;
    cameraCurrent.rotX += (cameraTarget.rotX - cameraCurrent.rotX) * LERP;
    camera.position.set(cameraCurrent.x, cameraCurrent.y, cameraCurrent.z);
    camera.rotation.order = "YXZ";
    camera.rotation.x = cameraCurrent.rotX;
    camera.rotation.y = 0;
    camera.rotation.z = 0;
    applyLayerTransforms();
    syncScene();
    if (isActive) renderer.render(scene, camera);
    rafId = requestAnimationFrame(renderFrame);
  }

  function resize() {
    const w = sticky.clientWidth;
    const h = sticky.clientHeight;
    if (w === 0 || h === 0) return;
    const nowMobile = isMobile();
    if (nowMobile !== mobile) {
      mobile = nowMobile;
      renderer.shadowMap.enabled = !mobile;
      camera.fov = mobile ? 75 : 60;
      buildLayers();
      buildTimeline();
    }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
  }

  buildLayers();
  buildTimeline();
  resize();
  window.addEventListener("resize", resize);
  renderFrame();

  return function destroy() {
    disposed = true;
    cancelAnimationFrame(rafId);
    scrollTriggerInstance?.kill();
    masterTimeline?.kill();
    window.removeEventListener("resize", resize);
    layers.forEach((mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.map?.dispose();
      mesh.material.dispose();
    });
    renderer.dispose();
    delete rootEl.dataset.cinematicInit;
  };
}

export function mountCinematicScroll() {
  const el = document.getElementById("cinematic-scroll");
  if (!el) return null;
  const destroy = initCinematicScroll(el);
  window.petAccessCinematic = {
    refresh: () => ScrollTrigger.refresh()
  };
  return destroy;
}

if (typeof document !== "undefined") {
  const boot = () => mountCinematicScroll();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
