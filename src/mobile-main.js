// ============================================================================
//  STEALTH RESILIENCE - MOBILE EDITION
//  Mobile only. No keyboard, no mouse, no pointer lock. Pure touch.
//  Ultra low renderer + trimmed world so it holds 60 FPS on a Galaxy F15 5G.
//  Kept: 132 guns, 35 vehicles, 70 quests, Zen economy, 7 cutscenes, apartment.
// ============================================================================
import * as THREE from 'three';
import { GUNS } from './data/guns.js';
import { VEHICLES } from './data/vehicles.js';
import { MAIN_QUESTS, SIDE_QUESTS } from './data/quests.js';
import { CutsceneManager, CUTSCENES } from './engine/cutscene.js';
import { MobileControls } from './engine/mobile.js';
import { FlareManager, FLARE_TYPES } from './engine/flares.js';
import { MOBILE_PROFILE, Optimization } from './engine/optimization.js';

// --- WORLD CONSTANTS -------------------------------------------------------
const APARTMENT = new THREE.Vector3(-25, 0, -25);   // Jackson's base + 06:00 alarm
const THRONE = new THREE.Vector3(0, 0, 1000);       // Michael's throne room
const SHIFT_START = 6, SHIFT_END = 22;
const SPREAD = 2000;                                // road grid spacing

// --- STATE -----------------------------------------------------------------
let scene, camera, renderer, clock;
let player, gunMesh;
let camYaw = 0.5, camPitch = 0.12;
const velocity = new THREE.Vector3();
let isGrounded = true, isCrouching = false, isSprinting = false, isStealth = true;
let health = 100, armor = 60, zen = 2500;
let currentGunId = 36;
let ammo = {}, ownedGuns = new Set([1, 36, 56, 21, 71, 111, 113, 126]);
let enemies = [], buildings = [], vehicles = [], mines = [];
let activeQuests = [], completedQuests = new Set();
let inVehicle = null, vehicleVelocity = 0;
let drawDistance = MOBILE_PROFILE.drawDistance;
let gameStarted = false, booted = false, wantedLevel = 0;
let isAiming = false, cutscenesEnabled = true, autoFireNext = 0, recoilShake = 0;
let flareInventory = { signal_red: 5, signal_green: 3, signal_white: 3, illumination: 2, smoke_red: 4, smoke_green: 2, smoke_white: 3, distress: 1, ir_strobe: 1 };
let gameTime = { h: SHIFT_START, m: 0 }, workShiftActive = false, shiftTick = 0;

let cutsceneManager, controls, flareManager;
let audioCtx = null, audioUnlocked = false;

let particlePool = [], projectiles = [];
let projectPool = [], tracerPool = [], buildingMeshes = [];

// scratch objects - the render loop must not allocate (GC on a phone = frame drops)
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3();
const _ray = new THREE.Raycaster();

// UI refs (all present in mobile.html)
const $ = id => document.getElementById(id);
const hud = $('hud'), loading = $('loading'), loadFill = $('loadFill'), loadText = $('loadText');

// ============================================================================
//  BOOT
// ============================================================================
async function init() {
  updateLoad(8, 'LOADING THREE.JS (CDN)...');
  clock = new THREE.Clock();

  // --- Scene -------------------------------------------------------------
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0e13, MOBILE_PROFILE.fogDensity);
  scene.background = new THREE.Color(0x0a0e13);

  // --- Camera ------------------------------------------------------------
  camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.1, 1600);

  // --- Renderer: ultra low profile (pixel ratio 0.8, no AA, no shadows, no stencil)
  renderer = new THREE.WebGLRenderer({
    antialias: MOBILE_PROFILE.antialias,
    stencil: MOBILE_PROFILE.stencil,
    alpha: false,
    powerPreference: 'high-performance',
    depth: true
  });
  renderer.setPixelRatio(MOBILE_PROFILE.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = MOBILE_PROFILE.shadows;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  document.body.appendChild(renderer.domElement);

  updateLoad(20, 'BUILDING CARTEL CITY...');
  buildLights();
  buildWorld();

  buildingMeshes = buildings.map(b => b.mesh);

  updateLoad(45, 'DEPLOYING JACKSON + 35 VEHICLES...');
  createPlayer();
  buildPools();
  generateEnemies();
  generateVehicles();
  GUNS.forEach(g => { ammo[g.id] = { cur: g.mag, reserve: g.mag * 4 }; });

  updateLoad(70, 'LOADING 70 MISSIONS + 7 CUTSCENES + 10 FLARES...');
  controls = new MobileControls();
  flareManager = new FlareManager(scene);
  cutsceneManager = new CutsceneManager(camera, scene, renderer);
  tuneCutsceneUI();

  setupQuests();
  wireControls();
  setupUI();

  updateLoad(92, 'OPTIMISING FOR GALAXY F15 5G...');
  syncWeaponWheel();
  updateHealthUI(); updateZenUI(); updateAmmoUI(); updateWanted(); updateFlareUI();
  startMinimap();

  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 250));
  lockPageGestures();

  updateLoad(100, 'READY - JACKSON DEPLOYED');
  enableTapToPlay();
  animate();
}

function updateLoad(pct, text) {
  if (loadFill) loadFill.style.width = pct + '%';
  if (loadText) loadText.textContent = text;
}

/* Kill every browser gesture that would fight the game on a phone. */
function lockPageGestures() {
  const stop = e => e.preventDefault();
  document.addEventListener('gesturestart', stop, { passive: false });   // iOS pinch
  document.addEventListener('gesturechange', stop, { passive: false });
  document.addEventListener('gestureend', stop, { passive: false });
  document.addEventListener('dblclick', stop, { passive: false });       // double tap zoom
  document.addEventListener('touchmove', e => {                         // pinch zoom
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  document.addEventListener('contextmenu', stop, { passive: false });    // long press menu
  document.addEventListener('selectstart', stop, { passive: false });
}

function onResize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

/* Mobile autoplay policy: nothing may play audio until a real user gesture. */
function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !audioCtx) audioCtx = new AC();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { /* no audio device */ }
  audioUnlocked = true;
  const note = $('audioNote');
  if (note) { note.textContent = 'AUDIO UNLOCKED'; note.style.color = 'var(--gold)'; }
}
function playAudio(el, vol) {
  if (!el || !audioUnlocked) return;
  try { el.volume = vol == null ? 0.8 : vol; const p = el.play(); if (p && p.catch) p.catch(() => { }); } catch (e) { /* ignore */ }
}

function enableTapToPlay() {
  const btn = $('tapPlay');
  if (!btn) return;
  btn.disabled = false;
  btn.classList.remove('locked');
  btn.textContent = '▶ TAP TO PLAY';
  const go = e => {
    if (e) e.preventDefault();
    if (booted) return;
    booted = true;
    unlockAudio();
    if (navigator.vibrate) { try { navigator.vibrate(25); } catch (err) { } }
    loading.style.opacity = '0';
    setTimeout(() => { loading.style.display = 'none'; }, 520);
    $('mainMenu').style.display = 'flex';
  };
  btn.addEventListener('touchstart', go, { passive: false });
  btn.addEventListener('click', go);
  // any other first tap also unlocks audio, so the game is still silent-safe
  const anyTap = () => { if (!audioUnlocked) unlockAudio(); };
  document.addEventListener('touchstart', anyTap, { once: true, passive: true });
  document.addEventListener('click', anyTap, { once: true });
}

// ============================================================================
//  WORLD
// ============================================================================
function buildLights() {
  scene.add(new THREE.AmbientLight(0x404060, 0.75));
  const sun = new THREE.DirectionalLight(0xffeedd, 1.1);
  sun.position.set(300, 500, 200);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x88ccff, 0x222233, 0.45));
}

