import * as THREE from 'three';
import { GUNS } from './data/guns.js';
import { VEHICLES } from './data/vehicles.js';
import { MAIN_QUESTS, SIDE_QUESTS } from './data/quests.js';

// --- GLOBALS ---
let scene, camera, renderer, clock;
let player, playerMesh, playerGroup;
let keys = {}, mouse = {x:0,y:0,down:false};
let camYaw = 0, camPitch = 0.2;
let velocity = new THREE.Vector3();
let isGrounded = true, isCrouching = false, isSprinting = false, isStealth = false;
let health = 100, armor = 60, zen = 2500;
let currentGunId = 36, ammo = {}, ownedGuns = new Set([1,36,56,21,71,111,113]);
let enemies = [], buildings = [], vehicles = [], projectiles = [], mines = [], particles = [];
let activeQuests = [], completedQuests = new Set();
let inVehicle = null, vehicleVelocity = 0;
let quality = 'low';
let drawDistance = 600;
let sensitivity = 1;
let gameStarted = false;
let wantedLevel = 0;

// UI refs
const hud = document.getElementById('hud');
const loadFill = document.getElementById('loadFill');
const loadText = document.getElementById('loadText');
const loading = document.getElementById('loading');

// --- INIT ---
async function init() {
  updateLoad(10, "LOADING THREE.JS ENGINE...");
  clock = new THREE.Clock();

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0e13, 0.0025);
  scene.background = new THREE.Color(0x0a0e13);

  // Camera
  camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 2000);
  
  // Renderer - F15 optimized
  renderer = new THREE.WebGLRenderer({antialias: quality!=='low', powerPreference:'high-performance', alpha:false});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, quality==='low'?1.2:1.8));
  renderer.shadowMap.enabled = quality!=='low';
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  updateLoad(30, "GENERATING CARTEL CITY...");

  // Lights
  const ambient = new THREE.AmbientLight(0x404060, 0.6);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffeedd, 1.2);
  sun.position.set(300,500,200);
  sun.castShadow = quality!=='low';
  if(quality!=='low'){
    sun.shadow.mapSize.set(1024,1024);
    sun.shadow.camera.near=1; sun.shadow.camera.far=2000;
    sun.shadow.camera.left=-800; sun.shadow.camera.right=800; sun.shadow.camera.top=800; sun.shadow.camera.bottom=-800;
  }
  scene.add(sun);
  const hemi = new THREE.HemisphereLight(0x88ccff, 0x222233, 0.4);
  scene.add(hemi);

  // World
  generateWorld();
  updateLoad(60, "SPAWNING ARSENAL & FLEET...");

  // Player
  createPlayer();
  generateEnemies();
  generateVehicles();
  setupAmmo();

  updateLoad(80, "LOADING 70 MISSIONS...");
  setupQuests();

  updateLoad(90, "OPTIMIZING FOR GALAXY F15...");
  setupInput();
  setupUI();
  setupMinimap();

  updateLoad(100, "READY - JACKSON DEPLOYED");
  setTimeout(()=>{
    loading.style.opacity='0';
    setTimeout(()=>loading.style.display='none',800);
  },500);

  // Start loop but paused until menu
  animate();
}

function updateLoad(pct, text){
  loadFill.style.width = pct+'%';
  loadText.textContent = text;
}

// --- WORLD GENERATION - Low poly city ---
function generateWorld(){
  // Ground - large plane with vertex colors for roads
  const groundGeo = new THREE.PlaneGeometry(3000,3000,30,30);
  const colors = [];
  const pos = groundGeo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const x = pos.getX(i), y = pos.getY(i);
    // Road pattern
    const isRoadX = Math.abs(x % 200) < 20;
    const isRoadZ = Math.abs(y % 200) < 20;
    if(isRoadX || isRoadZ){
      colors.push(0.15,0.15,0.16);
    } else {
      // Slight variation
      const v = 0.08 + Math.random()*0.05;
      colors.push(v*0.6, v*0.8, v*0.5);
    }
  }
  groundGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors,3));
  const groundMat = new THREE.MeshLambertMaterial({vertexColors:true});
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Water for ships
  const waterGeo = new THREE.PlaneGeometry(1000,1000);
  const waterMat = new THREE.MeshStandardMaterial({color:0x0a4a6a, roughness:0.2, metalness:0.3, transparent:true, opacity:0.8});
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.rotation.x = -Math.PI/2;
  water.position.set(900,-2,-500);
  scene.add(water);

  // Buildings - 80 low poly boxes
  const buildingMats = [
    new THREE.MeshLambertMaterial({color:0x2a2a3a}),
    new THREE.MeshLambertMaterial({color:0x3a3a4a}),
    new THREE.MeshLambertMaterial({color:0x4a4a5a}),
    new THREE.MeshLambertMaterial({color:0x2a3a4a}),
  ];
  for(let i=0;i<80;i++){
    const w = 20 + Math.random()*40;
    const d = 20 + Math.random()*40;
    const h = 30 + Math.random()*120;
    const geo = new THREE.BoxGeometry(w,h,d);
    const mat = buildingMats[Math.floor(Math.random()*buildingMats.length)];
    const mesh = new THREE.Mesh(geo, mat);
    // Grid placement avoiding roads
    let x,z;
    do{
      x = (Math.random()-0.5)*2000;
      z = (Math.random()-0.5)*2000;
    } while(Math.abs(x%200)<25 || Math.abs(z%200)<25 || Math.hypot(x,z)<100);
    mesh.position.set(x,h/2,z);
    mesh.castShadow = quality!=='low';
    mesh.receiveShadow = true;
    scene.add(mesh);
    buildings.push({mesh, x,z,w,d,h, type: Math.random()<0.1?'high':'normal'});
    // Windows - emissive planes
    if(Math.random()<0.6 && quality!=='low'){
      const winGeo = new THREE.PlaneGeometry(w*0.6, h*0.7);
      const winMat = new THREE.MeshBasicMaterial({color:0xffffaa, transparent:true, opacity:0.15});
      const win = new THREE.Mesh(winGeo, winMat);
      win.position.set(0,0,d/2+0.1);
      mesh.add(win);
    }
  }

  // Trees / props - instanced for performance
  const treeGeo = new THREE.ConeGeometry(5,20,6);
  const treeMat = new THREE.MeshLambertMaterial({color:0x1a4a1a});
  const trunkGeo = new THREE.CylinderGeometry(1,1.5,8,6);
  const trunkMat = new THREE.MeshLambertMaterial({color:0x3a2a1a});
  for(let i=0;i<120;i++){
    const treeGroup = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y=4;
    const leaves = new THREE.Mesh(treeGeo, treeMat);
    leaves.position.y=14;
    treeGroup.add(trunk, leaves);
    treeGroup.position.set((Math.random()-0.5)*1800,0,(Math.random()-0.5)*1800);
    if(Math.abs(treeGroup.position.x%200)<25 || Math.abs(treeGroup.position.z%200)<25) continue;
    treeGroup.scale.setScalar(0.8+Math.random()*0.6);
    scene.add(treeGroup);
  }

  // Sky dome
  const skyGeo = new THREE.SphereGeometry(1500,16,12);
  const skyMat = new THREE.MeshBasicMaterial({color:0x0a1420, side:THREE.BackSide});
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // Airstrip
  const stripGeo = new THREE.PlaneGeometry(800,80);
  const stripMat = new THREE.MeshLambertMaterial({color:0x1a1a1a});
  const strip = new THREE.Mesh(stripGeo, stripMat);
  strip.rotation.x=-Math.PI/2;
  strip.position.set(900,0.1,300);
  scene.add(strip);
  // Strip lines
  for(let i=0;i<10;i++){
    const line = new THREE.Mesh(new THREE.PlaneGeometry(30,4), new THREE.MeshBasicMaterial({color:0xffffff}));
    line.rotation.x=-Math.PI/2;
    line.position.set(900-350+i*80,0.2,300);
    scene.add(line);
  }
}

