// STEALTH RESILIENCE - AAA CUTSCENE SYSTEM
// Cinematic letterbox, camera paths, subtitles, character dialogue

export const CUTSCENES = {
  wakeUpWork: {
    title: "06:00 AM - GET UP FOR WORK",
    duration: 28,
    scenes: [
      {t:0, camPos:[-5,1.2,3], camLook:[0,1,0], fov:75, subtitle:"JACKSON'S APARTMENT - 06:00 AM - ALARM RINGING", dialogue:{speaker:"Alarm", text:"BEEP BEEP BEEP! Get up for work, Jackson!", portrait:"handler"}, effect:"alarm", shake:0.3},
      {t:3, camPos:[-2,1.5,2], camLook:[0,1,0], fov:60, subtitle:"", dialogue:{speaker:"Jackson", text:"Ugh... five more minutes... No, Michael won't wait.", portrait:"jackson"}},
      {t:6, camPos:[0,1.8,4], camLook:[0,1,0], fov:50, subtitle:"MORNING ROUTINE - COFFEE + GEAR CHECK", dialogue:{speaker:"Handler (Radio)", text:"Jackson! Get up for work! It's 6 AM. Michael won't kill himself. Your contract is waiting!", portrait:"handler"}, effect:"radio"},
      {t:10, camPos:[1,1.2,1], camLook:[0,1,0], fov:45, subtitle:"125 GUNS CLEANED - 35 VEHICLES FUELED", dialogue:{speaker:"Jackson", text:"Coffee black, guns loaded, Zen to earn. Let's go to work.", portrait:"jackson"}},
      {t:14, camPos:[0,8,0], camLook:[0,0,0], fov:70, subtitle:"SANTOS CITY - MORNING SHIFT START", dialogue:{speaker:"Handler", text:"Daily briefing: 3 new side ops, 2 tons moved last night. Get to work, mercenary.", portrait:"handler"}},
      {t:18, camPos:[200,20,300], camLook:[200,0,300], fov:60, subtitle:"FIRST JOB: DOCKS - 500 ZEN", dialogue:{speaker:"Jackson", text:"On my way. Time to earn that Zen.", portrait:"jackson"}},
      {t:22, camPos:[0,20,0], camLook:[0,0,0], fov:80, subtitle:"WORK STARTS NOW - 70 MISSIONS AWAIT", dialogue:null, effect:"gold"},
    ]
  },
  intro: {
    title: "INTRO - THE CONTRACT",
    duration: 22,
    scenes: [
      {t:0, camPos:[0,80,120], camLook:[0,0,0], fov:60, subtitle:"", dialogue:{speaker:"Handler", text:"Jackson. You are the best we have. Michael Vargas must die.", portrait:"handler"}, letterbox:true, music:"tense"},
      {t:3, camPos:[200,30,-100], camLook:[0,0,0], fov:50, subtitle:"SANTOS CARTEL CITY - 02:14 AM", dialogue:null, shake:0.2},
      {t:6, camPos:[-80,8,80], camLook:[0,2,0], fov:40, subtitle:"TARGET: MICHAEL VARGAS - DRUG MAFIA BOSS", dialogue:{speaker:"Handler", text:"He controls 70% of Zen flow. 125 guns won't be enough. Use everything. Cars, bikes, jets, tanks.", portrait:"handler"}},
      {t:10, camPos:[0,3,8], camLook:[0,2,0], fov:35, subtitle:"YOU ARE JACKSON - TIER 1 MERCENARY", dialogue:{speaker:"Jackson", text:"One shot. One kill. That's the contract.", portrait:"jackson"}},
      {t:14, camPos:[900,60,300], camLook:[900,0,300], fov:70, subtitle:"VEHICLES, HEAVY ARMOURY, 70 MISSIONS AWAIT", dialogue:{speaker:"Handler", text:"City is your weapon. Cars, bikes, ships, planes, jets, tanks. Even mortars and missile strikes.", portrait:"handler"}},
      {t:18, camPos:[0,0.5,1000], camLook:[0,5,1000], fov:25, subtitle:"FINAL TARGET LOCATION CLASSIFIED", dialogue:{speaker:"Michael", text:"You think you can kill me, Jackson? This city is mine!", portrait:"michael"}, effect:"redVignette"},
    ]
  },
  contract: {
    title: "MISSION 01 - THE CONTRACT",
    duration: 12,
    scenes: [
      {t:0, camPos:[200,15,300], camLook:[200,0,300], fov:45, subtitle:"DOCKS - MEET HANDLER", dialogue:{speaker:"Handler", text:"Briefcase has intel. 500 Zen advance. Don't get killed.", portrait:"handler"}},
      {t:5, camPos:[200,2,305], camLook:[210,2,300], fov:50, subtitle:"OBJECTIVE: GET BRIEFCASE", dialogue:{speaker:"Jackson", text:"Copy. Moving to docks.", portrait:"jackson"}},
      {t:9, camPos:[0,20,0], camLook:[200,0,300], fov:60, subtitle:"", dialogue:null},
    ]
  },
  sniper: {
    title: "MISSION 06 - SNIPER'S NEST",
    duration: 14,
    scenes: [
      {t:0, camPos:[600,80,200], camLook:[600,0,200], fov:20, subtitle:"SNIPER TOWER - 800M DISTANCE", dialogue:{speaker:"Handler", text:"Rodriguez is Michael's lieutenant. Headshot only. No witnesses.", portrait:"handler"}},
      {t:4, camPos:[550,30,180], camLook:[600,5,200], fov:15, subtitle:"WIND: 5MPH WEST - ADJUST 2 MIL", dialogue:{speaker:"Jackson", text:"Target acquired. One shot.", portrait:"jackson"}, effect:"scope"},
      {t:8, camPos:[600,5,200], camLook:[620,5,210], fov:10, subtitle:"TARGET: RODRIGUEZ - CARTEL LT", dialogue:{speaker:"Rodriguez", text:"Boss said Jackson is coming... *static*", portrait:"enemy"}},
      {t:11, camPos:[600,2,200], camLook:[0,0,0], fov:90, subtitle:"", dialogue:null, effect:"flash"},
    ]
  },
  yacht: {
    title: "MISSION 14 - GHOST SHIP",
    duration: 16,
    scenes: [
      {t:0, camPos:[700,20,-600], camLook:[700,0,-600], fov:50, subtitle:"MICHAEL'S YACHT - PARTY IN PROGRESS", dialogue:{speaker:"Handler", text:"Michael is hosting cartel party on yacht. Plant bug in his cabin. Stealth only.", portrait:"handler"}},
      {t:5, camPos:[700,2,-590], camLook:[700,2,-600], fov:35, subtitle:"AVOID GUARDS - USE SUPPRESSED WEAPONS", dialogue:{speaker:"Jackson", text:"Ghost mode. No sound.", portrait:"jackson"}},
      {t:9, camPos:[705,5,-600], camLook:[700,0,-600], fov:60, subtitle:"", dialogue:{speaker:"Michael", text:"Tonight we celebrate! Santos is ours! *laughs*", portrait:"michael"}, effect:"partyLight"},
      {t:13, camPos:[700,30,-600], camLook:[0,0,0], fov:70, subtitle:"BUG PLANTED - ESCAPE", dialogue:null},
    ]
  },
  finalIntel: {
    title: "MISSION 27 - FINAL INTEL",
    duration: 18,
    scenes: [
      {t:0, camPos:[0,100,800], camLook:[0,0,800], fov:40, subtitle:"MICHAEL'S HQ - HEAVILY GUARDED", dialogue:{speaker:"Handler", text:"This is it, Jackson. Get his location. 8000 Zen if you succeed.", portrait:"handler"}},
      {t:4, camPos:[50,10,820], camLook:[0,5,800], fov:30, subtitle:"ELITE GUARD - 8 MEN", dialogue:{speaker:"Elite Guard", text:"No one enters! Michael's orders!", portrait:"enemy"}},
      {t:8, camPos:[0,5,800], camLook:[0,5,850], fov:35, subtitle:"DOWNLOAD DATA - 30 SECONDS", dialogue:{speaker:"Jackson", text:"Downloading... come on...", portrait:"jackson"}, effect:"hack"},
      {t:12, camPos:[0,40,900], camLook:[0,0,1000], fov:50, subtitle:"LOCATION FOUND: 0,1000 - THRONE ROOM", dialogue:{speaker:"Handler", text:"We have him! Throne room at 0,1000. End this, Jackson.", portrait:"handler"}},
      {t:15, camPos:[0,2,1000], camLook:[0,5,1000], fov:25, subtitle:"FINAL TARGET LOCKED", dialogue:{speaker:"Michael", text:"You found me. Now die trying.", portrait:"michael"}, effect:"redVignette"},
    ]
  },
  endgame: {
    title: "MISSION 30 - ENDGAME",
    duration: 25,
    scenes: [
      {t:0, camPos:[0,50,900], camLook:[0,0,1000], fov:60, subtitle:"FINAL COMPOUND - BREACH", dialogue:{speaker:"Handler", text:"Outer defenses down. This is your path to Michael. 50,000 Zen on completion.", portrait:"handler"}},
      {t:4, camPos:[0,10,950], camLook:[0,5,1000], fov:45, subtitle:"KING'S GUARD ELIMINATED", dialogue:{speaker:"Jackson", text:"Guards down. Moving to throne room.", portrait:"jackson"}},
      {t:8, camPos:[0,3,990], camLook:[0,3,1000], fov:30, subtitle:"THRONE ROOM DOORS", dialogue:{speaker:"Michael", text:"Jackson... I have been waiting. You killed my men, burned my fields, sank my ships.", portrait:"michael"}},
      {t:12, camPos:[5,3,1000], camLook:[0,3,1000], fov:35, subtitle:"CONFRONTATION", dialogue:{speaker:"Michael", text:"I built this empire from nothing! You think Zen can buy my death? I AM SANTOS!", portrait:"michael"}, effect:"redVignette", shake:0.5},
      {t:16, camPos:[-3,3,1000], camLook:[0,3,1000], fov:28, subtitle:"", dialogue:{speaker:"Jackson", text:"Contract is contract. Goodbye, Michael.", portrait:"jackson"}},
      {t:19, camPos:[0,5,1000], camLook:[0,3,1000], fov:20, subtitle:"EXECUTE TARGET", dialogue:null, effect:"slowMo"},
      {t:22, camPos:[0,80,1000], camLook:[0,0,1000], fov:70, subtitle:"STEALTH RESILIENCE - MISSION COMPLETE", dialogue:{speaker:"Handler", text:"Target eliminated. Jackson, you are legend. Come home.", portrait:"handler"}, effect:"gold"},
    ]
  }
};