function mergeGeos(geos) {
  const parts = geos.map(g => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  parts.forEach(g => { total += g.attributes.position.count; });
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  parts.forEach(g => {
    pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

function buildWorld() {
  // ---- ground (12 x 12 segments) --------------------------------------
  const gGeo = new THREE.PlaneGeometry(3000, 3000, MOBILE_PROFILE.groundSegments, MOBILE_PROFILE.groundSegments);
  const colors = [];
  const pos = gGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const v = 0.07 + Math.random() * 0.05;
    colors.push(v * 0.55, v * 0.8, v * 0.5);
  }
  gGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const ground = new THREE.Mesh(gGeo, new THREE.MeshLambertMaterial({ vertexColors: true }));
  ground.rotation.x = -Math.PI / 2;
  ground.name = 'ground';
  scene.add(ground);

  // ---- road grid (single merged geometry = 1 draw call) ----------------
  const rp = [], ruv = [];
  const quad = (cx, cz, w, d) => {
    const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
    rp.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z0, x1, 0, z1, x0, 0, z1);
    ruv.push(0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1);
  };
  for (let i = -4; i <= 4; i++) { quad(i * SPREAD, 0, 18, 2000); quad(0, i * SPREAD, 2000, 18); }
  const roadGeo = new THREE.BufferGeometry();
  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
  roadGeo.computeVertexNormals();
  const roads = new THREE.Mesh(roadGeo, new THREE.MeshLambertMaterial({ color: 0x15151a }));
  roads.position.y = 0.05;
  scene.add(roads);

  // ---- water + runway strip -------------------------------------------
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1000, 1000), new THREE.MeshLambertMaterial({ color: 0x0a4a6a }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(900, -2, -500);
  scene.add(water);

  const strip = new THREE.Mesh(new THREE.PlaneGeometry(800, 80), new THREE.MeshLambertMaterial({ color: 0x1a1a1a }));
  strip.rotation.x = -Math.PI / 2;
  strip.position.set(900, 0.2, 300);
  scene.add(strip);

  // ---- buildings (40) --------------------------------------------------
  const bMats = [
    new THREE.MeshLambertMaterial({ color: 0x2a2a3a }),
    new THREE.MeshLambertMaterial({ color: 0x3a3a4a }),
    new THREE.MeshLambertMaterial({ color: 0x4a4a5a }),
    new THREE.MeshLambertMaterial({ color: 0x2a3a4a })
  ];
  for (let i = 0; i < MOBILE_PROFILE.buildings; i++) {
    const w = 20 + Math.random() * 40, d = 20 + Math.random() * 40, h = 30 + Math.random() * 110;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bMats[i % bMats.length]);
    let x, z, tries = 0;
    do {
      x = (Math.random() - 0.5) * 1800; z = (Math.random() - 0.5) * 1800; tries++;
    } while ((Math.abs(x % SPREAD) < 30 || Math.abs(z % SPREAD) < 30 || Math.hypot(x, z) < 110) && tries < 40);
    mesh.position.set(x, h / 2, z);
    scene.add(mesh);
    buildings.push({ mesh, x, z, w, d, h });
  }

  // ---- trees (50, trunk + canopy merged into one mesh each) ------------
  const treeGeo = mergeGeos([
    (() => { const g = new THREE.CylinderGeometry(1, 1.5, 8, 5); g.translate(0, 4, 0); return g; })(),
    (() => { const g = new THREE.ConeGeometry(5, 20, 6); g.translate(0, 14, 0); return g; })()
  ]);
  const treeMat = new THREE.MeshLambertMaterial({ color: 0x1a4a1a, vertexColors: false });
  for (let i = 0; i < MOBILE_PROFILE.trees; i++) {
    const x = (Math.random() - 0.5) * 1800, z = (Math.random() - 0.5) * 1800;
    if (Math.abs(x % SPREAD) < 25 || Math.abs(z % SPREAD) < 25) continue;
    const t = new THREE.Mesh(treeGeo, treeMat);
    t.position.set(x, 0, z);
    t.scale.setScalar(0.8 + Math.random() * 0.6);
    scene.add(t);
  }

  // ---- sky dome follows the camera ------------------------------------
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1200, 12, 10), new THREE.MeshBasicMaterial({ color: 0x0a1420, side: THREE.BackSide, fog: false }));
  sky.name = 'sky';
  scene.add(sky);

  buildThroneRoom();
  buildApartment();
}

function buildThroneRoom() {
  const room = new THREE.Mesh(new THREE.BoxGeometry(20, 15, 20), new THREE.MeshLambertMaterial({ color: 0x2a1a0a }));
  room.position.set(THRONE.x, 7.5, THRONE.z);
  scene.add(room);
  const throne = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 3), new THREE.MeshBasicMaterial({ color: 0xffcc00 }));
  throne.position.set(THRONE.x, 2, THRONE.z);
  scene.add(throne);
}

function buildApartment() {
  const apt = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.BoxGeometry(12, 0.2, 10), new THREE.MeshLambertMaterial({ color: 0x3a2a1a }));
  floor.position.set(0, 0.1, 0);
  const wallMat = new THREE.MeshLambertMaterial({ color: 0x2a2a3a });
  const w1 = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.3), wallMat); w1.position.set(0, 2.5, -5);
  const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5, 10), wallMat); w2.position.set(-6, 2.5, 0);
  const w3 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 5, 10), wallMat); w3.position.set(6, 2.5, 0);
  const w4 = new THREE.Mesh(new THREE.BoxGeometry(12, 5, 0.3), wallMat); w4.position.set(0, 2.5, 5);
  const bed = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 6), new THREE.MeshLambertMaterial({ color: 0x1a1a4a })); bed.position.set(-3, 0.5, -2);
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 1), new THREE.MeshLambertMaterial({ color: 0xffffff })); pillow.position.set(-3, 0.9, -4.2);
  const alarm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: 0xff2040 }));
  alarm.name = 'alarmClock'; alarm.position.set(-1.5, 1, -4.2);
  const desk = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2), new THREE.MeshLambertMaterial({ color: 0x4a3a2a })); desk.position.set(3, 0.6, -3);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(4, 3), new THREE.MeshBasicMaterial({ color: 0x111111 })); board.position.set(0, 3, -4.9);
  const light = new THREE.PointLight(0xffeeaa, 1, 20); light.position.set(0, 4, 0);
  apt.add(floor, w1, w2, w3, w4, bed, pillow, alarm, desk, board, light);
  apt.position.copy(APARTMENT);
  scene.add(apt);
  window.jacksonApartment = apt;
}

// ============================================================================
//  PLAYER
// ============================================================================
function createPlayer() {
  player = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.6, 3, 6), new THREE.MeshLambertMaterial({ color: 0x1a2a3a }));
  body.position.y = 1.3;
  player.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 6, 6), new THREE.MeshLambertMaterial({ color: 0xd2b48c }));
  head.position.y = 2.4;
  player.add(head);
  gunMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), new THREE.MeshBasicMaterial({ color: 0x111111 }));
  gunMesh.position.set(0.4, 1.2, 0.5);
  player.add(gunMesh);
  player.position.copy(APARTMENT).setZ(APARTMENT.z - 2);
  scene.add(player);
}

function buildPools() {
  const pGeo = new THREE.SphereGeometry(0.3, 4, 4);
  for (let i = 0; i < MOBILE_PROFILE.particleLimit; i++) {
    const m = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9, depthWrite: false }));
    m.visible = false;
    scene.add(m);
    particlePool.push({ mesh: m, life: 0, decay: 0.05, vel: new THREE.Vector3() });
  }
  for (let i = 0; i < MOBILE_PROFILE.projectileLimit; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.25, 5, 5), new THREE.MeshBasicMaterial({ color: 0xff4400 }));
    m.visible = false;
    scene.add(m);
    projectPool.push(m);
  }
  for (let i = 0; i < MOBILE_PROFILE.tracerLimit; i++) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.8 }));
    l.visible = false; l.frustumCulled = false;
    scene.add(l);
    tracerPool.push({ line: l, life: 0 });
  }
}

function spawnParticle(pos, color = 0xffffff, size = 0.3, opacity = 0.9) {
  let p = null;
  for (let i = 0; i < particlePool.length; i++) if (particlePool[i].life <= 0) { p = particlePool[i]; break; }
  if (!p) p = particlePool[0];
  p.mesh.visible = true;
  p.mesh.position.copy(pos);
  p.mesh.scale.setScalar(size / 0.3);
  p.mesh.material.color.setHex(color);
  p.mesh.material.opacity = opacity;
  p.life = 1;
  p.decay = 0.03 + Math.random() * 0.04;
  p.vel.set((Math.random() - 0.5) * 4, Math.random() * 5 + 1, (Math.random() - 0.5) * 4);
}

function spawnTracer(from, to) {
  let t = null;
  for (let i = 0; i < tracerPool.length; i++) if (tracerPool[i].life <= 0) { t = tracerPool[i]; break; }
  if (!t) return;
  const a = t.line.geometry.attributes.position.array;
  a[0] = from.x; a[1] = from.y; a[2] = from.z;
  a[3] = to.x; a[4] = to.y; a[5] = to.z;
  t.line.geometry.attributes.position.needsUpdate = true;
  t.line.visible = true;
  t.life = 0.06;
}

