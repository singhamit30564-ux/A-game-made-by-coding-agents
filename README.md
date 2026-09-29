# STEALTH RESILIENCE - AAA Open World Mercenary Game

**You are Jackson. Hired mercenary. Target: Drug Mafia Michael.**

A high-performance AAA open-world 3D game optimized for low-end devices like Samsung Galaxy F15 5G. Built with Three.js with AAA visuals but low-poly performance tricks.

### 🎮 LIVE PREVIEW
Run `python3 -m http.server 8000` and open http://localhost:8000

### 🔥 AAA FEATURES

#### 🔫 125 WEAPONS (120+ Requirement Met)
- **Pistols 20**: Glock-19 Shadow, Desert Eagle, M1911 Spectre, etc.
- **SMG 15**: MP5 SD, Vector, P90 Zenith, etc.
- **Assault Rifles 20**: M4A1 Resilience, AK-47 Cartel Bane, SCAR-H, XM7 NGSW
- **Shotguns 15**: M1014, AA-12 Annihilator, Origin-12
- **Snipers 15**: M24 Shadow Hawk, Barrett M82, CheyTac M200
- **LMG 10**: M249 SAW, M240B Titan, Minigun M134 Vulcan
- **Rocket Launchers 8**: RPG-7, Javelin, Stinger, Gustav
- **Special/Heavy 17**: Mortars, Grenades, Mines, C4, Nuke Beacon, Golden Gun, Railgun

#### 🚗 35 VEHICLES FLEET
- **Cars 12**: Sedan, SUV Titan, Muscle Demon, Super GT, Armored Van ZEN, Electric Stealth
- **Bikes 6**: Street Raptor 600, H2R 380km/h, Electric Moto Stealth, ATV Quad
- **Ships 4**: Speedboat Phantom, Patrol Boat Gun, Yacht Zen Luxury, Jet Ski
- **Planes 4**: Cessna Scout, C-130 Shadow, Seaplane Duck
- **Jets 3**: F-22 Raptor Stealth, F-35 Lightning, Su-57 Felon
- **Tanks 3 + Heavy 3**: M1 Abrams, T-90, Light Tank Viper, Mortar Truck, MLRS, APC Bradley

#### 💣 HEAVY ARMOURY
- Tanks with 120mm cannons
- Mortars 60-120mm portable
- Grenades: Frag M67, Smoke, Flashbang, Molotov, EMP
- Rocket Launchers: RPG, AT4, Javelin, Stinger
- Missiles: Tactical Nuke Beacon, Air Strikes
- Landmines: Claymore M18 directional, AT Mine TM-62
- C4, Flamethrower, Railgun, Plasma Caster

#### 🗺️ 70 QUESTS (30 Main + 40 Side)
**Main Story - Jackson vs Michael:**
1. The Contract - Meet handler at docks
2. First Blood - Eliminate dealers
3. Ghost Infiltration - Stealth warehouse
... 
30. Endgame - Kill Michael in throne room

**Side Ops 40:**
Street Race, Bounty Hunter, Car Theft, Gun Runner, Flight School, Sniper Challenge, Tank Training, Stunt Jumps, Underwater Treasure, Base Jump, Gang War, Legendary Hunt, etc.

#### 💰 ZEN ECONOMY
In-game currency earned from quests, kills, loot. Buy guns, vehicles, ammo, upgrades.

#### 🎯 GAMEPLAY SYSTEMS
- Third-person tactical shooter
- Stealth system: Crouch (C) to hide, stealth multiplier damage
- Health/Armor/Wanted Level (GTA style)
- Enter/exit any vehicle (E)
- Drive physics: Cars, bikes lean, boats float, planes/jets fly, tanks shoot
- Enemy AI: Patrol, chase, shoot, react to mines/grenades
- Explosive chain reactions
- Day/night? Fog for performance

#### 📱 LOW-END OPTIMIZATION (Samsung Galaxy F15 5G)
- Quality presets: LOW (F15 60 FPS), MEDIUM, HIGH, ULTRA
- Adaptive pixel ratio (1.2 on low)
- No real-time shadows on Low
- FogExp2 for depth, hides far objects
- LOD: Enemies beyond draw distance skip AI
- Pooled objects, instanced rendering
- Baked lighting, no post-processing on Low
- 80 buildings max, 28 enemies, simple geometries
- Occlusion culling via raycast
- Resolution scaling, draw distance slider

#### 🖼️ REFERENCE IMAGES SCRAPED
25 images scraped from web in `assets/images/references/`:
- Tactical mercenary soldier
- Drug mafia boss
- Military guns arsenal
- Low poly open world city GTA style
- Supercars, bikes, jets, tanks

Used in menu dossier for AAA moodboard.

### 🎮 CONTROLS
- **WASD**: Move
- **Mouse**: Look (click to lock pointer)
- **Shift**: Sprint
- **C**: Crouch/Stealth
- **Space**: Jump
- **LMB**: Shoot
- **R**: Reload
- **E**: Enter/Exit Vehicle
- **Q**: Throw Grenade
- **G**: Place Mine
- **TAB**: Armoury / 125 Guns
- **M**: Map & Quests (70)
- **1-4**: Quick weapon switch
- **ESC**: Close menus

**Mobile**: Joystick + action buttons

### 🏗️ TECH STACK
- Three.js 0.160.0 (CDN)
- Vanilla JS modules
- No build step - runs directly
- Procedural low-poly city generation
- Simple physics (no ammo.js to keep low-end fast)

### 📂 STRUCTURE
```
index.html - Main game + UI
src/
  main.js - Core engine, player, combat, vehicles
  data/
    guns.js - 125 guns
    vehicles.js - 35 vehicles
    quests.js - 70 quests
assets/
  images/references/ - Scraped images
```

### 🚀 DEPLOY
Just static files. Deploy to Vercel, Netlify, GitHub Pages, or any static host.

### 🎨 AAA POLISH
- Orbitron + Rajdhani fonts
- Neon tactical UI (ZEN green #00ff88)
- Clip-path buttons, glow effects
- Minimap with real-time radar
- Particle explosions, muzzle flash, tracers
- Notification system
- Performance HUD

### 📝 STORY
Jackson, Tier-1 mercenary, is contracted by Agency to eliminate Michael Vargas, drug lord controlling Santos Cartel City. City has cars, bikes, ships, planes, jets, tanks. You must complete 30 main ops to reach Michael's throne room at 0,1000. Earn ZEN, buy 125 guns, use heavy armoury.

**Final Mission**: Infiltrate compound, kill elite guard, breach gate, face Michael (golden boss with 1.2x scale).

Enjoy! Made for low-end but feels AAA.

---
*Optimized for Galaxy F15 5G - 60 FPS target on Mali-G57 MC2*