// --- PLAYER ---
function createPlayer(){
  playerGroup = new THREE.Group();
  // Low poly Jackson - capsule + boxes
  const bodyGeo = new THREE.CapsuleGeometry(0.5,1.6,4,8);
  const bodyMat = new THREE.MeshStandardMaterial({color:0x1a2a3a, roughness:0.7});
  playerMesh = new THREE.Mesh(bodyGeo, bodyMat);
  playerMesh.position.y=1.3;
  playerMesh.castShadow=true;
  playerGroup.add(playerMesh);
  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4,8,8), new THREE.MeshStandardMaterial({color:0xd2b48c}));
  head.position.y=2.4;
  playerGroup.add(head);
  // Gun placeholder
  const gunMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.1,0.8), new THREE.MeshStandardMaterial({color:0x111111}));
  gunMesh.position.set(0.4,1.2,0.5);
  gunMesh.name='gunMesh';
  playerGroup.add(gunMesh);

  playerGroup.position.set(0,0,0);
  scene.add(playerGroup);
  player = playerGroup;
}

function setupAmmo(){
  GUNS.forEach(g=>{
    ammo[g.id] = {cur:g.mag, reserve:g.mag*4};
  });
}

// --- ENEMIES ---
function generateEnemies(){
  const enemyGeo = new THREE.CapsuleGeometry(0.45,1.5,4,8);
  for(let i=0;i<28;i++){
    const mat = new THREE.MeshStandardMaterial({color: i<2?0xff2040:0x4a2a2a});
    const mesh = new THREE.Mesh(enemyGeo, mat);
    mesh.castShadow=true;
    const group = new THREE.Group();
    group.add(mesh);
    // Health bar sprite
    const canvas = document.createElement('canvas'); canvas.width=64; canvas.height=8;
    const ctx = canvas.getContext('2d'); ctx.fillStyle='#f00'; ctx.fillRect(0,0,64,8);
    const tex = new THREE.CanvasTexture(canvas);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map:tex}));
    sprite.position.y=3; sprite.scale.set(2,0.3,1);
    group.add(sprite);

    let x,z;
    do{
      x=(Math.random()-0.5)*1600;
      z=(Math.random()-0.5)*1600;
    }while(Math.hypot(x,z)<150);
    group.position.set(x,1.2,z);
    scene.add(group);
    enemies.push({group, mesh, health:100, maxHealth:100, state:'patrol', targetPos:new THREE.Vector3(x,z).add(new THREE.Vector3((Math.random()-0.5)*100,0,(Math.random()-0.5)*100)), lastShot:0, sprite, isBoss:i===0});
    if(i===0){
      // Michael - final boss bigger red
      group.scale.set(1.2,1.2,1.2);
      mesh.material.color.set(0xffcc00);
      mesh.material.emissive = new THREE.Color(0x331100);
    }
  }
}

// --- VEHICLES ---
function generateVehicles(){
  VEHICLES.forEach((vData, idx)=>{
    const color = new THREE.Color().setHSL(Math.random(),0.7,0.5);
    let geo, mat;
    if(vData.type==='Car' || vData.type==='Heavy'){
      geo = new THREE.BoxGeometry(4,2,7);
      mat = new THREE.MeshStandardMaterial({color});
    } else if(vData.type==='Bike'){
      geo = new THREE.BoxGeometry(1.2,1.5,3.5);
      mat = new THREE.MeshStandardMaterial({color:0x222222});
    } else if(vData.type==='Ship'){
      geo = new THREE.BoxGeometry(6,2,14);
      mat = new THREE.MeshStandardMaterial({color:0xaaaaaa});
    } else if(vData.type==='Tank'){
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(6,3,9), new THREE.MeshStandardMaterial({color:0x3a4a3a}));
      const turret = new THREE.Mesh(new THREE.CylinderGeometry(2,2,1.5,8), new THREE.MeshStandardMaterial({color:0x2a3a2a}));
      turret.position.y=2;
      const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,7), new THREE.MeshStandardMaterial({color:0x111111}));
      barrel.position.set(0,2,4);
      g.add(base,turret,barrel);
      g.position.set((Math.random()-0.5)*1200,1.5,(Math.random()-0.5)*1200);
      if(vData.type==='Ship'){ g.position.set(900+(Math.random()-0.5)*400,0.5,-500+(Math.random()-0.5)*400); }
      if(vData.type==='Tank'){ g.position.set(-500+(Math.random()-0.5)*200,1.5,-500+(Math.random()-0.5)*200); }
      scene.add(g);
      vehicles.push({group:g, data:vData, x:g.position.x, z:g.position.z, occupied:false});
      return;
    } else { // Plane/Jet
      geo = new THREE.BoxGeometry(12,2,16);
      mat = new THREE.MeshStandardMaterial({color:0xdddddd});
    }
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow=true;
    const group = new THREE.Group();
    group.add(mesh);
    let x,z;
    if(vData.type==='Ship'){
      x=900+(Math.random()-0.5)*500; z=-500+(Math.random()-0.5)*500;
    } else if(vData.type==='Plane' || vData.type==='Jet'){
      x=900+(Math.random()-0.5)*300; z=300+(Math.random()-0.5)*200;
    } else {
      x=(Math.random()-0.5)*1000; z=(Math.random()-0.5)*1000;
    }
    group.position.set(x,1,z);
    scene.add(group);
    vehicles.push({group, data:vData, x,z, occupied:false});
  });
}