export class CutsceneManager {
  constructor(camera, scene, renderer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.active = false;
    this.current = null;
    this.time = 0;
    this.onEnd = null;
    this.createUI();
  }

  createUI() {
    // Letterbox
    this.letterboxTop = document.createElement('div');
    this.letterboxTop.style.cssText = 'position:fixed;top:0;left:0;right:0;height:0;background:#000;z-index:7000;transition:height 0.5s;pointer-events:none';
    this.letterboxBottom = document.createElement('div');
    this.letterboxBottom.style.cssText = 'position:fixed;bottom:0;left:0;right:0;height:0;background:#000;z-index:7000;transition:height 0.5s;pointer-events:none';
    document.body.appendChild(this.letterboxTop);
    document.body.appendChild(this.letterboxBottom);

    // Subtitle / dialogue box
    this.dialogueBox = document.createElement('div');
    this.dialogueBox.style.cssText = `
      position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:7001;
      width:min(700px,90vw);background:linear-gradient(135deg,rgba(10,14,19,0.95),rgba(0,0,0,0.9));
      border:1px solid rgba(0,255,136,0.3);padding:16px 20px;display:none;backdrop-filter:blur(20px);
      font-family:'Rajdhani',sans-serif;box-shadow:0 10px 40px rgba(0,0,0,0.8)
    `;
    this.dialogueBox.innerHTML = `
      <div style="display:flex;gap:14px;align-items:flex-start">
        <img id="csPortrait" src="" style="width:64px;height:64px;object-fit:cover;border:1px solid rgba(0,255,136,0.3);display:none">
        <div style="flex:1">
          <div id="csSpeaker" style="font-family:'Orbitron';color:#00ff88;font-size:12px;letter-spacing:0.15em;margin-bottom:4px"></div>
          <div id="csText" style="font-size:18px;line-height:1.4;color:#fff"></div>
          <div id="csSubtitle" style="font-size:11px;opacity:0.6;margin-top:6px;letter-spacing:0.1em;font-family:'Orbitron'"></div>
        </div>
      </div>
      <div style="position:absolute;top:8px;right:12px;font-size:10px;opacity:0.5;font-family:'Orbitron'">CUTSCENE [SPACE TO SKIP]</div>
    `;
    document.body.appendChild(this.dialogueBox);

    // Title
    this.titleEl = document.createElement('div');
    this.titleEl.style.cssText = `
      position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:7002;
      font-family:'Orbitron';font-weight:900;font-size:clamp(24px,5vw,48px);color:#fff;
      text-shadow:0 0 20px #00ff88;letter-spacing:0.2em;display:none;pointer-events:none;text-align:center
    `;
    document.body.appendChild(this.titleEl);

    // Effects overlay
    this.effectOverlay = document.createElement('div');
    this.effectOverlay.style.cssText = 'position:fixed;inset:0;z-index:6999;pointer-events:none;display:none;';
    document.body.appendChild(this.effectOverlay);

    // Skip button (mobile)
    this.skipBtn = document.createElement('button');
    this.skipBtn.textContent = 'SKIP ▶▶';
    this.skipBtn.style.cssText = `
      position:fixed;bottom:20px;right:20px;z-index:7003;display:none;
      background:rgba(0,0,0,0.7);border:1px solid rgba(255,255,255,0.2);color:#fff;
      padding:10px 20px;font-family:'Orbitron';font-size:12px;cursor:pointer
    `;
    this.skipBtn.onclick = () => this.end();
    document.body.appendChild(this.skipBtn);

    window.addEventListener('keydown', e=>{
      if(this.active && e.code==='Space'){ this.end(); }
    });
  }