// ============================================================================
//  ENEMIES + VEHICLES
// ============================================================================
function generateEnemies() {
  const geo = new THREE.CapsuleGeometry(0.45, 1.5, 3, 6);
  const barCanvas = document.createElement('canvas');
  barCanvas.width = 48; barCanvas.height = 6;
  for (let i = 0; i < MOBILE_PROFILE.enemies; i++) {
    const isBoss = i === 0;
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: isBoss ? 0xffcc00 : 0x4a2a2a }));
    const group = new THREE.Group();
    group.add(mesh);
    const bar = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeHealthTexture(1, '#f00') }));
    bar.position.y = 3; bar.scale.set(2, 0.25, 1);
    // health bars are UI: never let the shooting raycast hit them
    // (THREE.Sprite.raycast dereferences raycaster.camera and throws)
    bar.raycast = () => { };
    group.add(bar);
    let x = 0, z = 0;
    if (isBoss) { x = 0; z = 940; } else {
      let tries = 0;
      do { x = (Math.random() - 0.5) * 1500; z = (Math.random() - 0.5) * 1500; tries++; }
      while (Math.hypot(x, z) < 160 && tries < 40);
    }
    group.position.set(x, 1.2, z);
    if (isBoss) group.scale.setScalar(1.2);
    scene.add(group);
    enemies.push({
      group, mesh, bar, health: 100, maxHealth: 100, state: 'patrol', isBoss,
      target: new THREE.Vector3((Math.random() - 0.5) * 1500, 0, (Math.random() - 0.5) * 1500),
      lastShot: 0
    });
  }
}

function makeHealthTexture(pct, color) {
  const c = document.createElement('canvas');
  c.width = 48; c.height = 6;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 48, 6);
  ctx.fillStyle = color; ctx.fillRect(0, 0, 48 * pct, 6);
  const t = new THREE.CanvasTexture(c);
  return t;
}

function generateVehicles() {
  VEHICLES.forEach(v => {
    let geo, mat = new THREE.MeshLambertMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5) });
    if (v.type === 'Bike') { geo = new THREE.BoxGeometry(1.2, 1.5, 3.5); mat = new THREE.MeshLambertMaterial({ color: 0x222222 }); }
    else if (v.type === 'Ship') { geo = new THREE.BoxGeometry(6, 2, 14); mat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa }); }
    else if (v.type === 'Tank' || v.type === 'Heavy' || v.type === 'Plane' || v.type === 'Jet') { geo = new THREE.BoxGeometry(6, 2.4, 11); }
    else geo = new THREE.BoxGeometry(4, 2, 7);

    const group = new THREE.Group();
    group.add(new THREE.Mesh(geo, mat));
    if (v.type === 'Tank') {
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 7), new THREE.MeshLambertMaterial({ color: 0x111111 }));
      barrel.position.set(0, 0.6, 4);
      group.add(barrel);
    }
    let x, z;
    if (v.type === 'Ship') { x = 900 + (Math.random() - 0.5) * 500; z = -500 + (Math.random() - 0.5) * 500; }
    else if (v.type === 'Plane' || v.type === 'Jet') { x = 900 + (Math.random() - 0.5) * 300; z = 300 + (Math.random() - 0.5) * 200; }
    else { x = (Math.random() - 0.5) * 1200; z = (Math.random() - 0.5) * 1200; }
    group.position.set(x, v.type === 'Bike' ? 0.8 : 1, z);
    scene.add(group);
    vehicles.push({ group, data: v, occupied: false });
  });
}

// ============================================================================
//  QUESTS
// ============================================================================
function setupQuests() {
  activeQuests = [MAIN_QUESTS[0]];
  updateQuestHUD();
}

function updateQuestHUD() {
  const el = $('questHud');
  if (!el) return;
  el.innerHTML = activeQuests.slice(0, 2).map(q => `
    <div class="quest-card">
      <h4>${q.type.toUpperCase()} - ${q.title}</h4>
      <p>${q.desc}</p>
      ${q.objectives.map((o, i) => `<div class="obj ${i === 0 ? '' : 'done'}">${o}</div>`).join('')}
      <div style="margin-top:4px;color:var(--zen);font-family:var(--font-h);font-size:9px">REWARD: ${q.reward} ZEN</div>
    </div>`).join('');
}

const CUTSCENE_FOR_QUEST = { 1: 'contract', 6: 'sniper', 14: 'yacht', 27: 'finalIntel', 30: 'endgame' };

function completeQuest(q) {
  if (completedQuests.has(q.id)) return;
  completedQuests.add(q.id);
  activeQuests = activeQuests.filter(a => a.id !== q.id);
  zen += q.reward;
  updateZenUI(); updateQuestHUD();
  notify(`QUEST COMPLETE: ${q.title} +${q.reward} ZEN`);
  if (q.type === 'Main') {
    const next = MAIN_QUESTS.find(m => m.id === q.id + 1);
    if (next) { activeQuests.push(next); notify(`NEW MISSION: ${next.title}`); }
  }
}

// ============================================================================
//  CUTSCENES
// ============================================================================
function tuneCutsceneUI() {
  const cm = cutsceneManager;
  cm.letterboxTop.className = 'lbTop';
  cm.letterboxBottom.className = 'lbBot';
  cm.skipBtn.className = 'csSkip';
  cm.skipBtn.textContent = 'SKIP ▶▶';
  const hint = cm.dialogueBox.querySelector('.csSkipHint');
  if (hint) hint.textContent = 'TAP SKIP TO CONTINUE';
}

function playCutscene(key) {
  if (!cutscenesEnabled || !cutsceneManager || cutsceneManager.isPlaying()) return;
  const savedPos = player.position.clone(), savedYaw = camYaw, savedPitch = camPitch;
  controls.setActive(false);
  $('csProgress').style.display = 'block';
  cutsceneManager.play(key, () => {
    $('csProgress').style.display = 'none';
    $('csProgress').style.width = '0%';
    player.position.copy(savedPos);
    camYaw = savedYaw; camPitch = savedPitch;
    if (key === 'endgame') {
      const michael = enemies.find(e => e.isBoss);
      if (michael && michael.health > 0) { michael.health = 0; killEnemy(michael); }
    }
    controls.setActive(true);
  });
}

// ============================================================================
//  CONTROL WIRING
// ============================================================================
function wireControls() {
  controls.on('jump', () => { if (isGrounded && !inVehicle) { velocity.y = 7.5; isGrounded = false; } });
  controls.on('crouch', () => { isCrouching = !isCrouching; controls.vibrate(20); });
  controls.on('reload', reload);
  controls.on('grenade', throwGrenade);
  controls.on('mine', placeMine);
  controls.on('flare', () => launchFlare(controls.flareType));
  controls.on('work', () => showAlarm());
  controls.on('use', contextAction);
  controls.on('map', () => toggleModal('questModal'));
  controls.on('guns', () => toggleModal('armouryModal'));
  controls.on('flares', () => toggleModal('flareModal'));
  controls.on('settings', () => toggleModal('settingsModal'));
  controls.on('cutscene', () => playCutscene('intro'));
  controls.on('gyro', on => { const c = $('toggleGyro'); if (c) c.checked = on; });
  controls.on('weapon', idx => { if (idx < 0) cycleWeapon(); else selectWeaponIndex(idx); });
  controls.on('notify', notify);
  controls.on('aimStart', () => { isAiming = true; $('crosshair').classList.add('aiming'); });
  controls.on('aimEnd', () => { isAiming = false; $('crosshair').classList.remove('aiming'); });
}

function contextAction() {
  if (cutsceneManager && cutsceneManager.isPlaying()) return;
  if (inVehicle) { exitVehicle(); return; }
  if (player.position.distanceTo(APARTMENT) < 9) { toggleSleepPrompt(); return; }
  const v = nearestVehicle();
  if (v) enterVehicle(v);
  else notify('NOTHING IN REACH');
}

let lastContext = '';
function updateContextButton() {
  let ctx;
  if (inVehicle) ctx = 'exit';
  else if (player.position.distanceTo(APARTMENT) < 9) ctx = 'sleep';
  else if (nearestVehicle()) ctx = 'enter';
  else ctx = 'use';
  // only touch the DOM when the label really changes (it runs on a timer and
  // rewriting innerHTML under a live finger would drop the touch)
  if (ctx === lastContext) return;
  lastContext = ctx;
  if (ctx === 'exit') controls.setContext('🚪', 'EXIT');
  else if (ctx === 'sleep') controls.setContext('🏠', 'SLEEP');
  else if (ctx === 'enter') controls.setContext('🚗', 'ENTER');
  else controls.setContext('📍', 'USE');
}

function nearestVehicle() {
  let best = null, min = 9;
  for (const v of vehicles) {
    if (v.occupied) continue;
    const d = v.group.position.distanceTo(player.position);
    if (d < min) { min = d; best = v; }
  }
  return best;
}