// --- QUESTS ---
function setupQuests(){
  activeQuests = [MAIN_QUESTS[0]];
  updateQuestHUD();
}

function updateQuestHUD(){
  const hudEl = document.getElementById('questHud');
  hudEl.innerHTML='';
  activeQuests.slice(0,2).forEach(q=>{
    const div = document.createElement('div');
    div.className='quest-card';
    div.innerHTML=`<h4>${q.type.toUpperCase()} - ${q.title}</h4><p>${q.desc}</p>${q.objectives.map((o,i)=>`<div class="obj ${i===0?'':'done'}">${o}</div>`).join('')}<div style="margin-top:6px;color:var(--zen);font-family:'Orbitron';font-size:11px">REWARD: ${q.reward} ZEN</div>`;
    hudEl.appendChild(div);
  });
}

// --- INPUT ---
function setupInput(){
  window.addEventListener('keydown', e=>{
    keys[e.code]=true;
    if(e.code==='KeyC'){ isCrouching=!isCrouching; isStealth=isCrouching; }
    if(e.code==='KeyR'){ reload(); }
    if(e.code==='KeyE'){ tryEnterVehicle(); }
    if(e.code==='KeyQ'){ throwGrenade(); }
    if(e.code==='KeyG'){ placeMine(); }
    if(e.code==='Tab'){ e.preventDefault(); toggleModal('armouryModal'); }
    if(e.code==='KeyM'){ toggleModal('questModal'); }
    if(e.code==='Escape'){ closeAllModals(); }
    if(e.code.match(/Digit[1-4]/)){ switchWeapon(parseInt(e.code[5])-1); }
  });
  window.addEventListener('keyup', e=>keys[e.code]=false);

  // Mouse look - pointer lock
  renderer.domElement.addEventListener('click', ()=>{
    if(!gameStarted) return;
    if(document.querySelector('.modal.active')) return;
    if(inVehicle) return;
    renderer.domElement.requestPointerLock();
  });
  document.addEventListener('pointerlockchange', ()=>{
    if(document.pointerLockElement===renderer.domElement){
      document.addEventListener('mousemove', onMouseMove);
    } else {
      document.removeEventListener('mousemove', onMouseMove);
    }
  });
  function onMouseMove(e){
    camYaw -= e.movementX * 0.002 * sensitivity;
    camPitch -= e.movementY * 0.002 * sensitivity;
    camPitch = Math.max(-1.2, Math.min(1.2, camPitch));
  }

  renderer.domElement.addEventListener('mousedown', e=>{
    if(e.button===0){ mouse.down=true; shoot(); }
  });
  window.addEventListener('mouseup', e=>{ if(e.button===0) mouse.down=false; });

  // Mobile joystick
  const joy = document.getElementById('joystick');
  const knob = document.getElementById('joyKnob');
  if(joy){
    let joyActive=false, joyStart={x:0,y:0};
    joy.addEventListener('touchstart', e=>{
      joyActive=true;
      const t=e.touches[0];
      joyStart={x:t.clientX,y:t.clientY};
      e.preventDefault();
    });
    joy.addEventListener('touchmove', e=>{
      if(!joyActive) return;
      const t=e.touches[0];
      const dx=t.clientX-joyStart.x, dy=t.clientY-joyStart.y;
      const dist=Math.min(50,Math.hypot(dx,dy));
      const ang=Math.atan2(dy,dx);
      knob.style.transform=`translate(calc(-50% + ${Math.cos(ang)*dist}px), calc(-50% + ${Math.sin(ang)*dist}px))`;
      // Map to keys
      keys['KeyW']=dy<-10;
      keys['KeyS']=dy>10;
      keys['KeyA']=dx<-10;
      keys['KeyD']=dx>10;
      e.preventDefault();
    });
    joy.addEventListener('touchend', ()=>{
      joyActive=false;
      knob.style.transform='translate(-50%,-50%)';
      keys['KeyW']=keys['KeyA']=keys['KeyS']=keys['KeyD']=false;
    });
    document.getElementById('mShoot').addEventListener('touchstart', e=>{shoot(); e.preventDefault();});
    document.getElementById('mJump').addEventListener('touchstart', e=>{keys['Space']=true; setTimeout(()=>keys['Space']=false,100); e.preventDefault();});
    document.getElementById('mReload').addEventListener('touchstart', e=>{reload(); e.preventDefault();});
    document.getElementById('mVehicle').addEventListener('touchstart', e=>{tryEnterVehicle(); e.preventDefault();});
  }

  window.addEventListener('resize', ()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
  });
}

// --- WEAPONS ---
function switchWeapon(slot){
  const owned = Array.from(ownedGuns);
  if(owned[slot]){
    currentGunId=owned[slot];
    updateAmmoUI();
    notify(`EQUIPPED: ${GUNS.find(g=>g.id===currentGunId).name}`);
  }
}

function reload(){
  const gun = GUNS.find(g=>g.id===currentGunId);
  if(!gun) return;
  const a = ammo[gun.id];
  if(a.cur===gun.mag || a.reserve<=0) return;
  const need = gun.mag - a.cur;
  const take = Math.min(need, a.reserve);
  a.reserve-=take; a.cur+=take;
  updateAmmoUI();
  // anim
  const gm = playerGroup.getObjectByName('gunMesh');
  if(gm){ gm.rotation.x=0.5; setTimeout(()=>gm.rotation.x=0,200); }
}

