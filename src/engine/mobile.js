// STEALTH RESILIENCE - MOBILE CONTROLS v2 (MOBILE ONLY, PURE TOUCH)
// Left 132px MOVE stick (green) + Sprint/Crouch/Jump 38px row
// Right 132px LOOK stick (blue) with crosshair lines
// SHOOT 88px (red, auto-aim 80m, haptics) / AIM 60px (gold) / FLARE 62px (orange) + R/G/W/sun/smoke pills
// Grenade / Mine / Work / Vehicle-Use / Weapon (long press 500ms -> radial weapon wheel)
// Top bar: MAP / GUNS / FLARES / GYRO / CUTSCENE / SETTINGS
// Every visual button is at least 38px and carries a 52px minimum touch target (see .tap::after).

const JOY_SIZE = 132;
const LONG_PRESS_MS = 500;

export class MobileControls {
  constructor() {
    // Mobile build: there is no PC path, controls are always live.
    this.isMobile = true;
    this.sensitivity = 1.2;
    this.invertY = false;
    this.autoAim = true;
    this.haptics = true;
    this.gyroEnabled = false;
    this.gyroScale = 1;
    this.gyroZero = null;
    this.flareType = 'signal_red';
    this.active = true;
    this.weapons = [];
    this.selWeaponIndex = 0;

    this.moveVector = { x: 0, y: 0 };
    this.moveMag = 0;
    this.lookRate = { x: 0, y: 0 };   // analog right stick, rad/s source
    this.lookDelta = { x: 0, y: 0 };  // impulses from the swipe zone and the gyro
    this.held = { shoot: false, aim: false, sprint: false };
    this.handlers = {};
    this.wheelOpen = false;
    this.wheelIndex = -1;

    this.onGyro = this.onGyro.bind(this);
    this._build();
    this._bind();
  }

  /* ---------------------------------------------------------------- events */
  on(action, fn) { (this.handlers[action] || (this.handlers[action] = [])).push(fn); return this; }
  emit(action, arg) { (this.handlers[action] || []).forEach(f => { try { f(arg); } catch (e) { console.error(e); } }); }