  play(key, onEnd) {
    const cs = CUTSCENES[key];
    if(!cs) return;
    this.current = cs;
    this.time = 0;
    this.active = true;
    this.onEnd = onEnd;
    this.letterboxTop.style.height = '80px';
    this.letterboxBottom.style.height = '120px';
    this.dialogueBox.style.display = 'block';
    this.skipBtn.style.display = 'block';
    this.titleEl.textContent = cs.title;
    this.titleEl.style.display = 'block';
    setTimeout(()=>{ this.titleEl.style.display='none'; }, 2500);
    document.getElementById('hud').style.opacity='0.2';
    console.log(`[CUTSCENE] Playing ${key}`);
  }

  update(dt) {
    if(!this.active || !this.current) return;
    this.time += dt;
    if(this.time > this.current.duration) {
      this.end();
      return;
    }

    // Find current scene segment
    let currentScene = this.current.scenes[0];
    for(let i=0;i<this.current.scenes.length;i++){
      if(this.time >= this.current.scenes[i].t) currentScene = this.current.scenes[i];
    }

    // Interpolate camera
    const nextIdx = this.current.scenes.indexOf(currentScene)+1;
    const nextScene = this.current.scenes[nextIdx];
    let t = 0;
    if(nextScene) {
      t = (this.time - currentScene.t) / (nextScene.t - currentScene.t);
      t = Math.min(1, Math.max(0, t));
      // Smoothstep
      t = t*t*(3-2*t);
    }

    if(nextScene && t<1) {
      // Lerp pos
      const pos = this.lerpArr(currentScene.camPos, nextScene.camPos, t);
      const look = this.lerpArr(currentScene.camLook, nextScene.camLook, t);
      const fov = currentScene.fov + (nextScene.fov - currentScene.fov)*t;
      this.camera.position.set(...pos);
      this.camera.lookAt(look[0], look[1], look[2]);
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera.position.set(...currentScene.camPos);
      this.camera.lookAt(currentScene.camLook[0], currentScene.camLook[1], currentScene.camLook[2]);
      this.camera.fov = currentScene.fov;
      this.camera.updateProjectionMatrix();
    }

    // Shake
    if(currentScene.shake) {
      this.camera.position.x += (Math.random()-0.5)*currentScene.shake;
      this.camera.position.y += (Math.random()-0.5)*currentScene.shake;
    }

    // Update dialogue
    const speakerEl = document.getElementById('csSpeaker');
    const textEl = document.getElementById('csText');
    const subEl = document.getElementById('csSubtitle');
    const portraitEl = document.getElementById('csPortrait');

    if(currentScene.dialogue) {
      speakerEl.textContent = currentScene.dialogue.speaker.toUpperCase();
      textEl.textContent = currentScene.dialogue.text;
      // Portrait mapping
      const portraitMap = {
        jackson: 'assets/images/references/tactical-mercenary-soldier-stealth-black-1.jpg',
        michael: 'assets/images/references/drug-mafia-boss-cartel-villain-portrait-1.jpg',
        handler: 'assets/images/references/tactical-mercenary-soldier-stealth-black-2.jpg',
        enemy: 'assets/images/references/drug-mafia-boss-cartel-villain-portrait-3.jpg'
      };
      const src = portraitMap[currentScene.dialogue.portrait] || portraitMap.handler;
      portraitEl.src = src;
      portraitEl.style.display = 'block';
      speakerEl.style.color = currentScene.dialogue.speaker==='Michael' ? '#ff2040' : currentScene.dialogue.speaker==='Jackson' ? '#00ff88' : '#00aaff';
    } else {
      speakerEl.textContent = '';
      textEl.textContent = '';
      portraitEl.style.display = 'none';
    }
    subEl.textContent = currentScene.subtitle || '';

    // Effects
    this.updateEffect(currentScene.effect);
  }

