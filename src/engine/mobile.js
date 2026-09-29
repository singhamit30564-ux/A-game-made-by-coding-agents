// STEALTH RESILIENCE - MOBILE AAA CONTROLS v2 + FLARES
// Dual joystick + gyro + haptics + auto-aim + flares for Galaxy F15 5G

export class MobileController {
  constructor() {
    this.isMobile = /Android|iPhone|iPad|iPod/.test(navigator.userAgent) || window.innerWidth <= 900;
    this.moveVector = {x:0,y:0};
    this.lookVector = {x:0,y:0};
    this.sensitivity = 1.2;
    this.gyroEnabled = false;
    this.autoAim = true;
    this.haptics = 'vibrate' in navigator;
    this.flareType = 'signal_red';
    this.buttonSize = 1; // scale
    this.opacity = 0.9;
    this.createUI();
    this.bindEvents();
  }

  createUI() {
    const container = document.getElementById('mobileControls');
    if(!container) return;

    container.innerHTML = `
      <!-- Left joystick - movement -->
      <div class="joy-wrapper" style="position:absolute;bottom:16px;left:16px;pointer-events:auto">
        <div style="font-family:'Orbitron';font-size:8px;color:rgba(255,255,255,0.45);text-align:center;margin-bottom:4px;letter-spacing:0.12em">◉ MOVE</div>
        <div class="joystick" id="joyMove" style="width:132px;height:132px;background:radial-gradient(circle at 30% 30%, rgba(255,255,255,0.09), rgba(0,0,0,0.35));border:1px solid rgba(0,255,136,0.3);border-radius:50%;position:relative;backdrop-filter:blur(12px);box-shadow:0 0 24px rgba(0,255,136,0.12), inset 0 0 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)">
          <div style="position:absolute;left:50%;top:50%;width:62%;height:62%;border:1px dashed rgba(0,255,136,0.18);border-radius:50%;transform:translate(-50%,-50%)"></div>
          <div style="position:absolute;left:50%;top:50%;width:38%;height:38%;background:rgba(0,255,136,0.04);border-radius:50%;transform:translate(-50%,-50%)"></div>
          <div class="joystick-knob" id="joyMoveKnob" style="position:absolute;left:50%;top:50%;width:58px;height:58px;background:radial-gradient(circle at 32% 28%, #00ff88 0%, #00cc6a 40%, #00994a 100%);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 5px 14px rgba(0,0,0,0.6),0 0 18px rgba(0,255,136,0.7), inset 0 2px 2px rgba(255,255,255,0.4);border:2px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:10px">✦</div>
          <div style="position:absolute;left:50%;top:7px;transform:translateX(-50%);font-size:9px;opacity:0.35;color:#00ff88">▲</div>
          <div style="position:absolute;left:50%;bottom:7px;transform:translateX(-50%);font-size:9px;opacity:0.35;color:#00ff88">▼</div>
          <div style="position:absolute;top:50%;left:7px;transform:translateY(-50%);font-size:9px;opacity:0.35;color:#00ff88">◀</div>
          <div style="position:absolute;top:50%;right:7px;transform:translateY(-50%);font-size:9px;opacity:0.35;color:#00ff88">▶</div>
        </div>
        <div style="display:flex;gap:4px;justify-content:center;margin-top:6px">
          <div class="m-btn" id="mSprint" style="width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(255,204,0,0.35);color:#ffcc00;display:flex;align-items:center;justify-content:center;font-size:12px;backdrop-filter:blur(8px)">⚡</div>
          <div class="m-btn" id="mCrouch" style="width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(0,255,136,0.35);color:#00ff88;display:flex;align-items:center;justify-content:center;font-size:12px;backdrop-filter:blur(8px)">◐</div>
          <div class="m-btn" id="mJump" style="width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;backdrop-filter:blur(8px)">⬆</div>
        </div>
      </div>

      <!-- Right joystick - look -->
      <div class="joy-wrapper" style="position:absolute;bottom:16px;right:16px;pointer-events:auto">
        <div style="font-family:'Orbitron';font-size:8px;color:rgba(255,255,255,0.45);text-align:center;margin-bottom:4px;letter-spacing:0.12em">◎ LOOK / AIM</div>
        <div class="joystick" id="joyLook" style="width:132px;height:132px;background:radial-gradient(circle at 30% 30%, rgba(255,255,255,0.09), rgba(0,0,0,0.35));border:1px solid rgba(0,170,255,0.3);border-radius:50%;position:relative;backdrop-filter:blur(12px);box-shadow:0 0 24px rgba(0,170,255,0.12), inset 0 0 24px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)">
          <div style="position:absolute;left:50%;top:50%;width:62%;height:62%;border:1px dashed rgba(0,170,255,0.18);border-radius:50%;transform:translate(-50%,-50%)"></div>
          <div style="position:absolute;left:50%;top:50%;width:38%;height:38%;background:rgba(0,170,255,0.04);border-radius:50%;transform:translate(-50%,-50%)"></div>
          <div class="joystick-knob" id="joyLookKnob" style="position:absolute;left:50%;top:50%;width:58px;height:58px;background:radial-gradient(circle at 32% 28%, #00aaff 0%, #0088cc 40%, #006699 100%);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 5px 14px rgba(0,0,0,0.6),0 0 18px rgba(0,170,255,0.7), inset 0 2px 2px rgba(255,255,255,0.4);border:2px solid rgba(255,255,255,0.25);display:flex;align-items:center;justify-content:center;font-size:14px">◉</div>
          <div style="position:absolute;left:50%;top:50%;width:22px;height:22px;border:1px solid rgba(255,255,255,0.25);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none"></div>
          <div style="position:absolute;left:50%;top:50%;width:44px;height:1px;background:rgba(255,255,255,0.15);transform:translate(-50%,-50%);pointer-events:none"></div>
          <div style="position:absolute;left:50%;top:50%;width:1px;height:44px;background:rgba(255,255,255,0.15);transform:translate(-50%,-50%);pointer-events:none"></div>
        </div>
        <div style="display:flex;gap:4px;justify-content:center;margin-top:6px">
          <div class="m-btn" id="mReload" style="width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;backdrop-filter:blur(8px)">↻</div>
          <div class="m-btn" id="mWeapon" style="width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(0,255,136,0.35);color:#00ff88;display:flex;align-items:center;justify-content:center;font-size:11px;backdrop-filter:blur(8px)">🔫</div>
          <div class="m-btn" id="mVehicle" style="width:38px;height:38px;border-radius:50%;background:rgba(0,0,0,0.55);border:1px solid rgba(0,170,255,0.35);color:#00aaff;display:flex;align-items:center;justify-content:center;font-size:12px;backdrop-filter:blur(8px)">🚗</div>
        </div>
      </div>

      <!-- Center RIGHT action cluster - SHOOT + FLARES -->
      <div style="position:absolute;bottom:170px;right:16px;display:flex;flex-direction:column;gap:8px;pointer-events:auto;align-items:center">
        <!-- Flare selector -->
        <div style="display:flex;gap:4px;background:rgba(0,0,0,0.5);border:1px solid rgba(255,100,0,0.25);border-radius:20px;padding:4px 6px;backdrop-filter:blur(10px)">
          <div class="m-btn flare-opt active" data-flare="signal_red" style="width:26px;height:26px;border-radius:50%;background:#ff2040;border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:8px;box-shadow:0 0 8px #ff2040">R</div>
          <div class="m-btn flare-opt" data-flare="signal_green" style="width:26px;height:26px;border-radius:50%;background:#00ff88;border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:#000;box-shadow:0 0 8px #00ff88">G</div>
          <div class="m-btn flare-opt" data-flare="signal_white" style="width:26px;height:26px;border-radius:50%;background:#fff;border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:#000;box-shadow:0 0 8px #fff">W</div>
          <div class="m-btn flare-opt" data-flare="illumination" style="width:26px;height:26px;border-radius:50%;background:radial-gradient(circle,#ffffaa,#ffcc00);border:1px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:8px;color:#000;box-shadow:0 0 10px #ffcc00">☀</div>
          <div class="m-btn flare-opt" data-flare="smoke_red" style="width:26px;height:26px;border-radius:50%;background:rgba(255,32,64,0.6);border:1px dashed rgba(255,255,255,0.4);display:flex;align-items:center;justify-content:center;font-size:9px">💨</div>
        </div>
        
        <div style="display:flex;gap:8px;align-items:end">
          <div style="display:flex;flex-direction:column;gap:6px">
            <div class="m-btn" id="mFlare" style="width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 30% 30%, #ff6600, #cc3300);border:2px solid rgba(255,102,0,0.6);color:#fff;font-weight:900;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 5px 18px rgba(255,102,0,0.5);font-family:'Orbitron';font-size:9px;line-height:1">🚀<span style="font-size:7px;margin-top:1px">FLARE</span></div>
            <div class="m-btn" id="mGrenade" style="width:44px;height:44px;border-radius:12px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,32,64,0.35);color:#ff6644;display:flex;align-items:center;justify-content:center;font-size:13px;backdrop-filter:blur(8px)">💣</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:center">
            <div class="m-btn" id="mAim" style="width:60px;height:60px;border-radius:50%;background:radial-gradient(circle at 30% 30%, rgba(255,204,0,0.95), rgba(180,120,0,0.9));border:2px solid rgba(255,204,0,0.6);color:#000;font-weight:900;display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(255,204,0,0.45);font-family:'Orbitron';font-size:9px">◉<span style="font-size:7px">AIM</span></div>
            <div class="m-btn" id="mShoot" style="width:88px;height:88px;border-radius:50%;background:radial-gradient(circle at 32% 28%, #ff3040 0%, #ff2040 30%, #aa0011 100%);border:2px solid rgba(255,32,64,0.7);color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 7px 22px rgba(255,32,64,0.55), inset 0 2px 3px rgba(255,255,255,0.3);font-size:24px;position:relative">◉<div style="position:absolute;bottom:10px;font-size:7px;font-family:Orbitron;letter-spacing:0.1em;opacity:0.9">FIRE</div></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <div class="m-btn" id="mMine" style="width:44px;height:44px;border-radius:12px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;backdrop-filter:blur(8px)">💥</div>
            <div class="m-btn" id="mWork" style="width:44px;height:44px;border-radius:12px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,204,0,0.35);color:#ffcc00;display:flex;align-items:center;justify-content:center;font-size:13px;backdrop-filter:blur(8px)">⏰</div>
          </div>
        </div>
      </div>

      <!-- Top mobile bar - improved -->
      <div style="position:absolute;top:8px;left:8px;right:8px;display:flex;justify-content:space-between;pointer-events:auto;gap:6px;flex-wrap:wrap">
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          <button id="mMap" style="padding:6px 12px;background:rgba(0,0,0,0.6);border:1px solid rgba(0,255,136,0.35);color:#00ff88;font-family:'Orbitron';font-size:9px;border-radius:20px;backdrop-filter:blur(10px);display:flex;align-items:center;gap:4px">🗺 MAP</button>
          <button id="mArmoury" style="padding:6px 12px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,204,0,0.35);color:#ffcc00;font-family:'Orbitron';font-size:9px;border-radius:20px;backdrop-filter:blur(10px)">🔫 GUNS</button>
          <button id="mFlares" style="padding:6px 12px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,102,0,0.35);color:#ff6600;font-family:'Orbitron';font-size:9px;border-radius:20px;backdrop-filter:blur(10px)">🚀 FLARES</button>
          <button id="mGyro" style="padding:6px 10px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.12);color:#fff;font-family:'Orbitron';font-size:8px;border-radius:20px;backdrop-filter:blur(10px)">GYRO OFF</button>
        </div>
        <div style="display:flex;gap:6px">
          <button id="mCutscene" style="padding:6px 10px;background:rgba(0,0,0,0.6);border:1px solid rgba(160,32,240,0.35);color:#a020f0;font-family:'Orbitron';font-size:8px;border-radius:20px;backdrop-filter:blur(10px)">🎬</button>
          <button id="mSettings" style="padding:6px 10px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.12);color:#fff;font-family:'Orbitron';font-size:9px;border-radius:20px;backdrop-filter:blur(10px)">⚙</button>
        </div>
      </div>

      <!-- Touch look zone -->
      <div id="touchLookZone" style="position:absolute;top:0;right:0;width:50%;height:100%;pointer-events:auto"></div>

      <!-- Mobile weapon wheel (hidden by default) -->
      <div id="mWeaponWheel" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:200px;height:200px;pointer-events:auto;display:none;z-index:10">
        <div style="position:absolute;left:50%;top:50%;width:100%;height:100%;transform:translate(-50%,-50%)">
          <div class="m-btn wheel-opt" data-slot="0" style="position:absolute;left:50%;top:0;transform:translate(-50%,0);width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.8);border:1px solid #00ff88;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px">1</div>
          <div class="m-btn wheel-opt" data-slot="1" style="position:absolute;right:0;top:50%;transform:translate(0,-50%);width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.8);border:1px solid #00ff88;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px">2</div>
          <div class="m-btn wheel-opt" data-slot="2" style="position:absolute;left:50%;bottom:0;transform:translate(-50%,0);width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.8);border:1px solid #00ff88;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px">3</div>
          <div class="m-btn wheel-opt" data-slot="3" style="position:absolute;left:0;top:50%;transform:translate(0,-50%);width:50px;height:50px;border-radius:50%;background:rgba(0,0,0,0.8);border:1px solid #00ff88;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px">4</div>
          <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:rgba(0,255,136,0.15);border:1px solid #00ff88;display:flex;align-items:center;justify-content:center;font-family:Orbitron;font-size:8px;color:#00ff88">GUNS</div>
        </div>
      </div>
    `;

    if(this.isMobile) {
      container.style.display = 'block';
      document.body.classList.add('mobile-mode');
    }
  }