function enterVehicle(v) {
  v.occupied = true; inVehicle = v;
  player.visible = false;
  notify(`ENTERED ${v.data.name} - LEFT STICK DRIVE, USE TO EXIT`);
  controls.vibrate(40);
  updateContextButton();
}
function exitVehicle() {
  if (!inVehicle) return;
  inVehicle.occupied = false;
  player.visible = true;
  player.position.copy(inVehicle.group.position).add(new THREE.Vector3(5, 0, 0));
  inVehicle = null;
  notify('EXITED VEHICLE');
  controls.vibrate(20);
  updateContextButton();
}

function ownedWeaponList() {
  return GUNS.filter(g => ownedGuns.has(g.id)).sort((a, b) => a.id - b.id).slice(0, 8);
}
function syncWeaponWheel() {
  const list = ownedWeaponList();
  controls.setWeapons(list);
  controls.selWeaponIndex = Math.max(0, list.findIndex(g => g.id === currentGunId));
}
function selectWeaponIndex(i) {
  const list = ownedWeaponList();
  const g = list[i];
  if (g) equipGun(g.id);
}
function cycleWeapon() {
  const list = ownedWeaponList();
  if (!list.length) return;
  const i = list.findIndex(g => g.id === currentGunId);
  equipGun(list[(i + 1) % list.length].id);
}
function equipGun(id) {
  currentGunId = id;
  updateAmmoUI();
  const g = GUNS.find(x => x.id === id);
  notify(`EQUIPPED: ${g ? g.name : id}`);
  controls.vibrate(25);
  syncWeaponWheel();
}

// ============================================================================
//  WEAPONS
// ============================================================================
function currentGun() { return GUNS.find(g => g.id === currentGunId); }

function reload() {
  const gun = currentGun();
  if (!gun) return;
  const a = ammo[gun.id];
  if (!a || a.cur === gun.mag || a.reserve <= 0) return;
  const take = Math.min(gun.mag - a.cur, a.reserve);
  a.reserve -= take; a.cur += take;
  updateAmmoUI();
  if (gunMesh) { gunMesh.rotation.x = 0.5; setTimeout(() => { if (gunMesh) gunMesh.rotation.x = 0; }, 200); }
  controls.vibrate(20);
}

function shoot() {
  if (!gameStarted || (cutsceneManager && cutsceneManager.isPlaying())) return;
  const gun = currentGun();
  if (!gun) return;
  const a = ammo[gun.id];
  if (!a || a.cur <= 0) { reload(); return; }
  a.cur--;
  updateAmmoUI();

  let dir = new THREE.Vector3();
  camera.getWorldDirection(dir);

  // auto-aim assist inside 80m
  const target = controls.getAutoAimTarget(camera, enemies, THREE, 80);
  if (target) {
    const to = new THREE.Vector3().subVectors(target.group.position, camera.position).normalize();
    dir.lerp(to, 0.55).normalize();
    $('crosshair').classList.add('lock');
    setTimeout(() => $('crosshair').classList.remove('lock'), 180);
  }

  const origin = camera.position.clone();
  const heavy = gun.cat === 'Launcher' || gun.cat === 'Heavy' || gun.id >= 96;

  if (heavy) {
    fireProjectile(player.position.clone().add(new THREE.Vector3(0, 1.2, 0)), dir, gun.dmg, true);
  } else {
    const ray = new THREE.Raycaster(origin, dir, 0, gun.range);
    ray.camera = camera;
    const hits = ray.intersectObjects(enemies.filter(e => e.health > 0).map(e => e.group), true);
    let end = origin.clone().add(dir.clone().multiplyScalar(30));
    if (hits.length) {
      const hit = hits[0];
      const e = enemies.find(x => x.group === hit.object || (x.group.children && x.group.children.indexOf(hit.object) >= 0));
      if (e) {
        e.health -= gun.dmg * (isStealth ? 1.5 : 1) * (isAiming ? 1.2 : 1);
        updateEnemyHealth(e);
        spawnParticle(hit.point, 0xffaa00, 0.15);
        end = hit.point.clone();
        controls.vibrate(15);
        if (e.health <= 0) killEnemy(e);
      }
    }
    spawnTracer(origin, end);
    spawnParticle(origin.clone().add(dir.clone().multiplyScalar(1)).add(new THREE.Vector3(0, 1.2, 0)), 0xffffaa, 0.12, 0.5);
  }

  camPitch += (Math.random() - 0.5) * 0.02 * (gun.dmg / 50) * (isAiming ? 0.5 : 1);
  recoilShake = 0.12;
  controls.vibrate(22);
  if (!isStealth) { wantedLevel = Math.min(5, wantedLevel + 0.2); updateWanted(); }
}

function fireProjectile(pos, dir, dmg, explosive) {
  let mesh = projectPool.pop();
  if (!mesh) return;
  mesh.visible = true;
  mesh.position.copy(pos);
  mesh.scale.setScalar(explosive ? 1.3 : 0.5);
  mesh.material.color.setHex(explosive ? 0xff4400 : 0xffff00);
  projectiles.push({ mesh, dir: dir.clone(), speed: explosive ? 36 : 80, dmg, explosive, life: 5, vel: null });
}

function throwGrenade() {
  if (cutsceneManager && cutsceneManager.isPlaying()) return;
  const id = 111, a = ammo[id];
  if (!a || a.cur <= 0) { notify('NO GRENADES'); return; }
  a.cur--;
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const pos = player.position.clone().add(new THREE.Vector3(0, 1.5, 0)).add(dir.clone().multiplyScalar(1));
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshLambertMaterial({ color: 0x2a3a2a }));
  mesh.position.copy(pos);
  scene.add(mesh);
  projectiles.push({
    mesh, dir, speed: 15, dmg: 250, explosive: true, life: 3, grenade: true,
    vel: dir.clone().multiplyScalar(15).add(new THREE.Vector3(0, 8, 0))
  });
  notify('GRENADE THROWN');
  controls.vibrate(30);
}

function placeMine() {
  if (cutsceneManager && cutsceneManager.isPlaying()) return;
  const id = 113, a = ammo[id];
  if (!a || a.cur <= 0) { notify('NO MINES'); return }
  a.cur--;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }));
  mesh.position.copy(player.position).add(new THREE.Vector3(0, 0.1, 0));
  scene.add(mesh);
  mines.push({ mesh, dmg: 400, radius: 6 });
  notify('AP MINE PLACED');
}

// ============================================================================
//  FLARES
// ============================================================================
function launchFlare(typeKey) {
  if (cutsceneManager && cutsceneManager.isPlaying()) return;
  const type = typeKey || controls.flareType || 'signal_red';
  if (!FLARE_TYPES[type]) return;
  if ((flareInventory[type] || 0) <= 0) {
    notify(`NO ${type.replace('_', ' ').toUpperCase()} FLARES`);
    controls.vibrate([40, 40, 40]);
    return;
  }
  if (currentGunId === 126) {
    const a = ammo[126];
    if (a && a.cur <= 0) { reload(); return; }
    if (a) a.cur--;
  }
  flareInventory[type]--;
  updateAmmoUI(); updateFlareUI();

  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const pos = player.position.clone().add(new THREE.Vector3(0, 1.6, 0)).add(dir.clone().multiplyScalar(1.2));

  if (type === 'distress') {
    flareManager.launchBurst(pos, 'distress');
    notify('🆘 DISTRESS FLARE - SOS BURST');
  } else {
    flareManager.launch(pos, dir, type, type === 'illumination' ? 18 : 26);
    notify(`🚀 ${FLARE_TYPES[type].name.toUpperCase()}`);
    // red flare near Michael's throne calls a missile strike
    if (type.indexOf('red') >= 0 && player.position.distanceTo(THRONE) < 200) {
      notify('🎯 TARGET MARKED - MISSILE INBOUND!');
      setTimeout(() => explode(THRONE.clone(), 800, 22), 3000);
    }
  }
  controls.vibrate([20, 30, 20]);
}

function updateFlareUI() {
  const el = $('flareCount');
  if (el) el.textContent = Object.values(flareInventory).reduce((a, b) => a + b, 0);
}

// ============================================================================
//  ENEMY LOGIC
// ============================================================================
function updateEnemyHealth(e) {
  const pct = Math.max(0, e.health / e.maxHealth);
  if (e.bar.material.map) e.bar.material.map.dispose();
  e.bar.material.map = makeHealthTexture(pct, pct > 0.5 ? '#0f0' : pct > 0.25 ? '#ff0' : '#f00');
  e.bar.material.needsUpdate = true;
}