function shoot(){
  if(!gameStarted) return;
  if(inVehicle){
    // Vehicle weapon
    const v = vehicles.find(v=>v.occupied);
    if(v && (v.data.type==='Tank' || v.data.type==='Heavy')){
      fireProjectile(v.group.position.clone().add(new THREE.Vector3(0,2,5)), camera.getWorldDirection(new THREE.Vector3()), 500, true);
    }
    return;
  }
  const gun = GUNS.find(g=>g.id===currentGunId);
  if(!gun) return;
  const a = ammo[gun.id];
  if(a.cur<=0){ reload(); return; }
  a.cur--;
  updateAmmoUI();

  // Raycast from camera
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  const origin = camera.position.clone();
  const ray = new THREE.Raycaster(origin, dir, 0, gun.range);
  const hits = ray.intersectObjects(enemies.map(e=>e.group), true);
  // Also check buildings? simplified
  if(hits.length>0){
    const hit = hits[0];
    // Find enemy
    const enemy = enemies.find(e=> e.group===hit.object.parent || e.group.children.includes(hit.object) || e.group===hit.object);
    if(enemy){
      enemy.health -= gun.dmg * (isStealth?1.5:1);
      updateEnemyHealth(enemy);
      if(enemy.health<=0){
        killEnemy(enemy);
      } else {
        // Hit effect
        spawnParticle(hit.point, 0xffaa00);
      }
    }
  }

  // Projectile visual for launchers
  if(gun.cat==='Launcher' || gun.cat==='Heavy' || gun.id>=96){
    fireProjectile(player.position.clone().add(new THREE.Vector3(0,1.2,0)), dir, gun.dmg, true);
  } else {
    // Muzzle flash
    spawnParticle(player.position.clone().add(dir.clone().multiplyScalar(1)).add(new THREE.Vector3(0,1.2,0)), 0xffffaa, 0.1);
    // Tracer
    const tracerGeo = new THREE.BufferGeometry().setFromPoints([origin, origin.clone().add(dir.multiplyScalar(30))]);
    const tracerMat = new THREE.LineBasicMaterial({color:0xffffaa, transparent:true, opacity:0.8});
    const line = new THREE.Line(tracerGeo, tracerMat);
    scene.add(line);
    setTimeout(()=>scene.remove(line),40);
  }

  // Recoil
  camPitch += (Math.random()-0.5)*0.02 * (gun.dmg/50);
  // Sound placeholder - visual shake
  renderer.domElement.style.transform=`translate(${(Math.random()-0.5)*2}px,${(Math.random()-0.5)*2}px)`;
  setTimeout(()=>renderer.domElement.style.transform='',30);

  // Wanted
  if(!isStealth){ wantedLevel = Math.min(5, wantedLevel+0.2); updateWanted(); }
}

function fireProjectile(pos, dir, dmg, explosive){
  const geo = new THREE.SphereGeometry(explosive?0.3:0.1,6,6);
  const mat = new THREE.MeshBasicMaterial({color: explosive?0xff4400:0xffff00});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  scene.add(mesh);
  projectiles.push({mesh, dir:dir.clone(), speed: explosive?35:80, dmg, explosive, life:5});
}

function throwGrenade(){
  const gun = GUNS.find(g=>g.id===111); // frag
  if(!ammo[111] || ammo[111].cur<=0) return;
  ammo[111].cur--;
  const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
  const pos = player.position.clone().add(new THREE.Vector3(0,1.5,0)).add(dir.clone().multiplyScalar(1));
  const geo = new THREE.SphereGeometry(0.2,8,8);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({color:0x2a3a2a}));
  mesh.position.copy(pos);
  scene.add(mesh);
  projectiles.push({mesh, dir:dir.clone().add(new THREE.Vector3(0,0.3,0)), speed:15, dmg:250, explosive:true, life:3, grenade:true, vel:new THREE.Vector3().copy(dir).multiplyScalar(15).add(new THREE.Vector3(0,8,0))});
  notify("GRENADE THROWN!");
}

function placeMine(){
  const mineTypes = [113,114];
  const id = mineTypes[Math.floor(Math.random()*mineTypes.length)];
  if(!ammo[id] || ammo[id].cur<=0) return;
  ammo[id].cur--;
  const geo = new THREE.CylinderGeometry(0.5,0.5,0.2,8);
  const mat = new THREE.MeshStandardMaterial({color:id===114?0x331111:0x333333});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(player.position).add(new THREE.Vector3(0,0.1,0));
  scene.add(mesh);
  mines.push({mesh, dmg: id===114?1200:400, radius:id===114?12:6, armed:true});
  notify(`${GUNS.find(g=>g.id===id).name} PLACED`);
}

function spawnParticle(pos, color=0xffffff, size=0.3){
  const geo = new THREE.SphereGeometry(size,4,4);
  const mat = new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.9});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(pos);
  scene.add(mesh);
  particles.push({mesh, vel:new THREE.Vector3((Math.random()-0.5)*4,Math.random()*6, (Math.random()-0.5)*4), life:1, decay:0.02+Math.random()*0.03});
}

// --- ENEMY AI ---
function updateEnemies(dt){
  enemies.forEach(e=>{
    if(e.health<=0) return;
    const distToPlayer = e.group.position.distanceTo(player.position);
    // LOD - skip far enemies
    if(distToPlayer>drawDistance) return;

    // Check mines
    mines.forEach((m,i)=>{
      if(m.mesh.position.distanceTo(e.group.position)<m.radius){
        // Explode mine
        explode(m.mesh.position, m.dmg, m.radius);
        scene.remove(m.mesh);
        mines.splice(i,1);
        e.health-=m.dmg;
        if(e.health<=0) killEnemy(e);
      }
    });

    if(distToPlayer<40){
      // Chase
      const dir = new THREE.Vector3().subVectors(player.position, e.group.position).normalize();
      dir.y=0;
      e.group.position.add(dir.multiplyScalar(dt* (e.isBoss?4:2.5)));
      e.group.lookAt(player.position);
      // Shoot
      if(clock.elapsedTime - e.lastShot > (e.isBoss?0.4:1.2)){
        e.lastShot=clock.elapsedTime;
        if(Math.random()<0.6){
          // Damage player
          const dmg = e.isBoss?25:10;
          if(armor>0){ armor=Math.max(0,armor-dmg*0.6); health=Math.max(0,health-dmg*0.4); }
          else health=Math.max(0,health-dmg);
          updateHealthUI();
          spawnParticle(player.position.clone().add(new THREE.Vector3(0,1,0)), 0xff0000,0.15);
          if(health<=0) playerDeath();
        }
      }
    } else if(e.state==='patrol'){
      // Patrol
      const toTarget = new THREE.Vector3().subVectors(e.targetPos, e.group.position);
      if(toTarget.length()<3){
        e.targetPos.set((Math.random()-0.5)*1600,0,(Math.random()-0.5)*1600);
      } else {
        toTarget.normalize();
        e.group.position.add(toTarget.multiplyScalar(dt*1.2));
        e.group.lookAt(e.group.position.clone().add(toTarget));
      }
    }
  });
}

function updateEnemyHealth(e){
  const pct = Math.max(0,e.health/e.maxHealth);
  const canvas = document.createElement('canvas'); canvas.width=64; canvas.height=8;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#000'; ctx.fillRect(0,0,64,8);
  ctx.fillStyle= pct>0.5?'#0f0': pct>0.25?'#ff0':'#f00';
  ctx.fillRect(0,0,64*pct,8);
  e.sprite.material.map = new THREE.CanvasTexture(canvas);
  e.sprite.material.map.needsUpdate=true;
}

