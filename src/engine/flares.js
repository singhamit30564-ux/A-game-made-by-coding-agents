// STEALTH RESILIENCE - FLARE SYSTEM (10 TYPES, MOBILE OPTIMISED)
// Signal red/green/white, 60k parachute illumination, red/green/white smoke,
// distress SOS burst and an IR strobe. Every flare burns a flickering PointLight,
// carries a cached glow sprite and a smoke trail; illumination and white signal
// fly a parachute, red near Michael's throne (0,1000) calls a missile strike.

import * as THREE from 'three';

export const FLARE_TYPES = {
  signal_red:    { name: 'Signal Flare RED',    color: 0xff2040, lightColor: 0xff2040, intensity: 3,   duration: 30,  dist: 150, price: 150, desc: 'Emergency - mark the enemy position, call for fire' },
  signal_green:  { name: 'Signal Flare GREEN',  color: 0x00ff88, lightColor: 0x00ff88, intensity: 3,   duration: 30,  dist: 150, price: 150, desc: 'Safe zone - mark the extraction point, friendly' },
  signal_white:  { name: 'Signal Flare WHITE',  color: 0xffffff, lightColor: 0xffffff, intensity: 4,   duration: 25,  dist: 180, price: 200, desc: 'Illumination - light up the whole block' },
  illumination:  { name: 'Illumination 60K',    color: 0xffffaa, lightColor: 0xffffcc, intensity: 6,   duration: 45,  dist: 200, price: 300, desc: 'Parachute flare - 60,000 candlepower, 45 sec, 200m' },
  smoke_red:     { name: 'Smoke RED',           color: 0xff2040, lightColor: 0xff2040, intensity: 1,   duration: 60,  dist: 60,  price: 100, desc: 'Red smoke - mark the target for the airstrike' },
  smoke_green:   { name: 'Smoke GREEN',         color: 0x00ff88, lightColor: 0x00ff88, intensity: 1,   duration: 60,  dist: 60,  price: 100, desc: 'Green smoke - mark the LZ for the chopper' },
  smoke_white:   { name: 'Smoke WHITE',         color: 0xffffff, lightColor: 0xaaaaaa, intensity: 0.5, duration: 50,  dist: 50,  price: 80,  desc: 'White smoke - concealment cover' },
  distress:      { name: 'Distress Flare SOS',  color: 0xff6600, lightColor: 0xff6600, intensity: 2.5, duration: 20,  dist: 120, price: 250, desc: 'SOS - call for rescue, 3 burst' },
  ir_strobe:     { name: 'IR Strobe NVG',       color: 0x8800ff, lightColor: 0x8800ff, intensity: 1,   duration: 120, dist: 40,  price: 400, desc: 'Infrared only - visible with NVG, stealth marking' },
  flare_gun:     { name: 'Flare Gun M79',       color: 0xffaa00, lightColor: 0xffaa00, intensity: 2,   duration: 15,  dist: 130, price: 500, desc: 'Launch any flare up to 150m' }
};

const CORE_GEO = new THREE.SphereGeometry(0.16, 6, 6);
const PARA_GEO = new THREE.ConeGeometry(1.5, 1, 6, 1, true);
const PARA_MAT = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
const MAX_FLARES = 8;
const _glowCache = new Map();

/* One canvas texture per colour, reused by every flare (canvas per launch was a
   huge memory/CPU sink on phones). */
