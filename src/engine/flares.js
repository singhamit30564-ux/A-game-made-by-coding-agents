// STEALTH RESILIENCE - AAA FLARE SYSTEM
// Signal, illumination, smoke, emergency flares for night ops + marking targets

import * as THREE from 'three';

export const FLARE_TYPES = {
  signal_red: {name:"Signal Flare RED", color:0xff2040, lightColor:0xff2040, intensity:3, duration:30, desc:"Emergency - Mark enemy position, call for fire", price:150},
  signal_green: {name:"Signal Flare GREEN", color:0x00ff88, lightColor:0x00ff88, intensity:3, duration:30, desc:"Safe zone - Mark extraction, friendly", price:150},
  signal_white: {name:"Signal Flare WHITE", color:0xffffff, lightColor:0xffffff, intensity:4, duration:25, desc:"Illumination - Light up 100m area", price:200},
  illumination: {name:"Illumination Flare 60k", color:0xffffaa, lightColor:0xffffcc, intensity:5, duration:45, desc:"Parachute flare - 60,000 candlepower, 45 sec, 200m", price:300},
  smoke_red: {name:"Smoke RED", color:0xff2040, lightColor:0xff2040, intensity:1, duration:60, desc:"Red smoke - Mark target for airstrike", price:100},
  smoke_green: {name:"Smoke GREEN", color:0x00ff88, lightColor:0x00ff88, intensity:1, duration:60, desc:"Green smoke - Mark LZ for chopper", price:100},
  smoke_white: {name:"Smoke WHITE", color:0xffffff, lightColor:0xaaaaaa, intensity:0.5, duration:50, desc:"White smoke - Concealment", price:80},
  distress: {name:"Distress Flare SOS", color:0xff6600, lightColor:0xff6600, intensity:2, duration:20, desc:"SOS - Call rescue, 3x burst", price:250},
  ir_strobe: {name:"IR Strobe (Night Vision)", color:0x8800ff, lightColor:0x8800ff, intensity:1, duration:120, desc:"IR only - Visible with NVG, stealth marking", price:400},
  flare_gun: {name:"Flare Gun M79", color:0xffaa00, lightColor:0xffaa00, intensity:2, duration:15, desc:"Launch any flare 150m", price:500},
};

export class FlareManager {
  constructor(scene) {
    this.scene = scene;
    this.activeFlares = [];
    this.flareCount = 0;
  }