function killEnemy(e){
  e.health=0;
  e.group.visible=false;
  zen+= e.isBoss?10000: 150+Math.floor(Math.random()*200);
  updateZenUI();
  spawnParticle(e.group.position.clone().add(new THREE.Vector3(0,1,0)), 0xff2040,0.5);
  for(let i=0;i<6;i++) spawnParticle(e.group.position.clone(), 0xffaa00,0.3);
  if(e.isBoss){
    notify("MICHAEL ELIMINATED! MISSION COMPLETE!");
    activeQuests.forEach(q=>{ if(q.id===30) completeQuest(q); });
  } else {
    // Quest progress
    activeQuests.forEach(q=>{
      if(q.objectives[0].includes('Kill') || q.objectives[0].includes('Eliminate')){
        // simplified complete
        if(Math.random()<0.3) completeQuest(q);
      }
    });
  }
  // Respawn after time
  setTimeout(()=>{
    if(!e.isBoss){
      e.health=100;
      e.group.position.set((Math.random()-0.5)*1600,1.2,(Math.random()-0.5)*1600);
      e.group.visible=true;
      updateEnemyHealth(e);
    }
  },15000);
}

function explode(pos, dmg, radius){
  spawnParticle(pos, 0xff4400, radius*0.3);
  for(let i=0;i<20;i++) spawnParticle(pos.clone(), Math.random()<0.5?0xffaa00:0xff4400, 0.4+Math.random()*0.6);
  // Damage
  enemies.forEach(e=>{
    if(e.group.position.distanceTo(pos)<radius){
      e.health-=dmg * (1 - e.group.position.distanceTo(pos)/radius);
      updateEnemyHealth(e);
      if(e.health<=0) killEnemy(e);
    }
  });
  if(player.position.distanceTo(pos)<radius){
    const d = dmg * (1 - player.position.distanceTo(pos)/radius) * 0.3;
    if(armor>0){ armor=Math.max(0,armor-d*0.5); health=Math.max(0,health-d*0.5); }
    else health=Math.max(0,health-d);
    updateHealthUI();
  }
  // Camera shake
  const dist = player.position.distanceTo(pos);
  if(dist<radius*2){
    const intensity = (1-dist/(radius*2))*5;
    camera.position.x+= (Math.random()-0.5)*intensity;
    camera.position.y+= (Math.random()-0.5)*intensity;
  }
}

// --- VEHICLES ---
function tryEnterVehicle(){
  if(inVehicle){
    // Exit
    const v = vehicles.find(v=>v.occupied);
    if(v){
      v.occupied=false;
      inVehicle=null;
      player.visible=true;
      player.position.copy(v.group.position).add(new THREE.Vector3(5,0,0));
      notify(`EXITED ${v.data.name}`);
    }
    return;
  }
  // Find nearest
  let nearest=null, minDist=8;
  vehicles.forEach(v=>{
    const d = v.group.position.distanceTo(player.position);
    if(d<minDist){ minDist=d; nearest=v; }
  });
  if(nearest){
    nearest.occupied=true;
    inVehicle=nearest;
    player.visible=false;
    notify(`ENTERED ${nearest.data.name} - WASD DRIVE, E EXIT, LMB FIRE`);
  }
}

function updateVehicle(dt){
  if(!inVehicle) return;
  const v = inVehicle;
  const inputForward = (keys['KeyW']?1:0) - (keys['KeyS']?1:0);
  const inputSteer = (keys['KeyA']?1:0) - (keys['KeyD']?1:0);

  if(v.data.type==='Car' || v.data.type==='Tank' || v.data.type==='Heavy'){
    vehicleVelocity += inputForward * dt * 30;
    vehicleVelocity *= 0.98; // friction
    v.group.position.add(v.group.getWorldDirection(new THREE.Vector3()).multiplyScalar(vehicleVelocity*dt));
    v.group.rotation.y += inputSteer * dt * 1.5 * (vehicleVelocity>0?1:-1);
    // Keep on ground
    v.group.position.y = v.data.type==='Tank'?1.5:1;
  } else if(v.data.type==='Bike'){
    vehicleVelocity += inputForward * dt * 40;
    vehicleVelocity *= 0.97;
    v.group.position.add(v.group.getWorldDirection(new THREE.Vector3()).multiplyScalar(vehicleVelocity*dt));
    v.group.rotation.y += inputSteer * dt * 2.5;
    v.group.rotation.z = -inputSteer * 0.3 * (vehicleVelocity/20);
    v.group.position.y=0.8;
  } else if(v.data.type==='Ship'){
    vehicleVelocity += inputForward * dt * 20;
    vehicleVelocity *= 0.985;
    v.group.position.add(v.group.getWorldDirection(new THREE.Vector3()).multiplyScalar(vehicleVelocity*dt));
    v.group.rotation.y += inputSteer * dt * 0.8;
    v.group.position.y=0.5 + Math.sin(clock.elapsedTime*2)*0.1;
  } else if(v.data.type==='Plane' || v.data.type==='Jet'){
    vehicleVelocity += inputForward * dt * 50;
    vehicleVelocity = Math.max(5, vehicleVelocity);
    const dir = v.group.getWorldDirection(new THREE.Vector3());
    v.group.position.add(dir.multiplyScalar(vehicleVelocity*dt));
    v.group.rotation.y += inputSteer * dt * 0.6;
    if(keys['Space']) v.group.position.y += dt*20;
    if(keys['ShiftLeft']) v.group.position.y -= dt*20;
    // Auto lift
    if(v.group.position.y<20) v.group.position.y+=dt*10;
  }

  // Update player pos to vehicle
  player.position.copy(v.group.position);
  // Check mine collisions for vehicle
  mines.forEach((m,i)=>{
    if(m.mesh.position.distanceTo(v.group.position)<m.radius+3){
      explode(m.mesh.position, m.dmg*1.5, m.radius*1.5);
      scene.remove(m.mesh);
      mines.splice(i,1);
      if(v.data.type!=='Tank') vehicleVelocity*=-0.5;
    }
  });
}

// --- PLAYER MOVEMENT ---
function updatePlayer(dt){
  if(inVehicle) return;
  const speed = isCrouching?1.8: isSprinting?6.5:4.0;
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward); forward.y=0; forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).negate();

  let move = new THREE.Vector3();
  if(keys['KeyW']) move.add(forward);
  if(keys['KeyS']) move.sub(forward);
  if(keys['KeyA']) move.sub(right);
  if(keys['KeyD']) move.add(right);
  if(move.length()>0){
    move.normalize().multiplyScalar(speed*dt);
    // Simple collision with buildings
    const nextPos = player.position.clone().add(move);
    let blocked=false;
    for(const b of buildings){
      if(Math.abs(nextPos.x-b.x)<b.w/2+1 && Math.abs(nextPos.z-b.z)<b.d/2+1){
        blocked=true; break;
      }
    }
    if(!blocked){
      player.position.add(move);
    }
    isStealth = isCrouching || (move.length()<0.01);
  }

  // Gravity / jump
  if(keys['Space'] && isGrounded){
    velocity.y=7;
    isGrounded=false;
  }
  velocity.y -= 18*dt;
  player.position.y += velocity.y*dt;
  if(player.position.y<=0){
    player.position.y=0;
    velocity.y=0;
    isGrounded=true;
  }

  // Sprint key
  isSprinting = !!keys['ShiftLeft'] && !isCrouching;

  // Update stealth meter
  const stealthEl = document.getElementById('stealthMeter');
  if(stealthEl){
    if(isStealth){
      stealthEl.textContent='HIDDEN'; stealthEl.style.color='var(--zen)';
    } else if(isSprinting){
      stealthEl.textContent='EXPOSED - RUNNING'; stealthEl.style.color='#ff2040';
    } else {
      stealthEl.textContent='VISIBLE'; stealthEl.style.color='#ffcc00';
    }
  }
}