  bindEvents() {
    this.bindJoystick('joyMove', 'joyMoveKnob', (vec)=>{
      this.moveVector = vec;
      if(this.haptics && (Math.abs(vec.x)>0.85 || Math.abs(vec.y)>0.85)) {
        navigator.vibrate(12);
      }
    });

    this.bindJoystick('joyLook', 'joyLookKnob', (vec)=>{
      this.lookVector = vec;
    });

    // Flare selector
    document.querySelectorAll('.flare-opt').forEach(el=>{
      el.addEventListener('touchstart', e=>{
        document.querySelectorAll('.flare-opt').forEach(o=>o.classList.remove('active'));
        el.classList.add('active');
        el.style.transform='scale(1.2)';
        setTimeout(()=>el.style.transform='',150);
        this.flareType = el.dataset.flare;
        if(this.haptics) navigator.vibrate(15);
        e.preventDefault();
      }, {passive:false});
      el.addEventListener('mousedown', ()=>{
        document.querySelectorAll('.flare-opt').forEach(o=>o.classList.remove('active'));
        el.classList.add('active');
        this.flareType = el.dataset.flare;
      });
    });

    const lookZone = document.getElementById('touchLookZone');
    if(lookZone) {
      let lastX=0, lastY=0, active=false;
      lookZone.addEventListener('touchstart', e=>{
        active=true;
        lastX=e.touches[0].clientX;
        lastY=e.touches[0].clientY;
        e.preventDefault();
      }, {passive:false});
      lookZone.addEventListener('touchmove', e=>{
        if(!active) return;
        const dx = e.touches[0].clientX - lastX;
        const dy = e.touches[0].clientY - lastY;
        this.lookVector = {x: dx*0.022, y: dy*0.022};
        lastX=e.touches[0].clientX;
        lastY=e.touches[0].clientY;
        setTimeout(()=>{ this.lookVector={x:0,y:0}; },90);
        e.preventDefault();
      }, {passive:false});
      lookZone.addEventListener('touchend', ()=>{
        active=false;
        this.lookVector={x:0,y:0};
      });
    }

    const gyroBtn = document.getElementById('mGyro');
    if(gyroBtn) {
      gyroBtn.addEventListener('click', async ()=>{
        if(!this.gyroEnabled) {
          if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            const perm = await DeviceOrientationEvent.requestPermission();
            if(perm!=='granted') return;
          }
          window.addEventListener('deviceorientation', this.onGyro.bind(this));
          this.gyroEnabled=true;
          gyroBtn.textContent='GYRO ON';
          gyroBtn.style.borderColor='#00ff88';
          gyroBtn.style.color='#00ff88';
          gyroBtn.style.boxShadow='0 0 10px rgba(0,255,136,0.3)';
        } else {
          window.removeEventListener('deviceorientation', this.onGyro.bind(this));
          this.gyroEnabled=false;
          gyroBtn.textContent='GYRO OFF';
          gyroBtn.style.borderColor='rgba(255,255,255,0.12)';
          gyroBtn.style.color='#fff';
          gyroBtn.style.boxShadow='none';
        }
      });
    }

