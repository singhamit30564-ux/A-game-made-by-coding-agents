// STEALTH RESILIENCE - MOBILE AAA CONTROLS
// Dual joystick + gyro + haptics + auto-aim for Galaxy F15 5G

export class MobileController {
  constructor() {
    this.isMobile = /Android|iPhone|iPad|iPod/.test(navigator.userAgent) || window.innerWidth <= 900;
    this.moveVector = {x:0,y:0};
    this.lookVector = {x:0,y:0};
    this.sensitivity = 1.2;
    this.gyroEnabled = false;
    this.autoAim = true;
    this.haptics = 'vibrate' in navigator;
    this.createUI();
    this.bindEvents();
  }

  createUI() {
    const container = document.getElementById('mobileControls');
    if(!container) return;

    // Redesign for AAA mobile
    container.innerHTML = `
      <!-- Left joystick - movement -->
      <div class="joy-wrapper" style="position:absolute;bottom:20px;left:20px;pointer-events:auto">
        <div style="font-family:'Orbitron';font-size:9px;color:rgba(255,255,255,0.5);text-align:center;margin-bottom:6px;letter-spacing:0.1em">MOVE</div>
        <div class="joystick" id="joyMove" style="width:130px;height:130px;background:radial-gradient(circle,rgba(255,255,255,0.08),rgba(0,0,0,0.3));border:1px solid rgba(0,255,136,0.25);border-radius:50%;position:relative;backdrop-filter:blur(10px);box-shadow:0 0 20px rgba(0,255,136,0.1), inset 0 0 20px rgba(0,0,0,0.5)">
          <div style="position:absolute;left:50%;top:50%;width:60%;height:60%;border:1px dashed rgba(0,255,136,0.15);border-radius:50%;transform:translate(-50%,-50%)"></div>
          <div class="joystick-knob" id="joyMoveKnob" style="position:absolute;left:50%;top:50%;width:56px;height:56px;background:radial-gradient(circle at 30% 30%, #00ff88, #00aa5a);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 4px 12px rgba(0,0,0,0.5),0 0 15px rgba(0,255,136,0.6);border:2px solid rgba(255,255,255,0.2)"></div>
          <div style="position:absolute;left:50%;top:8px;transform:translateX(-50%);font-size:10px;opacity:0.3">▲</div>
          <div style="position:absolute;left:50%;bottom:8px;transform:translateX(-50%);font-size:10px;opacity:0.3">▼</div>
          <div style="position:absolute;top:50%;left:8px;transform:translateY(-50%);font-size:10px;opacity:0.3">◀</div>
          <div style="position:absolute;top:50%;right:8px;transform:translateY(-50%);font-size:10px;opacity:0.3">▶</div>
        </div>
      </div>

      <!-- Right joystick - look -->
      <div class="joy-wrapper" style="position:absolute;bottom:20px;right:20px;pointer-events:auto">
        <div style="font-family:'Orbitron';font-size:9px;color:rgba(255,255,255,0.5);text-align:center;margin-bottom:6px;letter-spacing:0.1em">LOOK / AIM</div>
        <div class="joystick" id="joyLook" style="width:130px;height:130px;background:radial-gradient(circle,rgba(255,255,255,0.08),rgba(0,0,0,0.3));border:1px solid rgba(0,170,255,0.25);border-radius:50%;position:relative;backdrop-filter:blur(10px);box-shadow:0 0 20px rgba(0,170,255,0.1), inset 0 0 20px rgba(0,0,0,0.5)">
          <div style="position:absolute;left:50%;top:50%;width:60%;height:60%;border:1px dashed rgba(0,170,255,0.15);border-radius:50%;transform:translate(-50%,-50%)"></div>
          <div class="joystick-knob" id="joyLookKnob" style="position:absolute;left:50%;top:50%;width:56px;height:56px;background:radial-gradient(circle at 30% 30%, #00aaff, #0066aa);border-radius:50%;transform:translate(-50%,-50%);box-shadow:0 4px 12px rgba(0,0,0,0.5),0 0 15px rgba(0,170,255,0.6);border:2px solid rgba(255,255,255,0.2)"></div>
          <div style="position:absolute;left:50%;top:50%;width:20px;height:20px;border:1px solid rgba(255,255,255,0.2);border-radius:50%;transform:translate(-50%,-50%)"></div>
        </div>
      </div>

      <!-- Center action cluster -->
      <div style="position:absolute;bottom:180px;right:20px;display:flex;flex-direction:column;gap:10px;pointer-events:auto;align-items:center">
        <div style="display:flex;gap:10px">
          <div class="m-btn" id="mAim" style="width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 30% 30%, rgba(255,204,0,0.9), rgba(180,120,0,0.8));border:2px solid rgba(255,204,0,0.5);color:#000;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 15px rgba(255,204,0,0.4);font-family:'Orbitron';font-size:10px">AIM</div>
          <div class="m-btn" id="mShoot" style="width:84px;height:84px;border-radius:50%;background:radial-gradient(circle at 30% 30%, #ff2040, #aa0011);border:2px solid rgba(255,32,64,0.6);color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(255,32,64,0.5);font-size:22px">◉</div>
        </div>
        <div style="display:flex;gap:8px">
          <div class="m-btn" id="mJump" style="width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;backdrop-filter:blur(10px)">⬆</div>
          <div class="m-btn" id="mCrouch" style="width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(0,255,136,0.3);color:#00ff88;display:flex;align-items:center;justify-content:center;font-size:16px;backdrop-filter:blur(10px)">◐</div>
          <div class="m-btn" id="mReload" style="width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px;backdrop-filter:blur(10px)">↻</div>
          <div class="m-btn" id="mSprint" style="width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,0.6);border:1px solid rgba(255,204,0,0.3);color:#ffcc00;display:flex;align-items:center;justify-content:center;font-size:16px;backdrop-filter:blur(10px)">⚡</div>
        </div>
        <div style="display:flex;gap:8px">
          <div class="m-btn" id="mGrenade" style="width:48px;height:48px;border-radius:12px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,32,64,0.3);color:#ff6644;display:flex;align-items:center;justify-content:center;font-size:14px;backdrop-filter:blur(10px)">💣</div>
          <div class="m-btn" id="mMine" style="width:48px;height:48px;border-radius:12px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.2);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;backdrop-filter:blur(10px)">💥</div>
          <div class="m-btn" id="mVehicle" style="width:48px;height:48px;border-radius:12px;background:rgba(0,0,0,0.6);border:1px solid rgba(0,170,255,0.3);color:#00aaff;display:flex;align-items:center;justify-content:center;font-size:18px;backdrop-filter:blur(10px)">🚗</div>
          <div class="m-btn" id="mWeapon" style="width:48px;height:48px;border-radius:12px;background:rgba(0,0,0,0.6);border:1px solid rgba(0,255,136,0.3);color:#00ff88;display:flex;align-items:center;justify-content:center;font-size:14px;backdrop-filter:blur(10px)">🔫</div>
        </div>
      </div>

      <!-- Top mobile bar -->
      <div style="position:absolute;top:10px;left:10px;right:10px;display:flex;justify-content:space-between;pointer-events:auto;gap:8px">
        <div style="display:flex;gap:8px">
          <button id="mMap" style="padding:8px 14px;background:rgba(0,0,0,0.6);border:1px solid rgba(0,255,136,0.3);color:#00ff88;font-family:'Orbitron';font-size:10px;border-radius:20px;backdrop-filter:blur(10px)">MAP [M]</button>
          <button id="mArmoury" style="padding:8px 14px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,204,0,0.3);color:#ffcc00;font-family:'Orbitron';font-size:10px;border-radius:20px;backdrop-filter:blur(10px)">GUNS [TAB]</button>
          <button id="mGyro" style="padding:8px 14px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);color:#fff;font-family:'Orbitron';font-size:10px;border-radius:20px;backdrop-filter:blur(10px)">GYRO OFF</button>
        </div>
        <div style="display:flex;gap:8px">
          <button id="mCutscene" style="padding:8px 14px;background:rgba(0,0,0,0.6);border:1px solid rgba(160,32,240,0.3);color:#a020f0;font-family:'Orbitron';font-size:10px;border-radius:20px;backdrop-filter:blur(10px)">CUTSCENE 🎬</button>
          <button id="mSettings" style="padding:8px 14px;background:rgba(0,0,0,0.6);border:1px solid rgba(255,255,255,0.1);color:#fff;font-family:'Orbitron';font-size:10px;border-radius:20px;backdrop-filter:blur(10px)">⚙</button>
        </div>
      </div>

      <!-- Touch look zone (invisible) -->
      <div id="touchLookZone" style="position:absolute;top:0;right:0;width:50%;height:100%;pointer-events:auto"></div>
    `;

    // Show on mobile or if forced
    if(this.isMobile) {
      container.style.display = 'block';
      document.body.classList.add('mobile-mode');
    }
  }