  vibrate(pattern) {
    if (this.haptics && navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) { /* ignore */ } }
  }

  /* ------------------------------------------------------------------- UI */
  _build() {
    this.root = document.getElementById('mobileControls');
    if (!this.root) return;
    this.joyMove = document.getElementById('joyMove');
    this.joyMoveKnob = document.getElementById('joyMoveKnob');
    this.joyLook = document.getElementById('joyLook');
    this.joyLookKnob = document.getElementById('joyLookKnob');
    this.lookZone = document.getElementById('lookZone');
    this.wheel = document.getElementById('weaponWheel');
    this.wheelHint = document.getElementById('weaponWheelHint');
  }

  _bind() {
    this._bindJoystick(this.joyMove, this.joyMoveKnob, 'move');
    this._bindJoystick(this.joyLook, this.joyLookKnob, 'look');
    this._bindLookZone();
    this._bindFlareSelector();
    this._bindHold('mShoot', 'shoot', 25);
    this._bindHold('mAim', 'aim', 18);
    this._bindHold('mSprint', 'sprint', 12);
    this._bindTap('mJump', 'jump', 30);
    this._bindTap('mCrouch', 'crouch', 30);
    this._bindTap('mReload', 'reload', 25);
    this._bindTap('mGrenade', 'grenade', 30);
    this._bindTap('mMine', 'mine', 30);
    this._bindTap('mFlare', 'flare', 30);
    this._bindTap('mWork', 'work', 30);
    this._bindTap('mVehicle', 'use', 35);
    this._bindTap('tMap', 'map', 20);
    this._bindTap('tGuns', 'guns', 20);
    this._bindTap('tFlares', 'flares', 20);
    this._bindTap('tCs', 'cutscene', 20);
    this._bindTap('tSet', 'settings', 20);
    this._bindWeaponButton();
    this._bindGyroButton();
    // never let the browser hijack a touch on the controls (long press menu, scroll, etc.)
    this.root.addEventListener('contextmenu', e => e.preventDefault());
  }

  /* Multi-touch safe joystick: tracks its own touch identifier so the second
     finger on the other stick never corrupts the reading. */
  _bindJoystick(base, knob, which) {
    if (!base || !knob) return;
    const state = { id: null, cx: 0, cy: 0, r: 60 };
    const max = JOY_SIZE / 2 * 0.72;

    const setKnob = (dx, dy) => {
      const d = Math.hypot(dx, dy);
      const c = d > max ? max / d : 1;
      knob.style.transform = `translate(calc(-50% + ${dx * c}px), calc(-50% + ${dy * c}px))`;
    };
    const setVec = (dx, dy) => {
      const d = Math.hypot(dx, dy);
      const c = d > max ? max / d : 1;
      const nx = (dx * c) / max, ny = (dy * c) / max;
      if (which === 'move') {
        const prev = this.moveMag;
        this.moveVector.x = nx; this.moveVector.y = ny;
        this.moveMag = Math.min(1, Math.hypot(nx, ny));
        if (prev < 0.86 && this.moveMag >= 0.86) this.vibrate(10); // haptic on the edge
      } else {
        // rate based, consumed with dt so the speed does not depend on the touch sample rate
        this.lookRate.x = nx; this.lookRate.y = ny;
      }
    };
    const reset = () => {
      state.id = null;
      base.style.transform = '';
      knob.style.transform = 'translate(-50%,-50%)';
      if (which === 'move') { this.moveVector.x = 0; this.moveVector.y = 0; this.moveMag = 0; }
      else { this.lookRate.x = 0; this.lookRate.y = 0; this.lookDelta.x = 0; this.lookDelta.y = 0; }
    };

    const start = (x, y, id) => {
      const rect = base.getBoundingClientRect();
      state.cx = rect.left + rect.width / 2;
      state.cy = rect.top + rect.height / 2;
      state.r = rect.width / 2;
      state.id = id;
      base.style.transform = 'scale(1.05)';
      setKnob(x - state.cx, y - state.cy);
      setVec(x - state.cx, y - state.cy);
    };
    const move = (x, y) => { if (state.id === null) return; setKnob(x - state.cx, y - state.cy); setVec(x - state.cx, y - state.cy); };

    base.addEventListener('touchstart', e => {
      const t = e.changedTouches[0]; if (!t) return;
      start(t.clientX, t.clientY, t.identifier);
      e.preventDefault();
    }, { passive: false });
    base.addEventListener('touchmove', e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === state.id) move(t.clientX, t.clientY);
      }
      e.preventDefault();
    }, { passive: false });
    const end = e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === state.id) { reset(); break; }
      }
    };
    base.addEventListener('touchend', end);
    base.addEventListener('touchcancel', end);
  }

  /* Swipe-to-look zone for players who prefer dragging over the right stick. */
  _bindLookZone() {
    if (!this.lookZone) return;
    let id = null, lx = 0, ly = 0;
    const feed = (x, y, dx, dy) => {
      this.lookDelta.x += dx * 0.010;
      this.lookDelta.y += dy * 0.010;
    };
    this.lookZone.addEventListener('touchstart', e => {
      const t = e.changedTouches[0]; if (!t) return;
      id = t.identifier; lx = t.clientX; ly = t.clientY; e.preventDefault();
    }, { passive: false });
    this.lookZone.addEventListener('touchmove', e => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === id) { feed(t.clientX, t.clientY, t.clientX - lx, t.clientY - ly); lx = t.clientX; ly = t.clientY; }
      }
      e.preventDefault();
    }, { passive: false });
    const end = e => {
      for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === id) { id = null; break; }
    };
    this.lookZone.addEventListener('touchend', end);
    this.lookZone.addEventListener('touchcancel', end);
  }

  _bindFlareSelector() {
    const opts = document.querySelectorAll('.flare-opt');
    opts.forEach(el => {
      this._tap(el, () => {
        opts.forEach(o => o.classList.remove('active'));
        el.classList.add('active');
        this.flareType = el.dataset.flare;
        this.vibrate(15);
        this.emit('flareType', this.flareType);
      });
    });
  }

  /* Low level: one touch/click press on an element, with visual + haptic feedback. */
  _tap(el, fn) {
    if (!el) return;
    const fire = e => {
      el.classList.add('pressed');
      setTimeout(() => el.classList.remove('pressed'), 110);
      fn();
      if (e) e.preventDefault();
    };
    el.addEventListener('touchstart', fire, { passive: false });
    el.addEventListener('touchend', e => e.preventDefault(), { passive: false });
  }

  _bindTap(id, action, haptic) {
    const el = document.getElementById(id);
    if (!el) return;
    this._tap(el, () => { this.vibrate(haptic); this.emit(action); });
  }

  /* Held buttons: fire while the finger stays down (auto fire, ADS, sprint). */
  _bindHold(id, name, haptic) {
    const el = document.getElementById(id);
    if (!el) return;
    const down = e => {
      this.held[name] = true;
      el.classList.add('pressed');
      this.vibrate(haptic);
      this.emit(name + 'Start');
      if (e) e.preventDefault();
    };
    const up = () => {
      if (!this.held[name]) return;
      this.held[name] = false;
      el.classList.remove('pressed');
      this.emit(name + 'End');
    };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up);
    el.addEventListener('touchcancel', up);
  }

  /* Tap cycles the next gun, long press (500ms) opens the radial weapon wheel. */
  _bindWeaponButton() {
    const btn = document.getElementById('mWeapon');
    if (!btn || !this.wheel) return;
    let timer = null, id = null, sx = 0, sy = 0;

    const openWheel = () => {
      if (!this.weapons.length) return;
      this.wheelOpen = true;
      this.wheelIndex = -1;
      this._renderWheel();
      this.wheel.style.display = 'block';
      if (this.wheelHint) this.wheelHint.style.display = 'block';
      btn.classList.add('pressed');
      this.vibrate(30);
    };
    const closeWheel = () => {
      if (!this.wheelOpen) return;
      this.wheelOpen = false;
      this.wheel.style.display = 'none';
      if (this.wheelHint) this.wheelHint.style.display = 'none';
      btn.classList.remove('pressed');
      if (this.wheelIndex >= 0) {
        this.selWeaponIndex = this.wheelIndex;
        this.vibrate(20);
        this.emit('weapon', this.wheelIndex);
      }
      this.wheelIndex = -1;
    };
    const pick = (x, y) => {
      if (!this.wheelOpen || !this.weapons.length) return;
      const r = this.wheel.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = x - cx, dy = y - cy;
      if (Math.hypot(dx, dy) < 38) return;           // hub
      const ang = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
      const step = (Math.PI * 2) / this.weapons.length;
      const idx = Math.round(ang / step) % this.weapons.length;
      if (idx !== this.wheelIndex) {
        this.wheelIndex = idx;
        this.vibrate(8);
        this._renderWheel();
      }
    };

    {
      btn.addEventListener('touchstart', e => {
        const t = e.changedTouches[0]; if (!t) return;
        id = t.identifier; sx = t.clientX; sy = t.clientY;
        btn.classList.add('pressed');
        timer = setTimeout(openWheel, LONG_PRESS_MS);
        e.preventDefault();
      }, { passive: false });
      const move = e => {
        if (id === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const t = e.changedTouches[i];
          if (t.identifier !== id) continue;
          if (this.wheelOpen) pick(t.clientX, t.clientY);
          else if (Math.hypot(t.clientX - sx, t.clientY - sy) > 24) { clearTimeout(timer); timer = setTimeout(openWheel, 150); }
        }
        e.preventDefault();
      };
      btn.addEventListener('touchmove', move, { passive: false });
      const end = e => {
        if (id === null) return;
        for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === id) { id = null; break; }
        clearTimeout(timer);
        if (this.wheelOpen) closeWheel();
        else { btn.classList.remove('pressed'); this.emit('weapon', -1); }   // -1 = cycle next
      };
      btn.addEventListener('touchend', end);
      btn.addEventListener('touchcancel', end);
      // while the wheel is open the finger can travel over the whole screen
      this._wheelMove = e => { if (id !== null && this.wheelOpen) { for (let i = 0; i < e.changedTouches.length; i++) { const t = e.changedTouches[i]; if (t.identifier === id) pick(t.clientX, t.clientY); } e.preventDefault(); } };
      this._wheelEnd = e => { if (id === null) return; for (let i = 0; i < e.changedTouches.length; i++) if (e.changedTouches[i].identifier === id) { id = null; break; } clearTimeout(timer); if (this.wheelOpen) closeWheel(); };
      window.addEventListener('touchmove', this._wheelMove, { passive: false });
      window.addEventListener('touchend', this._wheelEnd);
      window.addEventListener('touchcancel', this._wheelEnd);
      // tapping a slot directly also works
      this.wheel.addEventListener('touchstart', e => {
        const slot = e.target.closest ? e.target.closest('.slot') : null;
        if (!slot) return;
        this.wheelIndex = parseInt(slot.dataset.idx, 10);
        closeWheel();
        e.preventDefault();
      }, { passive: false });
    }
  }

  _renderWheel() {
    const hub = this.wheel.querySelector('.hub');
    let html = hub ? hub.outerHTML : '';
    const n = this.weapons.length;
    const R = 108;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const x = 135 + Math.cos(a) * R, y = 135 + Math.sin(a) * R;
      const w = this.weapons[i];
      html += `<div class="slot ${i === this.wheelIndex ? 'sel' : ''}" data-idx="${i}" style="left:${x}px;top:${y}px">${w.short || w.name}</div>`;
    }
    this.wheel.innerHTML = html;
  }

  setWeapons(list) {
    this.weapons = list.slice(0, 8).map(g => ({ id: g.id, name: g.name, short: (g.name || '').split(' ')[0].slice(0, 9) }));
    if (this.wheelOpen) this._renderWheel();
  }

  /* ------------------------------------------------------------------ gyro */
  _bindGyroButton() {
    const btn = document.getElementById('tGyro');
    if (!btn) return;
    this._tap(btn, () => this.toggleGyro());
  }

  async toggleGyro(force) {
    const btn = document.getElementById('tGyro');
    const want = force !== undefined ? force : !this.gyroEnabled;
    if (want) {
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm !== 'granted') { this.emit('notify', 'GYRO PERMISSION DENIED'); return; }
        }
      } catch (e) { this.emit('notify', 'GYRO NOT AVAILABLE'); return; }
      this.gyroEnabled = true;
      this.gyroZero = null;                       // calibrate to the pose the phone is held in
      window.addEventListener('deviceorientation', this.onGyro, true);
      this.vibrate(25);
      if (btn) { btn.textContent = 'GYRO ON'; btn.classList.add('on'); }
      this.emit('notify', 'GYRO AIM ON - TILT TO AIM');
    } else {
      this.gyroEnabled = false;
      window.removeEventListener('deviceorientation', this.onGyro, true);
      if (btn) { btn.textContent = 'GYRO OFF'; btn.classList.remove('on'); }
    }
    this.emit('gyro', this.gyroEnabled);
  }

  onGyro(e) {
    if (!this.gyroEnabled) return;
    const gamma = e.gamma || 0, beta = e.beta || 0;
    if (this.gyroZero === null) { this.gyroZero = { g: gamma, b: beta }; return; }
    const dg = (gamma - this.gyroZero.g) * 0.012;
    const db = (beta - this.gyroZero.b) * 0.012;
    if (Math.abs(dg) > 0.02 || Math.abs(db) > 0.02) {
      this.lookDelta.x += dg * 0.06 * this.gyroScale;
      this.lookDelta.y += db * 0.06 * this.gyroScale;
    }
  }

  /* ------------------------------------------------------------------ api */
  getMove() { return this.moveVector; }
  isSprinting() { return this.held.sprint || this.moveMag > 0.92; }
  isDown(name) { return !!this.held[name]; }

  /* Look delta for this frame in radians: analog stick (rate x dt) + swipe/gyro impulses. */
  consumeLook(dt) {
    const s = this.sensitivity;
    const x = this.lookRate.x * 2.4 * (dt || 0.016) + this.lookDelta.x;
    const y = this.lookRate.y * 1.8 * (dt || 0.016) + this.lookDelta.y;
    this.lookDelta.x = 0; this.lookDelta.y = 0;
    return { x: x * s, y: y * s * (this.invertY ? -1 : 1) };
  }

  /* Auto-aim: score visible enemies inside 80m and return the best one. */
  getAutoAimTarget(camera, enemies, THREE, maxDist = 80) {
    if (!this.autoAim || !enemies || !enemies.length) return null;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    let best = null, bestScore = -1;
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (!e || e.health <= 0) continue;
      const toE = new THREE.Vector3().subVectors(e.group.position, camera.position);
      const dist = toE.length();
      if (dist > maxDist) continue;
      toE.divideScalar(dist || 1);
      const dot = camDir.dot(toE);
      if (dot < 0.7) continue;
      const score = dot * 2 - dist / maxDist;    // closest, most centred target wins
      if (score > bestScore) { bestScore = score; best = e; }
    }
    return best;
  }

  setFlareType(key) {
    this.flareType = key;
    document.querySelectorAll('.flare-opt').forEach(o => o.classList.toggle('active', o.dataset.flare === key));
  }

  /* Context sensitive USE button: ENTER VEHICLE / EXIT / SLEEP / GO */
  setContext(icon, label) {
    const el = document.getElementById('mVehicle');
    if (el) el.innerHTML = icon + (label ? `<div class="sub">${label}</div>` : '');
  }

  setActive(on) {
    this.active = on;
    if (!this.root) return;
    this.root.style.opacity = on ? '1' : '0';
    this.root.style.pointerEvents = on ? '' : 'none';
    if (!on) {
      this.held.shoot = this.held.aim = this.held.sprint = false;
      this.moveVector.x = this.moveVector.y = 0; this.moveMag = 0;
      this.lookRate.x = this.lookRate.y = 0;
      this.lookDelta.x = this.lookDelta.y = 0;
      if (this.wheel) this.wheel.style.display = 'none';
      this.wheelOpen = false;
    }
  }
}