// --- CAMERA ---
function updateCamera(dt){
  if(inVehicle){
    const v = inVehicle.group;
    const offset = v.getWorldDirection(new THREE.Vector3()).negate().multiplyScalar(v.data.type==='Jet'?40:15).add(new THREE.Vector3(0, v.data.type==='Jet'?12:6,0));
    camera.position.lerp(v.position.clone().add(offset), dt*3);
    camera.lookAt(v.position.clone().add(new THREE.Vector3(0,3,0)));
  } else {
    // Third person
    const dist = isCrouching?2.5:4.5;
    const height = isCrouching?1.0:1.7;
    const camPos = new THREE.Vector3(
      player.position.x + Math.sin(camYaw)*Math.cos(camPitch)*dist,
      player.position.y + height + Math.sin(camPitch)*dist,
      player.position.z + Math.cos(camYaw)*Math.cos(camPitch)*dist
    );
    // Avoid clipping into buildings
    const ray = new THREE.Raycaster(player.position.clone().add(new THREE.Vector3(0,height,0)), camPos.clone().sub(player.position).normalize(),0,dist);
    const hits = ray.intersectObjects(buildings.map(b=>b.mesh));
    if(hits.length>0){
      camPos.lerpVectors(player.position, camPos, hits[0].distance/dist*0.8);
    }
    camera.position.lerp(camPos, dt*8);
    camera.lookAt(player.position.clone().add(new THREE.Vector3(0,height,0)));
  }
}

// --- PROJECTILES & PARTICLES ---
function updateProjectiles(dt){
  for(let i=projectiles.length-1;i>=0;i--){
    const p = projectiles[i];
    if(p.grenade){
      p.vel.y -= 18*dt;
      p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
      p.life-=dt;
      if(p.mesh.position.y<=0.2 || p.life<=0){
        explode(p.mesh.position, p.dmg, 8);
        scene.remove(p.mesh);
        projectiles.splice(i,1);
      }
    } else {
      p.mesh.position.add(p.dir.clone().multiplyScalar(p.speed*dt));
      p.life-=dt;
      if(p.life<=0){
        if(p.explosive) explode(p.mesh.position, p.dmg, 10);
        scene.remove(p.mesh);
        projectiles.splice(i,1);
      } else {
        // Check enemy hit
        for(const e of enemies){
          if(e.health>0 && e.group.position.distanceTo(p.mesh.position)<2){
            if(p.explosive) explode(p.mesh.position, p.dmg, 8);
            else {
              e.health-=p.dmg;
              updateEnemyHealth(e);
              if(e.health<=0) killEnemy(e);
              scene.remove(p.mesh);
              projectiles.splice(i,1);
            }
            break;
          }
        }
      }
    }
  }

  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.mesh.position.add(p.vel.clone().multiplyScalar(dt));
    p.vel.y-=9*dt;
    p.life-=p.decay;
    p.mesh.material.opacity=p.life;
    p.mesh.scale.multiplyScalar(0.995);
    if(p.life<=0){
      scene.remove(p.mesh);
      particles.splice(i,1);
    }
  }
}