  bindEvents() {
    // Move joystick
    this.bindJoystick('joyMove', 'joyMoveKnob', (vec)=>{
      this.moveVector = vec;
      // Haptic tick
      if(this.haptics && (Math.abs(vec.x)>0.8 || Math.abs(vec.y)>0.8)) {
        navigator.vibrate(10);
      }
    });

    // Look joystick
    this.bindJoystick('joyLook', 'joyLookKnob', (vec)=>{
      this.lookVector = vec;
    });

    // Touch look zone - swipe to look
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
        this.lookVector = {x: dx*0.02, y: dy*0.02};
        lastX=e.touches[0].clientX;
        lastY=e.touches[0].clientY;
        // Auto decay
        setTimeout(()=>{ this.lookVector={x:0,y:0}; },100);
        e.preventDefault();
      }, {passive:false});
      lookZone.addEventListener('touchend', ()=>{
        active=false;
        this.lookVector={x:0,y:0};
      });
    }

    // Buttons - will be bound in main.js via IDs
    // Gyro
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
        } else {
          window.removeEventListener('deviceorientation', this.onGyro.bind(this));
          this.gyroEnabled=false;
          gyroBtn.textContent='GYRO OFF';
          gyroBtn.style.borderColor='rgba(255,255,255,0.1)';
          gyroBtn.style.color='#fff';
        }
      });
    }
  }

  bindJoystick(baseId, knobId, onMove) {
    const base = document.getElementById(baseId);
    const knob = document.getElementById(knobId);
    if(!base || !knob) return;

    let active=false, startX=0, startY=0, baseRect=null;

    const getCenter = () => {
      const rect = base.getBoundingClientRect();
      return {x: rect.left + rect.width/2, y: rect.top + rect.height/2, radius: rect.width/2};
    };

    base.addEventListener('touchstart', e=>{
      active=true;
      baseRect = getCenter();
      e.preventDefault();
    }, {passive:false});

    base.addEventListener('touchmove', e=>{
      if(!active) return;
      const t = e.touches[0];
      const dx = t.clientX - baseRect.x;
      const dy = t.clientY - baseRect.y;
      const dist = Math.min(baseRect.radius*0.7, Math.hypot(dx,dy));
      const ang = Math.atan2(dy,dx);
      const nx = Math.cos(ang)*dist;
      const ny = Math.sin(ang)*dist;
      knob.style.transform = `translate(calc(-50% + ${nx}px), calc(-50% + ${ny}px))`;
      // Normalize -1 to 1
      onMove({x: nx/(baseRect.radius*0.7), y: ny/(baseRect.radius*0.7)});
      e.preventDefault();
    }, {passive:false});

    const end = ()=>{
      if(!active) return;
      active=false;
      knob.style.transform='translate(-50%,-50%)';
      onMove({x:0,y:0});
    };
    base.addEventListener('touchend', end);
    base.addEventListener('touchcancel', end);
  }

  onGyro(e) {
    if(!this.gyroEnabled) return;
    // Use gamma (left/right) and beta (up/down)
    const x = (e.gamma || 0) * 0.01; // left/right tilt
    const y = (e.beta || 0) * 0.01; // front/back tilt
    // Deadzone
    if(Math.abs(x)>0.05 || Math.abs(y)>0.05) {
      this.lookVector = {x: x*0.5, y: y*0.3};
      setTimeout(()=>{ this.lookVector={x:0,y:0}; },50);
    }
  }

  getMoveInput(keys) {
    // Merge joystick + keyboard
    if(Math.abs(this.moveVector.x)>0.1) {
      keys['KeyA'] = this.moveVector.x < -0.2;
      keys['KeyD'] = this.moveVector.x > 0.2;
    }
    if(Math.abs(this.moveVector.y)>0.1) {
      keys['KeyW'] = this.moveVector.y < -0.2;
      keys['KeyS'] = this.moveVector.y > 0.2;
    }
    return this.moveVector;
  }

  getLookInput() {
    return this.lookVector;
  }

  vibrate(pattern) {
    if(this.haptics) navigator.vibrate(pattern);
  }

  // Auto-aim assist for mobile
  getAutoAimTarget(camera, enemies, maxDist=80) {
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
      if(dot>0.7) {
        const score = dot - dist*0.001;
        if(score>bestScore){ bestScore=score; best=e; }
      }
    });
    return best;
  }
}

// Mock THREE for auto-aim - will be injected
let THREE = null;
export function setThreeInstance(t){ THREE=t; }