  launch(pos, dir, typeKey='signal_red', velocity=25) {
    const type = FLARE_TYPES[typeKey];
    if(!type) return null;

    // Flare projectile mesh - glowing sphere with trail
    const group = new THREE.Group();
    
    // Core
    const coreGeo = new THREE.SphereGeometry(0.15, 8, 8);
    const coreMat = new THREE.MeshBasicMaterial({color: type.color});
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Glow sprite
    const canvas = document.createElement('canvas'); canvas.width=64; canvas.height=64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32,32,0,32,32,32);
    grad.addColorStop(0, `rgba(${(type.color>>16)&255},${(type.color>>8)&255},${type.color&255},1)`);
    grad.addColorStop(0.3, `rgba(${(type.color>>16)&255},${(type.color>>8)&255},${type.color&255},0.6)`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle=grad; ctx.fillRect(0,0,64,64);
    const tex = new THREE.CanvasTexture(canvas);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, transparent:true, blending:THREE.AdditiveBlending}));
    glow.scale.set(2,2,1);
    group.add(glow);

    group.position.copy(pos);
    this.scene.add(group);

    // Light
    const light = new THREE.PointLight(type.lightColor, type.intensity, 150);
    light.position.copy(pos);
    this.scene.add(light);

    // Physics
    const flare = {
      group, core, glow, light,
      type, typeKey,
      vel: dir.clone().multiplyScalar(velocity).add(new THREE.Vector3(0,8,0)),
      life: type.duration,
      maxLife: type.duration,
      state: 'rising', // rising, falling, landed, parachute
      trail: [],
      smokeTrail: [],
      parachute: null,
      id: ++this.flareCount
    };

    // Parachute for illumination
    if(typeKey==='illumination' || typeKey==='signal_white'){
      const paraGeo = new THREE.ConeGeometry(1.5,1,6,1,true);
      const paraMat = new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide, transparent:true, opacity:0.7});
      const para = new THREE.Mesh(paraGeo, paraMat);
      para.position.y=1.5;
      para.rotation.x=Math.PI;
      group.add(para);
      flare.parachute = para;
      flare.state='parachute';
    }

    this.activeFlares.push(flare);
    return flare;
  }

  update(dt, particlesCallback) {
    for(let i=this.activeFlares.length-1;i>=0;i--){
      const f = this.activeFlares[i];
      f.life-=dt;

      // Physics
      if(f.state==='rising' || f.state==='parachute'){
        f.vel.y -= 9.8*dt*0.6; // gravity reduced for flare
        if(f.parachute){
          f.vel.y = Math.max(-2, f.vel.y); // slow fall
          f.vel.x*=0.99; f.vel.z*=0.99; // air resistance
        }
        f.group.position.add(f.vel.clone().multiplyScalar(dt));
        f.light.position.copy(f.group.position);

        // Trail
        if(Math.random()<0.7){
          f.trail.push({pos:f.group.position.clone(), life:1});
          if(particlesCallback){
            // Smoke trail
            particlesCallback(f.group.position.clone(), f.type.color, 0.15, f.typeKey.includes('smoke')?0.8:0.3);
          }
        }

        // Check apex - switch to falling
        if(f.vel.y<0 && f.state==='rising'){
          f.state='falling';
        }

        // Ground hit
        if(f.group.position.y<=0.3){
          f.group.position.y=0.3;
          f.state='landed';
          f.vel.set(0,0,0);
          if(f.parachute){
            f.group.remove(f.parachute);
            f.parachute=null;
          }
          // Ground smoke for smoke flares
          if(f.typeKey.includes('smoke')){
            f.light.intensity*=0.3;
          }
        }
      }

      // Flicker
      f.light.intensity = f.type.intensity * (0.8 + Math.sin(Date.now()*0.01 + f.id)*0.2) * (f.life/f.maxLife);
      f.glow.material.opacity = 0.8 * (f.life/f.maxLife);
      f.core.scale.setScalar(1 + Math.sin(Date.now()*0.02)*0.2);

      // Smoke column for landed smoke flares
      if(f.state==='landed' && f.typeKey.includes('smoke') && Math.random()<0.3){
        if(particlesCallback){
          const smokePos = f.group.position.clone().add(new THREE.Vector3((Math.random()-0.5)*1, Math.random()*3, (Math.random()-0.5)*1));
          particlesCallback(smokePos, f.type.color, 0.5+Math.random()*0.5, 1.5);
        }
      }

      // Expire
      if(f.life<=0){
        this.scene.remove(f.group);
        this.scene.remove(f.light);
        this.activeFlares.splice(i,1);
      }
    }
  }

  // Launch flare burst for distress SOS
  launchBurst(pos, typeKey='distress'){
    for(let i=0;i<3;i++){
      setTimeout(()=>{
        const dir = new THREE.Vector3((Math.random()-0.5)*0.5, 1, (Math.random()-0.5)*0.5).normalize();
        this.launch(pos.clone(), dir, typeKey, 20+Math.random()*10);
      }, i*400);
    }
  }

  // Get nearest flare for quest marking
  getNearestFlare(pos, maxDist=100){
    let nearest=null, minDist=maxDist;
    this.activeFlares.forEach(f=>{
      const d=f.group.position.distanceTo(pos);
      if(d<minDist){ minDist=d; nearest=f; }
    });
    return nearest;
  }
}