function updateEnemies(dt) {
  if (cutsceneManager && cutsceneManager.isPlaying()) return;
  for (const e of enemies) {
    if (e.health <= 0) continue;
    const d = e.group.position.distanceTo(player.position);
    if (d > drawDistance) continue;

    for (let i = mines.length - 1; i >= 0; i--) {
      const m = mines[i];
      if (m.mesh.position.distanceTo(e.group.position) < m.radius) {
        explode(m.mesh.position, m.dmg, m.radius);
        scene.remove(m.mesh); mines.splice(i, 1);
        e.health -= m.dmg;
        if (e.health <= 0) killEnemy(e);
      }
    }

    if (d < 45) {
      _v1.subVectors(player.position, e.group.position);
      _v1.y = 0; _v1.normalize();
      e.group.position.addScaledVector(_v1, dt * (e.isBoss ? 4 : 2.5));
      e.group.lookAt(player.position);
      if (clock.elapsedTime - e.lastShot > (e.isBoss ? 0.5 : 1.4)) {
        e.lastShot = clock.elapsedTime;
        if (Math.random() < 0.55) damagePlayer(e.isBoss ? 25 : 10);
      }
    } else if (e.state === 'patrol') {
      _v1.subVectors(e.target, e.group.position);
      if (_v1.length() < 4) e.target.set((Math.random() - 0.5) * 1500, 0, (Math.random() - 0.5) * 1500);
      else {
        _v1.normalize();
        e.group.position.addScaledVector(_v1, dt * 1.2);
        e.group.lookAt(_v2.copy(e.group.position).add(_v1));
      }
    }
  }
}

function damagePlayer(dmg) {
  if (armor > 0) { armor = Math.max(0, armor - dmg * 0.6); health = Math.max(0, health - dmg * 0.4); }
  else health = Math.max(0, health - dmg);
  updateHealthUI();
  spawnParticle(player.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff0000, 0.15);
  controls.vibrate(40);
  if (health <= 0) playerDeath();
}

function killEnemy(e) {
  e.health = 0;
  e.group.visible = false;
  zen += e.isBoss ? 10000 : 150 + Math.floor(Math.random() * 200);
  updateZenUI();
  spawnParticle(e.group.position.clone().add(new THREE.Vector3(0, 1, 0)), 0xff2040, 0.6);
  for (let i = 0; i < 5; i++) spawnParticle(e.group.position.clone(), 0xffaa00, 0.35);
  controls.vibrate([30, 40, 30]);
  if (e.isBoss) {
    notify('MICHAEL ELIMINATED - MISSION COMPLETE');
    activeQuests.forEach(q => { if (q.id === 30) completeQuest(q); });
    if (cutscenesEnabled) setTimeout(() => playCutscene('endgame'), 1200);
  }
  if (!e.isBoss) setTimeout(() => {
    e.health = 100;
    e.group.position.set((Math.random() - 0.5) * 1500, 1.2, (Math.random() - 0.5) * 1500);
    e.group.visible = true;
    updateEnemyHealth(e);
  }, 15000);
}

function playerDeath() {
  notify('JACKSON DOWN - RESPAWNING');
  health = 100; armor = 60;
  player.position.copy(APARTMENT);
  updateHealthUI();
  wantedLevel = 0; updateWanted();
  if (cutscenesEnabled) playCutscene('contract');
}

// ============================================================================
//  EXPLOSIONS
// ============================================================================
function explode(pos, dmg, radius) {
  spawnParticle(pos, 0xff4400, radius * 0.4);
  for (let i = 0; i < 16; i++) spawnParticle(pos.clone(), Math.random() < 0.5 ? 0xffaa00 : 0xff4400, 0.4 + Math.random() * 0.6);
  for (const e of enemies) {
    if (e.health <= 0) continue;
    const d = e.group.position.distanceTo(pos);
    if (d < radius) {
      e.health -= dmg * (1 - d / radius);
      updateEnemyHealth(e);
      if (e.health <= 0) killEnemy(e);
    }
  }
  const dp = player.position.distanceTo(pos);
  if (dp < radius) damagePlayer(dmg * (1 - dp / radius) * 0.35);
  if (dp < radius * 2) recoilShake = (1 - dp / (radius * 2)) * 0.5;
  controls.vibrate([40, 60, 40]);
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (p.grenade) {
      p.vel.y -= 18 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      p.life -= dt;
      if (p.mesh.position.y <= 0.2 || p.life <= 0) {
        explode(p.mesh.position, p.dmg, 8);
        scene.remove(p.mesh); projectiles.splice(i, 1);
      }
      continue;
    }
    p.mesh.position.addScaledVector(p.dir, p.speed * dt);
    p.life -= dt;
    if (p.life <= 0) {
      if (p.explosive) explode(p.mesh.position, p.dmg, 10);
      recycleProjectile(p, i);
      continue;
    }
    for (const e of enemies) {
      if (e.health > 0 && e.group.position.distanceTo(p.mesh.position) < 2.5) {
        if (p.explosive) explode(p.mesh.position, p.dmg, 8);
        else { e.health -= p.dmg; updateEnemyHealth(e); if (e.health <= 0) killEnemy(e); }
        recycleProjectile(p, i);
        break;
      }
    }
  }
  for (let i = particlePool.length - 1; i >= 0; i--) {
    const p = particlePool[i];
    if (p.life <= 0) continue;
    p.life -= p.decay;
    p.mesh.position.addScaledVector(p.vel, dt);
    p.vel.y -= 9 * dt;
    p.mesh.material.opacity = Math.max(0, p.life);
    p.mesh.scale.multiplyScalar(0.985);
    if (p.life <= 0) p.mesh.visible = false;
  }
  for (const t of tracerPool) {
    if (t.life <= 0) continue;
    t.life -= dt;
    t.line.material.opacity = Math.max(0, t.life / 0.06);
    if (t.life <= 0) t.line.visible = false;
  }
}
function recycleProjectile(p, i) {
  p.mesh.visible = false;
  if (!p.grenade) { scene.remove(p.mesh); projectPool.push(p.mesh); }
  projectiles.splice(i, 1);
}

// ============================================================================
//  MOVEMENT + CAMERA
// ============================================================================
function updatePlayer(dt) {
  if (cutsceneManager && cutsceneManager.isPlaying() || inVehicle) return;

  // look: right stick is a rate (dt based), swipe zone and gyro add impulses
  const look = controls.consumeLook(dt);
  if (look.x || look.y) {
    camYaw -= look.x;
    camPitch -= look.y;
    camPitch = Math.max(-1.2, Math.min(1.2, camPitch));
  }

  isSprinting = controls.isSprinting();
  const mv = controls.getMove();
  const speed = (isCrouching ? 1.9 : isSprinting ? 7.0 : 4.2) * (isAiming ? 0.6 : 1);

  if (Math.abs(mv.x) > 0.06 || Math.abs(mv.y) > 0.06) {
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward); forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).negate();
    const move = new THREE.Vector3()
      .addScaledVector(forward, -mv.y)
      .addScaledVector(right, mv.x);
    move.normalize().multiplyScalar(speed * dt);
    const next = player.position.clone().add(move);
    let blocked = false;
    for (const b of buildings) {
      if (Math.abs(next.x - b.x) < b.w / 2 + 1 && Math.abs(next.z - b.z) < b.d / 2 + 1) { blocked = true; break; }
    }
    if (!blocked) player.position.add(move);
    isStealth = isCrouching;
  } else {
    isStealth = true;
  }

  if (controls.isDown('jump') && isGrounded) { velocity.y = 7.5; isGrounded = false; }
  velocity.y -= 18 * dt;
  player.position.y += velocity.y * dt;
  if (player.position.y <= 0) { player.position.y = 0; velocity.y = 0; isGrounded = true; }

  const el = $('stealthMeter');
  if (el) {
    if (isStealth) { el.textContent = 'HIDDEN'; el.style.color = 'var(--zen)'; }
    else if (isSprinting) { el.textContent = 'EXPOSED'; el.style.color = 'var(--danger)'; }
    else { el.textContent = 'VISIBLE'; el.style.color = 'var(--gold)'; }
  }
}