  lerpArr(a,b,t){
    return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  }

  updateEffect(effect){
    if(!effect){ this.effectOverlay.style.display='none'; return; }
    this.effectOverlay.style.display='block';
    if(effect==='redVignette'){
      this.effectOverlay.style.background='radial-gradient(ellipse at center, transparent 40%, rgba(255,32,64,0.4) 100%)';
    } else if(effect==='scope'){
      this.effectOverlay.style.background='radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.9) 70%)';
      this.effectOverlay.innerHTML='<div style="position:absolute;left:50%;top:50%;width:80%;height:2px;background:rgba(255,255,255,0.3);transform:translate(-50%,-50%)"></div><div style="position:absolute;left:50%;top:50%;width:2px;height:80%;background:rgba(255,255,255,0.3);transform:translate(-50%,-50%)"></div>';
    } else if(effect==='flash'){
      this.effectOverlay.style.background='rgba(255,255,255,0.8)';
      setTimeout(()=>{ this.effectOverlay.style.background='transparent'; },100);
    } else if(effect==='gold'){
      this.effectOverlay.style.background='radial-gradient(ellipse at center, rgba(255,204,0,0.3), transparent 70%)';
    } else if(effect==='partyLight'){
      const hue = (Date.now()/20)%360;
      this.effectOverlay.style.background=`hsla(${hue},100%,50%,0.15)`;
    } else if(effect==='hack'){
      this.effectOverlay.style.background='repeating-linear-gradient(0deg, rgba(0,255,136,0.05) 0px, transparent 2px, transparent 4px)';
    } else if(effect==='slowMo'){
      this.effectOverlay.style.background='rgba(0,0,0,0.3)';
      this.effectOverlay.style.backdropFilter='blur(2px)';
    } else if(effect==='alarm'){
      this.effectOverlay.style.background='rgba(255,32,64,0.2)';
      this.effectOverlay.style.animation='alarmBlink 0.3s infinite alternate';
    } else if(effect==='radio'){
      this.effectOverlay.style.background='repeating-linear-gradient(90deg, rgba(0,255,136,0.05) 0px, transparent 3px)';
      this.effectOverlay.innerHTML='<div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);font-family:Orbitron;font-size:12px;color:#00ff88;letter-spacing:0.3em;opacity:0.7">📻 RADIO TRANSMISSION - 06:02 AM</div>';
    } else {
      this.effectOverlay.style.background='transparent';
      this.effectOverlay.innerHTML='';
    }
  }

  end(){
    if(!this.active) return;
    this.active = false;
    this.letterboxTop.style.height='0';
    this.letterboxBottom.style.height='0';
    this.dialogueBox.style.display='none';
    this.skipBtn.style.display='none';
    this.titleEl.style.display='none';
    this.effectOverlay.style.display='none';
    document.getElementById('hud').style.opacity='1';
    if(this.onEnd) this.onEnd();
    this.current=null;
  }

  isPlaying(){ return this.active; }
}