    // Weapon wheel long press
    const weaponBtn = document.getElementById('mWeapon');
    const wheel = document.getElementById('mWeaponWheel');
    if(weaponBtn && wheel){
      let pressTimer=null;
      weaponBtn.addEventListener('touchstart', e=>{
        pressTimer=setTimeout(()=>{
          wheel.style.display='block';
          if(this.haptics) navigator.vibrate(30);
        },500);
        e.preventDefault();
      }, {passive:false});
      weaponBtn.addEventListener('touchend', ()=>{
        clearTimeout(pressTimer);
        setTimeout(()=>{ wheel.style.display='none'; },200);
      });
      wheel.querySelectorAll('.wheel-opt').forEach(opt=>{
        opt.addEventListener('touchstart', e=>{
          const slot=parseInt(opt.dataset.slot);
          window.dispatchEvent(new CustomEvent('mobileWeaponSwitch', {detail:{slot}}));
          wheel.style.display='none';
          if(this.haptics) navigator.vibrate(20);
          e.preventDefault();
        }, {passive:false});
      });
    }
  }

  bindJoystick(baseId, knobId, onMove) {
    const base = document.getElementById(baseId);
    const knob = document.getElementById(knobId);
    if(!base || !knob) return;

    let active=false, baseRect=null;

    const getCenter = () => {
      const rect = base.getBoundingClientRect();
      return {x: rect.left + rect.width/2, y: rect.top + rect.height/2, radius: rect.width/2};
    };

    base.addEventListener('touchstart', e=>{
      active=true;
      baseRect = getCenter();
      base.style.transform='scale(1.05)';
      base.style.boxShadow='0 0 30px rgba(0,255,136,0.2), inset 0 0 24px rgba(0,0,0,0.6)';
      e.preventDefault();
    }, {passive:false});

    base.addEventListener('touchmove', e=>{
      if(!active) return;
      const t = e.touches[0];
      const dx = t.clientX - baseRect.x;
      const dy = t.clientY - baseRect.y;
      const dist = Math.min(baseRect.radius*0.72, Math.hypot(dx,dy));
      const ang = Math.atan2(dy,dx);
      const nx = Math.cos(ang)*dist;
      const ny = Math.sin(ang)*dist;
      knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
      onMove({x: nx/(baseRect.radius*0.72), y: ny/(baseRect.radius*0.72)});
      e.preventDefault();
    }, {passive:false});

    const end = ()=>{
      if(!active) return;
      active=false;
      base.style.transform='scale(1)';
      base.style.boxShadow='';
      knob.style.transform='translate(-50%,-50%)';
      onMove({x:0,y:0});
    };
    base.addEventListener('touchend', end);
    base.addEventListener('touchcancel', end);
  }

  onGyro(e) {
    if(!this.gyroEnabled) return;
    const x = (e.gamma || 0) * 0.012;
    const y = (e.beta || 0) * 0.012;
    if(Math.abs(x)>0.04 || Math.abs(y)>0.04) {
      this.lookVector = {x: x*0.6, y: y*0.35};
      setTimeout(()=>{ this.lookVector={x:0,y:0}; },60);
    }
  }

  getMoveInput(keys) {
    if(Math.abs(this.moveVector.x)>0.12) {
      keys['KeyA'] = this.moveVector.x < -0.18;
      keys['KeyD'] = this.moveVector.x > 0.18;
    }
    if(Math.abs(this.moveVector.y)>0.12) {
      keys['KeyW'] = this.moveVector.y < -0.18;
      keys['KeyS'] = this.moveVector.y > 0.18;
    }
    return this.moveVector;
  }

  getLookInput() {
    return this.lookVector;
  }

  vibrate(pattern) {
    if(this.haptics) navigator.vibrate(pattern);
  }

  getAutoAimTarget(camera, enemies, maxDist=85) {
    if(!this.autoAim) return null;
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    let best=null, bestScore=-1;
    enemies.forEach(e=>{
      if(e.health<=0) return;
      const toEnemy = new THREE.Vector3().subVectors(e.group.position, camera.position);
      const dist = toEnemy.length();
      if(dist>maxDist) return;
      toEnemy.normalize();
      const dot = camDir.dot(toEnemy);
      if(dot>0.68) {
        const score = dot - dist*0.0012;
        if(score>bestScore){ bestScore=score; best=e; }
      }
    });
    return best;
  }

  getFlareType(){ return this.flareType; }
}

let THREE = null;
export function setThreeInstance(t){ THREE=t; }