function updateVehicle(dt) {
  if (!inVehicle) return;
  const v = inVehicle;
  const mv = controls.getMove();
  const throttle = -mv.y, steer = mv.x;
  const kind = v.data.type;
  if (kind === 'Car' || kind === 'Tank' || kind === 'Heavy') {
    vehicleVelocity += throttle * dt * 30;
    vehicleVelocity *= 0.98;
    v.group.position.addScaledVector(v.group.getWorldDirection(_v1), vehicleVelocity * dt);
    v.group.rotation.y += steer * dt * 1.5 * (vehicleVelocity > 0 ? 1 : -1);
    v.group.position.y = 1;
  } else if (kind === 'Bike') {
    vehicleVelocity += throttle * dt * 40;
    vehicleVelocity *= 0.97;
    v.group.position.addScaledVector(v.group.getWorldDirection(_v1), vehicleVelocity * dt);
    v.group.rotation.y += steer * dt * 2.5;
    v.group.rotation.z = -steer * 0.3 * (vehicleVelocity / 20);
    v.group.position.y = 0.8;
  } else if (kind === 'Ship') {
    vehicleVelocity += throttle * dt * 20;
    vehicleVelocity *= 0.985;
    v.group.position.addScaledVector(v.group.getWorldDirection(_v1), vehicleVelocity * dt);
    v.group.rotation.y += steer * dt * 0.8;
    v.group.position.y = 0.5 + Math.sin(clock.elapsedTime * 2) * 0.1;
  } else { // Plane / Jet
    vehicleVelocity = Math.max(6, vehicleVelocity + throttle * dt * 50);
    v.group.position.addScaledVector(v.group.getWorldDirection(_v1), vehicleVelocity * dt);
    v.group.rotation.y += steer * dt * 0.6;
    v.group.position.y = Math.max(12, v.group.position.y + mv.x * dt * 20);
  }
  player.position.copy(v.group.position);

  for (let i = mines.length - 1; i >= 0; i--) {
    const m = mines[i];
    if (m.mesh.position.distanceTo(v.group.position) < m.radius + 3) {
      explode(m.mesh.position, m.dmg * 1.5, m.radius * 1.5);
      scene.remove(m.mesh); mines.splice(i, 1);
      vehicleVelocity *= -0.5;
    }
  }
}

function updateCamera(dt) {
  if (cutsceneManager && cutsceneManager.isPlaying()) {
    cutsceneManager.update(dt);
    const prog = $('csProgress');
    if (prog && cutsceneManager.current) {
      prog.style.width = (cutsceneManager.time / cutsceneManager.current.duration * 100) + '%';
    }
    return;
  }
  if (inVehicle) {
    const v = inVehicle.group;
    _v1.copy(v.getWorldDirection(_v1).negate().multiplyScalar(16)).setY(6);
    camera.position.lerp(_v2.copy(v.position).add(_v1), dt * 3);
    camera.lookAt(_v3.copy(v.position).setY(v.position.y + 3));
    return;
  }
  const dist = isAiming ? 2.0 : isCrouching ? 2.5 : 4.5;
  const height = isCrouching ? 1.0 : 1.7;
  const camPos = _v1.set(
    player.position.x + Math.sin(camYaw) * Math.cos(camPitch) * dist,
    player.position.y + height + Math.sin(camPitch) * dist,
    player.position.z + Math.cos(camYaw) * Math.cos(camPitch) * dist
  );
  const head = _v2.set(player.position.x, player.position.y + height, player.position.z);
  _ray.set(head, _v3.subVectors(camPos, head).normalize());
  _ray.far = dist;
  _ray.camera = camera;
  const hits = _ray.intersectObjects(buildingMeshes, false);
  if (hits.length) camPos.lerpVectors(player.position, camPos, hits[0].distance / dist * 0.8);
  camera.position.lerp(camPos, dt * 8);
  camera.lookAt(head);

  if (recoilShake > 0) {
    camera.position.x += (Math.random() - 0.5) * recoilShake;
    camera.position.y += (Math.random() - 0.5) * recoilShake;
    recoilShake *= 0.8;
    if (recoilShake < 0.01) recoilShake = 0;
  }
}