function glowTexture(color) {
  if (_glowCache.has(color)) return _glowCache.get(color);
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const ctx = c.getContext('2d');
  const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
  const grad = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.32, `rgba(${r},${g},${b},0.55)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 48, 48);
  const tex = new THREE.CanvasTexture(c);
  _glowCache.set(color, tex);
  return tex;
}

export class FlareManager {
  constructor(scene) {
    this.scene = scene;
    this.activeFlares = [];
    this.count = 0;
  }

  launch(pos, dir, typeKey = 'signal_red', velocity = 25) {
    const type = FLARE_TYPES[typeKey];
    if (!type) return null;
    if (this.activeFlares.length >= MAX_FLARES) this._remove(this.activeFlares[0]);

    const group = new THREE.Group();
    const core = new THREE.Mesh(CORE_GEO, new THREE.MeshBasicMaterial({ color: type.color }));
    group.add(core);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(type.color), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    glow.scale.set(2, 2, 1);
    group.add(glow);

    group.position.copy(pos);
    this.scene.add(group);

    // PointLight - the flicker is driven in update()
    const light = new THREE.PointLight(type.lightColor, type.intensity, type.dist, 1.6);
    light.position.copy(pos);
    this.scene.add(light);

    const flare = {
      group, core, glow, light, type, typeKey,
      vel: dir.clone().multiplyScalar(velocity).add(new THREE.Vector3(0, 9, 0)),
      life: type.duration, maxLife: type.duration,
      state: 'rising', parachute: null, trailTimer: 0, smokeTimer: 0, id: ++this.count
    };

    if (typeKey === 'illumination' || typeKey === 'signal_white') {
      const para = new THREE.Mesh(PARA_GEO, PARA_MAT);
      para.position.y = 1.5;
      para.rotation.x = Math.PI;
      group.add(para);
      flare.parachute = para;
      flare.state = 'parachute';
    }

    this.activeFlares.push(flare);
    return flare;
  }

  /* 3 round SOS burst */
  launchBurst(pos, typeKey = 'distress') {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const dir = new THREE.Vector3((Math.random() - 0.5) * 0.6, 1, (Math.random() - 0.5) * 0.6).normalize();
        this.launch(pos.clone(), dir, typeKey, 20 + Math.random() * 10);
      }, i * 400);
    }
  }

  update(dt, particles) {
    const now = performance.now();
    for (let i = this.activeFlares.length - 1; i >= 0; i--) {
      const f = this.activeFlares[i];
      f.life -= dt;

      if (f.state === 'rising' || f.state === 'parachute') {
        f.vel.y -= 9.8 * dt * 0.6;
        if (f.parachute) { f.vel.y = Math.max(-2, f.vel.y); f.vel.x *= 0.99; f.vel.z *= 0.99; }
        f.group.position.addScaledVector(f.vel, dt);
        f.light.position.copy(f.group.position);
        if (f.vel.y < 0 && f.state === 'rising') f.state = 'falling';

        // smoke trail, throttled so a phone does not spawn 60 particles a second
        f.trailTimer += dt;
        if (f.trailTimer > 0.06) {
          f.trailTimer = 0;
          if (particles) particles(f.group.position.clone(), f.type.color, 0.18, f.typeKey.indexOf('smoke') === 0 ? 0.7 : 0.3);
        }

        if (f.group.position.y <= 0.3) {
          f.group.position.y = 0.3;
          f.state = 'landed';
          f.vel.set(0, 0, 0);
          if (f.parachute) { f.group.remove(f.parachute); f.parachute = null; }
        }
      }

      // flicker
      f.light.intensity = f.type.intensity * (0.78 + Math.sin(now * 0.011 + f.id) * 0.22) * Math.max(0, f.life / f.maxLife);
      f.glow.material.opacity = 0.85 * Math.max(0, f.life / f.maxLife);
      f.core.scale.setScalar(1 + Math.sin(now * 0.02 + f.id) * 0.22);

      if (f.state === 'landed' && f.typeKey.indexOf('smoke') === 0) {
        f.smokeTimer += dt;
        if (f.smokeTimer > 0.16) {
          f.smokeTimer = 0;
          if (particles) {
            const p = f.group.position.clone();
            p.x += (Math.random() - 0.5) * 1.2; p.y += Math.random() * 3.5; p.z += (Math.random() - 0.5) * 1.2;
            particles(p, f.type.color, 0.6 + Math.random() * 0.6, 1.4);
          }
        }
      }

      if (f.life <= 0) this._remove(f);
    }
  }

  _remove(f) {
    const i = this.activeFlares.indexOf(f);
    if (i >= 0) this.activeFlares.splice(i, 1);
    this.scene.remove(f.group);
    this.scene.remove(f.light);
    if (f.core.material) f.core.material.dispose();
    if (f.glow.material) f.glow.material.dispose();
  }

  getNearestFlare(pos, maxDist = 100) {
    let nearest = null, min = maxDist;
    for (const f of this.activeFlares) {
      const d = f.group.position.distanceTo(pos);
      if (d < min) { min = d; nearest = f; }
    }
    return nearest;
  }
}