// --- UI ---
function setupUI(){
  document.getElementById('playBtn').addEventListener('click', ()=>{
    document.getElementById('mainMenu').style.display='none';
    hud.style.display='block';
    gameStarted=true;
    // Start with some zen and guns
    notify("DEPLOYED AS JACKSON - FIND MICHAEL");
    notify("TIP: Press TAB for Armoury - 125 Guns");
    updateHealthUI(); updateZenUI(); updateAmmoUI(); updateWanted();
    // Lock pointer after small delay
    setTimeout(()=>renderer.domElement.requestPointerLock(),100);
  });

  document.getElementById('loadBtn').addEventListener('click', ()=>toggleModal('armouryModal'));
  document.getElementById('settingsBtn').addEventListener('click', ()=>toggleModal('settingsModal'));

  // Armoury
  const gunGrid = document.getElementById('gunGrid');
  const filters = document.querySelectorAll('#gunFilters button');
  function renderGuns(filter='all'){
    gunGrid.innerHTML='';
    const list = filter==='all'?GUNS: GUNS.filter(g=> g.cat===filter || (filter==='Heavy' && ['Heavy','Explosive','Mine','Throwable'].includes(g.cat)) || (filter==='Mythic' && g.rarity==='Mythic'));
    list.forEach(g=>{
      const div=document.createElement('div');
      div.className='gun-card'+(ownedGuns.has(g.id)?' owned':'');
      div.innerHTML=`
        <div class="rarity ${g.rarity}">${g.rarity}</div>
        <h4>${g.name}</h4>
        <div class="meta"><span>DMG:${g.dmg}</span><span>RPM:${g.rpm}</span><span>ACC:${g.acc}</span><span>MAG:${g.mag}</span></div>
        <div style="font-size:11px;opacity:0.6;margin-top:4px">${g.desc}</div>
        <div class="price">◉ ${g.price} ZEN ${ownedGuns.has(g.id)?' - OWNED':''}</div>
      `;
      div.addEventListener('click', ()=>{
        showGunDetail(g);
        if(!ownedGuns.has(g.id) && zen>=g.price){
          if(confirm(`Buy ${g.name} for ${g.price} ZEN?`)){
            zen-=g.price; ownedGuns.add(g.id); ammo[g.id]={cur:g.mag, reserve:g.mag*4};
            updateZenUI(); renderGuns(filter);
            notify(`PURCHASED ${g.name}`);
          }
        } else if(ownedGuns.has(g.id)){
          currentGunId=g.id; updateAmmoUI(); notify(`EQUIPPED ${g.name}`);
        } else {
          notify(`NEED ${g.price-zen} MORE ZEN`);
        }
      });
      gunGrid.appendChild(div);
    });
  }
  filters.forEach(b=>b.addEventListener('click', ()=>{
    filters.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderGuns(b.dataset.filter);
  }));
  renderGuns('all');

  // Vehicles list
  const vList = document.getElementById('vehicleList');
  VEHICLES.forEach(v=>{
    const div=document.createElement('div');
    div.style.cssText='display:flex;justify-content:space-between;background:rgba(255,255,255,0.03);padding:6px 8px;border:1px solid rgba(255,255,255,0.06);font-size:11px';
    div.innerHTML=`<span>${v.type} - ${v.name}</span><span style="color:var(--zen)">${v.price? '◉'+v.price: 'FREE'}</span>`;
    div.addEventListener('click', ()=>{
      if(v.price && zen<v.price){ notify(`NEED ${v.price} ZEN`); return; }
      if(v.price){ zen-=v.price; updateZenUI(); }
      // Spawn near player
      const gv = vehicles.find(x=>x.data.id===v.id);
      if(gv){ gv.group.position.copy(player.position).add(new THREE.Vector3(10,0,0)); notify(`SPAWNED ${v.name}`); }
    });
    vList.appendChild(div);
  });

  // Quests modal
  const qList = document.getElementById('questList');
  const qFilters = document.querySelectorAll('[data-qfilter]');
  function renderQuests(filter='all'){
    qList.innerHTML='';
    let list=[];
    if(filter==='all') list=[...MAIN_QUESTS,...SIDE_QUESTS];
    else if(filter==='Main') list=MAIN_QUESTS;
    else if(filter==='Side') list=SIDE_QUESTS;
    else if(filter==='Active') list=activeQuests;
    else if(filter==='Done') list=[...MAIN_QUESTS,...SIDE_QUESTS].filter(q=>completedQuests.has(q.id));
    list.forEach(q=>{
      const div=document.createElement('div');
      div.className='quest-card';
      const isActive = activeQuests.find(aq=>aq.id===q.id);
      const isDone = completedQuests.has(q.id);
      div.style.borderLeftColor = isDone?'#666': isActive?'var(--zen)':'rgba(255,255,255,0.2)';
      div.innerHTML=`<h4>${q.type} #${q.id} - ${q.title} ${isDone?'(DONE)':''} ${isActive?'(ACTIVE)':''}</h4><p>${q.desc}</p><div style="margin:6px 0">${q.objectives.map(o=>`<div class="obj ${isDone?'done':''}">${o}</div>`).join('')}</div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><span style="font-family:'Orbitron';font-size:11px;color:var(--zen)">REWARD: ${q.reward} ZEN</span><button class="btn secondary" style="padding:6px 12px;font-size:11px">${isActive?'TRACKING': isDone?'COMPLETED':'START'}</button></div><div style="font-size:10px;opacity:0.5;margin-top:4px">DIFF: ${q.difficulty} | LOC: ${q.location.x},${q.location.z}</div>`;
      div.querySelector('button').addEventListener('click', ()=>{
        if(isDone) return;
        if(!isActive){
          activeQuests.push(q);
          if(activeQuests.length>3) activeQuests.shift();
          updateQuestHUD();
          notify(`STARTED: ${q.title}`);
          renderQuests(filter);
        }
      });
      qList.appendChild(div);
    });
  }
  qFilters.forEach(b=>b.addEventListener('click', ()=>{
    qFilters.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    renderQuests(b.dataset.qfilter);
  }));
  renderQuests('all');

  // Settings
  document.getElementById('qualityLow').addEventListener('click', ()=>setQuality('low'));
  document.getElementById('qualityMed').addEventListener('click', ()=>setQuality('medium'));
  document.getElementById('qualityHigh').addEventListener('click', ()=>setQuality('high'));
  document.getElementById('qualityUltra').addEventListener('click', ()=>setQuality('ultra'));
  document.getElementById('drawDist').addEventListener('input', e=>{ drawDistance=parseInt(e.target.value); });
  document.getElementById('sens').addEventListener('input', e=>{ sensitivity=parseFloat(e.target.value); });
}

function showGunDetail(g){
  const el=document.getElementById('gunDetail');
  el.innerHTML=`
    <h3 style="font-family:'Orbitron';color:var(--zen)">${g.name}</h3>
    <div style="margin:8px 0"><span class="rarity ${g.rarity}" style="position:static;padding:2px 8px">${g.rarity}</span> <span style="font-size:11px;opacity:0.6">${g.cat}</span></div>
    <p style="font-size:13px;opacity:0.8;margin:10px 0">${g.desc}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
      <div style="background:rgba(255,255,255,0.05);padding:8px"><div style="font-size:10px;opacity:0.5">DAMAGE</div><div style="font-family:'Orbitron';color:var(--danger)">${g.dmg}</div><div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100,g.dmg/5)}%;background:var(--danger)"></div></div></div>
      <div style="background:rgba(255,255,255,0.05);padding:8px"><div style="font-size:10px;opacity:0.5">RANGE</div><div style="font-family:'Orbitron'">${g.range}m</div><div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100,g.range/20)}%;background:var(--zen)"></div></div></div>
      <div style="background:rgba(255,255,255,0.05);padding:8px"><div style="font-size:10px;opacity:0.5">FIRE RATE</div><div style="font-family:'Orbitron'">${g.rpm} RPM</div><div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100,g.rpm/30)}%;background:#ffcc00"></div></div></div>
      <div style="background:rgba(255,255,255,0.05);padding:8px"><div style="font-size:10px;opacity:0.5">ACCURACY</div><div style="font-family:'Orbitron'">${g.acc}%</div><div class="bar-bg"><div class="bar-fill" style="width:${g.acc}%;background:#00aaff"></div></div></div>
    </div>
    <div style="margin-top:16px;padding:10px;background:rgba(0,255,136,0.05);border:1px solid rgba(0,255,136,0.2)">
      <div style="font-size:11px;opacity:0.6">PRICE</div><div style="font-family:'Orbitron';font-size:20px;color:var(--zen)">◉ ${g.price} ZEN</div>
      <button class="btn" style="width:100%;margin-top:10px" onclick="document.querySelector('.gun-card.owned')?.click()">${ownedGuns.has(g.id)?'EQUIPPED - OWNED':'BUY WEAPON'}</button>
    </div>
  `;
}

window.closeModal = (id)=>{ document.getElementById(id).classList.remove('active'); if(gameStarted) renderer.domElement.requestPointerLock(); };
window.toggleModal = (id)=>{
  const m=document.getElementById(id);
  const isActive=m.classList.contains('active');
  closeAllModals();
  if(!isActive){ m.classList.add('active'); document.exitPointerLock(); }
};
function closeAllModals(){ document.querySelectorAll('.modal').forEach(m=>m.classList.remove('active')); }

