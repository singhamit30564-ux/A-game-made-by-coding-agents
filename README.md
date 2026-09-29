# STEALTH RESILIENCE - AAA Open World Mercenary Game (MOBILE)

**You are Jackson. Hired mercenary. Target: Drug Mafia Michael.**

A high-performance AAA open-world 3D game that runs **mobile only**, tuned for
Samsung Galaxy F15 5G. Three.js visuals, low-poly performance tricks, pure touch
controls.

> 📱 **This build is mobile only.** There is no desktop code path: no keyboard, no
> mouse, no pointer lock. Every action is a touch target.

### 🎮 LIVE PREVIEW
```bash
python3 -m http.server 8000
```
Open **http://<your-machine-ip>:8000/mobile.html** on your phone.
`index.html` simply forwards to `mobile.html`.

### 🔥 AAA FEATURES

#### 🔫 132 WEAPONS (120+ Requirement Met)
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

#### 🚀 10 FLARE TYPES
Signal red / green / white, 60k-candlepower parachute illumination (200m, 45s),
red / green / white smoke, distress SOS burst, IR strobe, M79 flare gun.
Each burns a flickering `PointLight`, carries a cached glow sprite and a smoke
trail; the illumination flare flies a parachute. A **red flare within 200m of
Michael's throne (0,1000) calls a missile strike**.

#### ⏰ WORK SHIFT
Jackson's apartment sits at **-25,-25**. The 06:00 alarm UI blinks red with
`assets/audio/wakeup-alarm.mp3`; the shift clock runs 06:00 -> 22:00 (2 real
seconds = 1 game minute). Tap **USE** at the apartment to sleep until 06:00.

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
- Stealth system: crouch to hide, stealth multiplier damage
- Health/Armor/Wanted Level (GTA style)
- Enter/exit any vehicle with the USE button
- Drive physics: Cars, bikes lean, boats float, planes/jets fly, tanks shoot
- Enemy AI: Patrol, chase, shoot, react to mines/grenades
- Explosive chain reactions
- Day/night? Fog for performance

#### 📱 ULTRA LOW MOBILE PROFILE (Samsung Galaxy F15 5G)
| Setting | Value |
| --- | --- |
| Pixel ratio | **0.8** (sub-native buffer) |
| Antialias / shadows / stencil | **off / off / off** |
| Fog | **FogExp2 0.004** |
| Buildings / trees / enemies | **40 / 50 / 18** |
| Ground segments | **12 x 12** |
| Particles / projectiles / tracers / flares | pooled **70 / 24 / 10 / 8** |
| Draw distance | 550m (slider 250-900) |

Plus: zero allocations in the render loop (scratch vectors), shared road
geometry (1 draw call), merged tree meshes, cached flare glow textures,
raycast-disabled HUD sprites, and DOM writes only when a value changes.

#### 🖼️ REFERENCE IMAGES SCRAPED
25 images scraped from web in `assets/images/references/`:
- Tactical mercenary soldier
- Drug mafia boss
- Military guns arsenal
- Low poly open world city GTA style
- Supercars, bikes, jets, tanks

Used in menu dossier for AAA moodboard.

### 🎮 TOUCH CONTROLS (mobile only)
| Control | Action |
| --- | --- |
| **Left stick 132px (green)** | Move (analog) - push to the edge to auto-sprint |
| **Right stick 132px (blue)** | Look / aim (rate based, dt-scaled) |
| **SPRINT / CROUCH / JUMP 38px** | Row under the left stick (52px touch targets) |
| **RELOAD / WEAPON / USE 38px** | Row under the right stick |
| **SHOOT 88px (red, FIRE)** | Hold to auto-fire, auto-aim within 80m, 22ms haptic |
| **AIM 60px (gold)** | Hold for precision aim |
| **FLARE 62px (orange)** | Launch the selected flare |
| **R / G / W / ☀ / 💨 pills** | Flare selector: red, green, white, 60K parachute, smoke |
| **GRENADE / MINE / WORK / USE** | Context actions (USE = enter/exit vehicle, sleep at the apartment) |
| **WEAPON long press 500ms** | Radial weapon wheel (8 owned guns) |
| **Top bar MAP / GUNS / FLARES / GYRO / 🎬 / ⚙** | Menus + gyro tilt aim |
| **Swipe the right half** | Alternate look input

Haptics: 10ms stick edge, 22ms fire, 30ms grenade/vehicle, `[30,40,30]` on kill,
`[40,60,40]` on explosion. Gyro ask-for-permission on iOS 13+ and calibrates to
the pose the phone is held in.

### 🏗️ TECH STACK
- Three.js 0.160.0 (CDN)
- Vanilla JS modules
- No build step - runs directly
- Procedural low-poly city generation
- Simple physics (no ammo.js to keep low-end fast)

### 📂 STRUCTURE
```
mobile.html            - MOBILE ENTRY (main entry point, tap-to-play boot)
index.html             - mobile-first bootstrap that forwards to mobile.html
vercel.json            - rewrites / -> /mobile.html
manifest.json          - PWA, start_url ./mobile.html
src/
  mobile-main.js       - core engine, player, combat, vehicles, work shift
  engine/
    mobile.js          - dual stick v2, weapon wheel, gyro, auto-aim, haptics
    cutscene.js        - 7 cinematic cutscenes
    flares.js          - 10 flare types
    optimization.js    - ultra low mobile profile
  data/
    guns.js - 132 guns
    vehicles.js - 35 vehicles
    quests.js - 70 quests
assets/
  audio/               - wakeup-alarm.mp3, morning-briefing.mp3
  images/references/   - menu / cutscene portraits
```

### 🚀 DEPLOY (Vercel)
Static files, no build step. `vercel.json` rewrites `/` to `/mobile.html`, so both
of these work on a phone:
- `https://<your-site>.vercel.app/`
- `https://<your-site>.vercel.app/mobile.html`

**iOS Safari**: `es-module-shims` is loaded before the import map and the module
graph is started with a dynamic `import()` on `window.load`, so bare specifiers
resolve on iOS 12+ as well as 16.4+.

**Audio**: mobile autoplay policy is satisfied by the **TAP TO PLAY** button on
the loading screen (it also resumes the AudioContext).

### 🎨 AAA POLISH
- Orbitron + Rajdhani fonts
- Neon tactical UI (ZEN green #00ff88)
- Clip-path buttons, glow effects
- Minimap with real-time radar
- Particle explosions, muzzle flash, tracers
- Notification system
- Performance HUD

### 📝 STORY
Jackson, Tier-1 mercenary, is contracted by Agency to eliminate Michael Vargas, drug lord controlling Santos Cartel City. City has cars, bikes, ships, planes, jets, tanks. You must complete 30 main ops to reach Michael's throne room at 0,1000. Earn ZEN, buy 132 guns, use heavy armoury.

**Final Mission**: Infiltrate compound, kill elite guard, breach gate, face Michael (golden boss with 1.2x scale).

Enjoy! Made for low-end but feels AAA.

---
*Optimized for Galaxy F15 5G - 60 FPS target on Mali-G57 MC2*