// ============================================================================
//  WORK / ALARM / SHIFT
// ============================================================================
function showAlarm() {
  const el = $('workAlarm');
  el.style.display = 'flex';
  $('alarmTime').textContent = clockString();
  playAudio($('alarmAudio'), 0.7);
  const alarmMesh = window.jacksonApartment && window.jacksonApartment.getObjectByName('alarmClock');
  if (alarmMesh) {
    let on = true;
    const iv = setInterval(() => {
      if (el.style.display === 'none') { clearInterval(iv); alarmMesh.material.color.setHex(0xff2040); return; }
      alarmMesh.material.color.setHex(on ? 0xffffff : 0xff2040);
      on = !on;
    }, 320);
  }
}
function hideAlarm() {
  $('workAlarm').style.display = 'none';
  const a = $('alarmAudio');
  if (a) a.pause();
}
function clockString() {
  const h12 = gameTime.h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${gameTime.m.toString().padStart(2, '0')} ${gameTime.h >= 12 ? 'PM' : 'AM'}`;
}
function paintClock() {
  const el = $('workClock');
  if (!el) return;
  el.textContent = clockString() + (gameTime.h >= SHIFT_START && gameTime.h < SHIFT_END ? ' | ON SHIFT' : ' | OFF SHIFT');
  const a = $('alarmTime');
  if (a && $('workAlarm').style.display === 'flex') a.textContent = clockString();
}
function startShift() {
  hideAlarm();
  gameTime = { h: SHIFT_START, m: 0 };
  workShiftActive = true;
  gameStarted = true;
  $('mainMenu').style.display = 'none';
  hud.style.display = 'block';
  player.position.copy(APARTMENT).setZ(APARTMENT.z - 2);
  camYaw = 0.5; camPitch = 0.12;
  updateHealthUI(); updateZenUI(); updateAmmoUI(); updateWanted(); updateFlareUI();
  updateContextButton();
  paintClock();
  playAudio($('briefingAudio'), 0.8);
  notify('☀ GOOD MORNING JACKSON - SHIFT STARTED 06:00');
  notify('💼 3 NEW JOBS ON THE BOARD');
  setTimeout(() => { if (cutscenesEnabled) playCutscene('wakeUpWork'); }, 400);
  setTimeout(() => { if (cutscenesEnabled) playCutscene('intro'); }, 10000);
}
function tickClock(dt) {
  if (!workShiftActive) return;
  shiftTick += dt;
  if (shiftTick < 2) return;      // 2 real seconds = 1 game minute
  shiftTick = 0;
  gameTime.m++;
  if (gameTime.m >= 60) { gameTime.m = 0; gameTime.h++; if (gameTime.h >= 24) gameTime.h = 0; }
  const el = $('workClock');
  if (el) paintClock();
  if (gameTime.h === SHIFT_END && gameTime.m === 0) notify('🌙 SHIFT OVER 22:00 - SLEEP AT THE APARTMENT');
  if (gameTime.h === SHIFT_START && gameTime.m === 0 && player.position.distanceTo(APARTMENT) < 20) showAlarm();
}
function toggleSleepPrompt() {
  const existing = $('sleepPrompt');
  if (existing) { existing.remove(); return; }
  const d = document.createElement('div');
  d.id = 'sleepPrompt';
  d.innerHTML = `<div style="margin-bottom:8px">🏠 APARTMENT</div>
    <button id="sleepBtn" style="min-height:52px;width:100%;padding:12px 18px;background:linear-gradient(90deg,#00ff88,#00cc6a);color:#000;font-family:var(--font-h);font-weight:700;border-radius:6px;font-size:12px">💤 SLEEP UNTIL 06:00</button>`;
  document.body.appendChild(d);
  $('sleepBtn').addEventListener('touchstart', ev => { ev.preventDefault(); doSleep(); }, { passive: false });
  $('sleepBtn').addEventListener('click', doSleep);
  setTimeout(() => { const el = $('sleepPrompt'); if (el) el.remove(); }, 9000);
}
function doSleep() {
  const el = $('sleepPrompt');
  if (el) el.remove();
  notify('💤 SLEEPING...');
  health = 100; armor = 60; updateHealthUI();
  setTimeout(() => {
    gameTime = { h: SHIFT_START, m: 0 };
    paintClock();
    showAlarm();
    controls.vibrate([50, 50, 50]);
  }, 900);
}

// ============================================================================
//  UI
// ============================================================================
function setupUI() {
  $('wakeUpBtn').addEventListener('touchstart', e => { e.preventDefault(); startShift(); }, { passive: false });
  $('wakeUpBtn').addEventListener('click', startShift);
  $('snoozeBtn').addEventListener('touchstart', e => { e.preventDefault(); doSnooze(); }, { passive: false });
  $('snoozeBtn').addEventListener('click', doSnooze);
  $('playBtn').addEventListener('touchstart', e => { e.preventDefault(); showAlarm(); }, { passive: false });
  $('playBtn').addEventListener('click', showAlarm);
  $('workAlarmBtn').addEventListener('click', () => playCutscene('wakeUpWork'));
  $('flareBtn').addEventListener('click', () => toggleModal('flareModal'));
  $('cutsceneBtn').addEventListener('click', () => playCutscene('intro'));
  $('loadBtn').addEventListener('click', () => toggleModal('armouryModal'));
  $('mapBtn').addEventListener('click', () => toggleModal('questModal'));
  $('settingsBtn').addEventListener('click', () => toggleModal('settingsModal'));
  document.querySelectorAll('[data-close]').forEach(b => {
    b.addEventListener('click', () => closeModal(b.dataset.close));
  });
  document.querySelectorAll('.modal').forEach(m => {
    m.addEventListener('touchstart', e => { if (e.target === m) closeModal(m.id); }, { passive: true });
  });

  buildArmoury();
  buildFlareGrid();
  buildQuestList('all');
  buildCutsceneList();
  buildVehicleList();

  document.querySelectorAll('#gunFilters button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#gunFilters button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      renderGuns(b.dataset.filter);
    });
  });
  document.querySelectorAll('#questFilters button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('#questFilters button').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      buildQuestList(b.dataset.qfilter);
    });
  });

  $('pxRatio').addEventListener('input', e => renderer.setPixelRatio(parseFloat(e.target.value)));
  $('drawDist').addEventListener('input', e => { drawDistance = parseInt(e.target.value, 10); });
  $('fovSlider').addEventListener('input', e => { camera.fov = parseInt(e.target.value, 10); camera.updateProjectionMatrix(); });
  $('sens').addEventListener('input', e => { controls.sensitivity = parseFloat(e.target.value); });
  $('toggleAutoAim').addEventListener('change', e => { controls.autoAim = e.target.checked; });
  $('toggleHaptics').addEventListener('change', e => { controls.haptics = e.target.checked; });
  $('toggleInvertY').addEventListener('change', e => { controls.invertY = e.target.checked; });
  $('toggleGyro').addEventListener('change', e => controls.toggleGyro(e.target.checked));
  $('toggleCutscenes').addEventListener('change', e => { cutscenesEnabled = e.target.checked; });
  $('toggleLetterbox').addEventListener('change', e => {
    const on = e.target.checked;
    if (cutsceneManager.letterboxTop) cutsceneManager.letterboxTop.style.display = on ? '' : 'none';
    if (cutsceneManager.letterboxBottom) cutsceneManager.letterboxBottom.style.display = on ? '' : 'none';
  });
  $('testCutsceneBtn').addEventListener('click', () => { closeAllModals(); setTimeout(() => playCutscene('intro'), 200); });
  $('resetBtn').addEventListener('click', () => {
    health = 100; armor = 60; updateHealthUI();
    player.position.copy(APARTMENT);
    if (inVehicle) exitVehicle();
    if (cutsceneManager && cutsceneManager.isPlaying()) cutsceneManager.end();
    controls.setActive(true);
    notify('RESET DONE');
  });
}
function doSnooze() {
  hideAlarm();
  notify('💤 SNOOZED 5 MIN');
  setTimeout(showAlarm, 5000);
}

function buildArmoury() { renderGuns('all'); }
function renderGuns(filter) {
  const grid = $('gunGrid');
  if (!grid) return;
  let list = GUNS;
  if (filter === 'all') list = GUNS;
  else if (filter === 'Heavy') list = GUNS.filter(g => ['Heavy', 'Explosive', 'Mine', 'Throwable'].includes(g.cat));
  else if (filter === 'Mythic') list = GUNS.filter(g => g.rarity === 'Mythic' || g.rarity === 'Legendary');
  else list = GUNS.filter(g => g.cat === filter);
  grid.innerHTML = list.map(g => `
    <div class="gun-card ${ownedGuns.has(g.id) ? 'owned' : ''}" data-id="${g.id}">
      <div class="rarity ${g.rarity}">${g.rarity}</div>
      <h4>${g.name}</h4>
      <div class="meta"><span>DMG ${g.dmg}</span><span>MAG ${g.mag}</span><span>${g.range}m</span></div>
      <div class="gun-desc">${g.desc}</div>
      <div class="price">◉ ${g.price} ZEN ${ownedGuns.has(g.id) ? '✓ OWNED' : ''}</div>
    </div>`).join('');
  grid.querySelectorAll('.gun-card').forEach(card => {
    card.addEventListener('click', () => {
      const g = GUNS.find(x => x.id === parseInt(card.dataset.id, 10));
      if (ownedGuns.has(g.id)) { equipGun(g.id); closeModal('armouryModal'); return; }
      if (zen < g.price) { notify(`NEED ${g.price - zen} MORE ZEN`); return; }
      zen -= g.price; ownedGuns.add(g.id);
      ammo[g.id] = { cur: g.mag, reserve: g.mag * 4 };
      updateZenUI(); renderGuns(document.querySelector('#gunFilters button.active').dataset.filter);
      notify(`PURCHASED ${g.name}`);
      controls.vibrate(50);
    });
  });
}
function buildVehicleList() {
  const el = $('vehicleList');
  if (!el) return;
  el.innerHTML = VEHICLES.map(v => `
    <div class="list-row" data-id="${v.id}">
      <span>${v.type} - ${v.name}<br><span style="opacity:.5;font-size:9px">${v.desc}</span></span>
      <span style="color:var(--zen);font-family:var(--font-h)">${v.price ? '◉ ' + v.price : 'FREE'}</span>
    </div>`).join('');
  el.querySelectorAll('.list-row').forEach(row => {
    row.addEventListener('click', () => {
      const data = VEHICLES.find(v => v.id === parseInt(row.dataset.id, 10));
      if (data.price && zen < data.price) { notify(`NEED ${data.price} ZEN`); return; }
      if (data.price) { zen -= data.price; updateZenUI(); }
      const gv = vehicles.find(x => x.data.id === data.id);
      if (gv) {
        gv.group.position.copy(player.position).add(new THREE.Vector3(8, 1, 0));
        notify(`SPAWNED ${data.name}`);
      }
    });
  });
}
function buildCutsceneList() {
  const el = $('cutsceneList');
  if (!el) return;
  el.innerHTML = Object.keys(CUTSCENES).map(k => `
    <div class="list-row" data-key="${k}">
      <span>🎬 ${CUTSCENES[k].title}</span>
      <span style="color:var(--purple);font-family:var(--font-h)">${CUTSCENES[k].duration}s</span>
    </div>`).join('');
  el.querySelectorAll('.list-row').forEach(row => {
    row.addEventListener('click', () => { closeAllModals(); setTimeout(() => playCutscene(row.dataset.key), 200); });
  });
}
function buildFlareGrid() {
  const grid = $('flareGrid');
  if (!grid) return;
  grid.innerHTML = Object.keys(FLARE_TYPES).map(k => {
    const f = FLARE_TYPES[k];
    const hex = '#' + f.color.toString(16).padStart(6, '0');
    const light = f.color === 0xffffff || f.color === 0xffffaa ? '#000' : '#fff';
    return `<div class="gun-card" data-key="${k}" style="border-color:${hex}55">
      <div class="rarity" style="background:${hex};color:${light}">${f.duration}s</div>
      <h4 style="color:${hex}">${f.name}</h4>
      <div class="gun-desc">${f.desc}</div>
      <div class="price">◉ ${f.price} ZEN &bull; x${flareInventory[k] || 0}</div>
    </div>`;
  }).join('');
  grid.querySelectorAll('.gun-card').forEach(card => {
    card.addEventListener('click', () => {
      const k = card.dataset.key;
      if ((flareInventory[k] || 0) <= 0) {
        const price = FLARE_TYPES[k].price;
        if (zen < price) { notify(`NEED ${price} ZEN`); return; }
        zen -= price; flareInventory[k] = 1;
        updateZenUI(); buildFlareGrid();
        notify(`BOUGHT ${FLARE_TYPES[k].name}`);
        return;
      }
      closeAllModals();
      controls.setFlareType(k);
      setTimeout(() => launchFlare(k), 200);
    });
  });
}
function buildQuestList(filter) {
  const list = $('questList');
  if (!list) return;
  let q = [];
  if (filter === 'Main') q = MAIN_QUESTS;
  else if (filter === 'Side') q = SIDE_QUESTS;
  else if (filter === 'Active') q = activeQuests;
  else if (filter === 'Done') q = [...MAIN_QUESTS, ...SIDE_QUESTS].filter(x => completedQuests.has(x.id));
  else q = [...MAIN_QUESTS, ...SIDE_QUESTS];
  list.innerHTML = q.map(x => {
    const active = activeQuests.some(a => a.id === x.id);
    const done = completedQuests.has(x.id);
    const cs = CUTSCENE_FOR_QUEST[x.id];
    return `<div class="quest-card" data-id="${x.id}">
      <h4>${x.type} #${x.id} - ${x.title}${cs ? ' 🎬' : ''}</h4>
      <p>${x.desc}</p>
      ${x.objectives.map(o => `<div class="obj ${done ? 'done' : ''}">${o}</div>`).join('')}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;gap:6px">
        <span style="font-family:var(--font-h);font-size:10px;color:var(--zen)">+${x.reward} ZEN</span>
        <span style="font-family:var(--font-h);font-size:9px;opacity:.6">${active ? 'TRACKING' : done ? 'DONE' : x.difficulty}</span>
      </div></div>`;
  }).join('');
  list.querySelectorAll('.quest-card').forEach(card => {
    card.addEventListener('click', () => {
      const q2 = [...MAIN_QUESTS, ...SIDE_QUESTS].find(x => x.id === parseInt(card.dataset.id, 10));
      if (!q2 || completedQuests.has(q2.id) || activeQuests.some(a => a.id === q2.id)) return;
      activeQuests.push(q2);
      if (activeQuests.length > 3) activeQuests.shift();
      updateQuestHUD();
      buildQuestList(document.querySelector('#questFilters button.active').dataset.qfilter);
      notify(`STARTED: ${q2.title}`);
      const cs = CUTSCENE_FOR_QUEST[q2.id];
      if (cs && cutscenesEnabled) setTimeout(() => playCutscene(cs), 300);
    });
  });
}

function toggleModal(id) {
  const m = $(id);
  if (!m) return;
  const active = m.classList.contains('active');
  closeAllModals();
  if (!active) m.classList.add('active');
}
function closeModal(id) { const m = $(id); if (m) m.classList.remove('active'); }
function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('active')); }
const modalOpen = () => !!document.querySelector('.modal.active');

// ============================================================================
//  HUD
// ============================================================================
function updateHealthUI() {
  $('hpText').textContent = Math.floor(health);
  $('armorText').textContent = Math.floor(armor);
  $('hpFill').style.width = health + '%';
  $('armorFill').style.width = armor + '%';
}
function updateZenUI() { $('zenCount').textContent = zen.toLocaleString(); }
function updateAmmoUI() {
  const g = currentGun();
  if (!g) return;
  const a = ammo[g.id];
  $('ammoCur').textContent = a ? a.cur : 0;
  $('ammoRes').textContent = a ? a.reserve : 0;
  $('gunName').textContent = g.name;
}
function updateWanted() {
  const el = $('wanted');
  if (!el) return;
  el.textContent = '★'.repeat(Math.floor(wantedLevel)) + '☆'.repeat(5 - Math.floor(wantedLevel));
  el.style.color = wantedLevel > 3 ? 'var(--danger)' : wantedLevel > 1 ? 'var(--gold)' : '#fff';
}
function notify(text) {
  const cont = $('notifs');
  if (!cont) return;
  const d = document.createElement('div');
  d.className = 'notif';
  d.textContent = text;
  cont.appendChild(d);
  setTimeout(() => d.remove(), 2600);
}

function startMinimap() {
  const canvas = $('miniCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const S = 120;
  let acc = 0;
  return () => {
    ctx.clearRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(10,20,30,0.85)';
    ctx.fillRect(0, 0, S, S);
    ctx.strokeStyle = 'rgba(0,255,136,0.18)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= S; i += 24) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(S, i); ctx.stroke();
    }
    const scale = 0.055, ox = S / 2, oz = S / 2;
    const map = (x, z) => [ox + (x - player.position.x) * scale, oz + (z - player.position.z) * scale];
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    buildings.forEach(b => {
      const [bx, bz] = map(b.x, b.z);
      ctx.fillRect(bx - 2, bz - 2, 4, 4);
    });
    ctx.fillStyle = 'var(--danger)';
    ctx.fillStyle = '#ff2040';
    enemies.forEach(e => {
      if (e.health <= 0) return;
      const [ex, ez] = map(e.group.position.x, e.group.position.z);
      ctx.beginPath(); ctx.arc(ex, ez, 2.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = '#00aaff';
    vehicles.forEach(v => {
      const [vx, vz] = map(v.group.position.x, v.group.position.z);
      ctx.fillRect(vx - 1.5, vz - 1.5, 3, 3);
    });
    ctx.strokeStyle = '#ffcc00';
    activeQuests.forEach(q => {
      const [qx, qz] = map(q.location.x, q.location.z);
      ctx.beginPath(); ctx.arc(qx, qz, 4, 0, Math.PI * 2); ctx.stroke();
    });
    const apt = map(APARTMENT.x, APARTMENT.z);
    ctx.strokeStyle = '#00ff88';
    ctx.strokeRect(apt[0] - 3, apt[1] - 3, 6, 6);
    ctx.fillStyle = '#00ff88';
    ctx.beginPath(); ctx.arc(ox, oz, 3, 0, Math.PI * 2); ctx.fill();
  };
}

// ============================================================================
//  LOOP
// ============================================================================
let miniDraw = null, lastFps = 0, frameCount = 0, miniAcc = 0, contextAcc = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());

  if (!gameStarted) {
    const t = clock.elapsedTime * 0.08;
    camera.position.set(Math.sin(t) * 30, 16 + Math.sin(t * 0.5) * 3, Math.cos(t) * 30);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    return;
  }

  const inCutscene = !!(cutsceneManager && cutsceneManager.isPlaying());
  if (!inCutscene && !modalOpen()) {
    updatePlayer(dt);
    updateVehicle(dt);
    updateEnemies(dt);
  } else if (inCutscene) {
    controls.consumeLook(dt);
  }

  updateProjectiles(dt);
  flareManager.update(dt, spawnParticle);
  updateCamera(dt);
  tickClock(dt);

  // hold-to-fire
  if (controls.isDown('shoot') && !inCutscene && !modalOpen()) {
    const gun = currentGun();
    const rpm = gun ? gun.rpm : 600;
    if (clock.elapsedTime >= autoFireNext) {
      autoFireNext = clock.elapsedTime + 60 / rpm;
      shoot();
    }
  }

  if (wantedLevel > 0) {
    wantedLevel = Math.max(0, wantedLevel - dt * 0.1);
    if (Math.floor(clock.elapsedTime * 2) % 2 === 0) updateWanted();
  }

  for (const q of activeQuests) {
    // no allocation in the hot loop
    const dx = player.position.x - q.location.x, dz = player.position.z - q.location.z;
    if (dx * dx + dz * dz < 625 && Math.random() < 0.01) completeQuest(q);
  }

  // HUD refresh at a low rate, the DOM is expensive on a phone
  miniAcc += dt; contextAcc += dt;
  if (miniAcc > 0.15) { miniAcc = 0; if (miniDraw) miniDraw(); }
  if (contextAcc > 0.4) { contextAcc = 0; if (!inCutscene) updateContextButton(); }

  frameCount++;
  if (clock.elapsedTime - lastFps > 0.5) {
    const fps = Math.round(frameCount / (clock.elapsedTime - lastFps));
    frameCount = 0; lastFps = clock.elapsedTime;
    const f = $('perfFps');
    if (f) f.textContent = fps + ' FPS';
    const t = $('perfDraw');
    if (t) t.textContent = renderer.info.render.triangles + ' TRIS';
  }

  const sky = scene.getObjectByName('sky');
  if (sky) sky.position.copy(camera.position);

  renderer.render(scene, camera);
}

// ============================================================================
//  GO
// ============================================================================
miniDraw = startMinimap();
window.STEALTH_MOBILE = {
  THREE, GUNS, VEHICLES, MAIN_QUESTS, SIDE_QUESTS, CUTSCENES, FLARE_TYPES, MOBILE_PROFILE, Optimization,
  // small handle for on-device debugging (Safari remote inspector / chrome://inspect)
  get debug() {
    return {
      scene, camera, player, enemies, vehicles, buildings, controls, flareManager, cutsceneManager, playCutscene,
      giveFlares: n => { Object.keys(FLARE_TYPES).forEach(k => { flareInventory[k] = n; }); updateFlareUI(); },
      state: () => ({ health, armor, zen, gameStarted, gameTime: { ...gameTime }, inVehicle: inVehicle && inVehicle.data.name, currentGunId, flares: { ...flareInventory } })
    };
  }
};
init().catch(err => {
  console.error(err);
  const f = $('fatal'), m = $('fatalMsg');
  if (m) m.textContent = (err && err.message) || String(err);
  if (f) f.style.display = 'flex';
});