function setQuality(q){
  quality=q;
  const isLow = q==='low';
  renderer.shadowMap.enabled=!isLow;
  renderer.setPixelRatio(Math.min(devicePixelRatio, isLow?1.2: q==='medium'?1.5:2));
  scene.fog = new THREE.FogExp2(0x0a0e13, isLow?0.0035:0.002);
  notify(`QUALITY: ${q.toUpperCase()} - ${isLow?'OPTIMIZED FOR F15':''}`);
}

function updateHealthUI(){
  document.getElementById('hpText').textContent=Math.floor(health);
  document.getElementById('armorText').textContent=Math.floor(armor);
  document.getElementById('hpFill').style.width=health+'%';
  document.getElementById('armorFill').style.width=armor+'%';
}
function updateZenUI(){ document.getElementById('zenCount').textContent=zen; }
function updateAmmoUI(){
  const gun=GUNS.find(g=>g.id===currentGunId);
  if(!gun) return;
  const a=ammo[gun.id];
  document.getElementById('ammoCur').textContent=a.cur;
  document.getElementById('ammoRes').textContent=a.reserve;
  document.getElementById('gunName').textContent=gun.name;
}
function updateWanted(){
  const stars='★'.repeat(Math.floor(wantedLevel))+'☆'.repeat(5-Math.floor(wantedLevel));
  document.getElementById('wanted').textContent=stars;
  document.getElementById('wanted').style.color = wantedLevel>3?'#ff2040': wantedLevel>1?'#ffcc00':'#fff';
}
function notify(text){
  const cont=document.getElementById('notifs');
  const div=document.createElement('div');
  div.className='notif'; div.textContent=text;
  cont.appendChild(div);
  setTimeout(()=>div.remove(),3000);
}
function completeQuest(q){
  if(completedQuests.has(q.id)) return;
  completedQuests.add(q.id);
  activeQuests = activeQuests.filter(aq=>aq.id!==q.id);
  zen+=q.reward;
  updateZenUI(); updateQuestHUD();
  notify(`QUEST COMPLETE: ${q.title} +${q.reward} ZEN`);
  // Auto start next main
  const nextMain = MAIN_QUESTS.find(mq=>mq.id===q.id+1);
  if(q.type==='Main' && nextMain){
    activeQuests.push(nextMain);
    notify(`NEW MISSION: ${nextMain.title}`);
  }
}
function playerDeath(){
  notify("JACKSON DOWN! RESPAWNING...");
  health=100; armor=60;
  player.position.set(0,0,0);
  updateHealthUI();
  wantedLevel=0; updateWanted();
}

// --- MINIMAP ---
function setupMinimap(){
  const canvas=document.getElementById('miniCanvas');
  const ctx=canvas.getContext('2d');
  setInterval(()=>{
    if(!gameStarted) return;
    ctx.clearRect(0,0,180,180);
    // BG
    ctx.fillStyle='rgba(10,20,30,0.8)'; ctx.fillRect(0,0,180,180);
    ctx.strokeStyle='rgba(0,255,136,0.2)'; ctx.lineWidth=1;
    // Grid
    for(let i=0;i<180;i+=20){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,180); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(180,i); ctx.stroke(); }
    // Player
    const scale=0.05;
    const px=90+player.position.x*scale;
    const pz=90+player.position.z*scale;
    // Buildings
    ctx.fillStyle='rgba(255,255,255,0.3)';
    buildings.forEach(b=>{
      if(Math.hypot(b.x-player.position.x, b.z-player.position.z)>drawDistance) return;
      const bx=90+b.x*scale, bz=90+b.z*scale;
      ctx.fillRect(bx-2,bz-2,4,4);
    });
    // Enemies
    ctx.fillStyle='#ff2040';
    enemies.forEach(e=>{
      if(e.health<=0) return;
      if(e.group.position.distanceTo(player.position)>drawDistance) return;
      const ex=90+e.group.position.x*scale, ez=90+e.group.position.z*scale;
      ctx.beginPath(); ctx.arc(ex,ez,3,0,Math.PI*2); ctx.fill();
    });
    // Vehicles
    ctx.fillStyle='#00aaff';
    vehicles.forEach(v=>{
      const vx=90+v.group.position.x*scale, vz=90+v.group.position.z*scale;
      ctx.fillRect(vx-1.5,vz-1.5,3,3);
    });
    // Quests
    ctx.fillStyle='#ffcc00';
    activeQuests.forEach(q=>{
      const qx=90+q.location.x*scale, qz=90+q.location.z*scale;
      ctx.beginPath(); ctx.arc(qx,qz,5,0,Math.PI*2); ctx.strokeStyle='#ffcc00'; ctx.lineWidth=2; ctx.stroke();
    });
    // Player dot
    ctx.fillStyle='#00ff88'; ctx.beginPath(); ctx.arc(px,pz,4,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(px, pz-8); ctx.lineTo(px, pz-4); ctx.stroke();
  },100);
}

// --- MAIN LOOP ---
let lastFpsUpdate=0, frameCount=0, fps=60;
function animate(){
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, clock.getDelta());
  if(!gameStarted){
    // Menu camera orbit
    const t=clock.elapsedTime*0.1;
    camera.position.set(Math.sin(t)*30, 15+Math.sin(t*0.5)*3, Math.cos(t)*30);
    camera.lookAt(0,0,0);
    renderer.render(scene,camera);
    return;
  }

  // Game updates
  if(!document.querySelector('.modal.active')){
    updatePlayer(dt);
    updateVehicle(dt);
    updateEnemies(dt);
  }
  updateProjectiles(dt);
  updateCamera(dt);

  // Wanted decay
  if(wantedLevel>0){ wantedLevel=Math.max(0,wantedLevel-dt*0.1); if(Math.floor(performance.now()/500)%2===0) updateWanted(); }

  // Quest proximity check
  activeQuests.forEach(q=>{
    if(player.position.distanceTo(new THREE.Vector3(q.location.x,0,q.location.z))<25){
      // Simulate objective progress
      if(Math.random()<0.01) completeQuest(q);
    }
  });

  // Performance stats
  frameCount++;
  if(clock.elapsedTime - lastFpsUpdate > 0.5){
    fps = Math.round(frameCount / (clock.elapsedTime - lastFpsUpdate));
    frameCount=0; lastFpsUpdate=clock.elapsedTime;
    document.getElementById('perfFps').textContent=fps+' FPS';
    document.getElementById('fpsCounter').textContent=fps+' FPS | '+quality.toUpperCase()+' MODE';
    document.getElementById('perfDraw').textContent=renderer.info.render.triangles+' TRIS';
    // Auto quality drop if low fps on F15
    if(fps<25 && quality!=='low'){ setQuality('low'); }
  }

  renderer.render(scene,camera);
}

// Expose for UI
window.GUNS=GUNS;

// Start
init();
