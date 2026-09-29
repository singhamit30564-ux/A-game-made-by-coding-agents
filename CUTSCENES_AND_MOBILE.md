# STEALTH RESILIENCE v2.0 - CUTSCENES + MOBILE AAA

## 🎬 CUTSCENE SYSTEM (AAA)

### Engine: `src/engine/cutscene.js`
- **Letterbox**: 80px top, 120px bottom, black bars with 0.5s transition
- **Camera Paths**: Lerp with smoothstep interpolation between keyframes
- **Timeline**: Each cutscene has duration + scenes array with t (time), camPos, camLook, fov, subtitle, dialogue, effect, shake
- **Dialogue**: Speaker (Jackson/Handler/Michael), text, portrait (scraped images), color coding (Michael red, Jackson green, Handler blue)
- **Effects**: redVignette (Michael), scope (sniper), flash (gunshot), gold (victory), partyLight (yacht, hue cycling), hack (grid), slowMo (blur)
- **UI**: Subtitle bar bottom, portrait 64px, speaker name Orbitron, skip button, progress bar top, title flash 2.5s
- **Controls**: Space to skip, Skip button mobile, blocks player input/camera during play
- **Integration**: Plays on quest start, on mission complete, on V key, on HUD button

### 6 Cinematics:

1. **INTRO - THE CONTRACT (22s)**
   - Handler: "Jackson. You are the best we have. Michael Vargas must die."
   - City flyover, target reveal, Jackson line, vehicle showcase, Michael threat

2. **MISSION 01 - THE CONTRACT (12s)**
   - Docks meet handler, briefcase objective, Jackson copy

3. **MISSION 06 - SNIPER'S NEST (14s)**
   - Sniper tower 800m, wind 5mph, target Rodriguez, scope effect, flash on shot

4. **MISSION 14 - GHOST SHIP (16s)**
   - Yacht party, stealth instruction, Michael party speech, partyLight effect

5. **MISSION 27 - FINAL INTEL (18s)**
   - HQ heavily guarded, elite guard, download 30s, hack effect, location 0,1000 reveal, Michael threat

6. **MISSION 30 - ENDGAME (25s)**
   - Final compound breach, king's guard, throne room doors, Michael monologue, Jackson final line, slowMo execute, gold victory, handler extraction

### How to Trigger:
- Auto: Intro on game start
- Auto: Relevant cutscene on quest activation (contract on quest 1, sniper on 6, etc.)
- Manual: V key, HUD Cutscene button, Armoury cutscene list, Quest modal cutscene button, Mobile Cutscene button
- Skip: Space or Skip button

---

## 📱 MOBILE AAA CONTROLS

### Engine: `src/engine/mobile.js`

#### Detection:
- UserAgent Android/iPhone/iPad or width <=900
- Auto shows mobileControls, adds mobile-mode class to body

#### Dual Joystick:
- **Left**: Move (green, #00ff88) - 130px, radial gradient, dashed inner circle, arrow indicators, knob 56px with glow, haptic on edge (>0.8)
- **Right**: Look/Aim (blue, #00aaff) - same size, look vector, plus center dot
- **Implementation**: Touchstart/move/end, get center, compute dx/dy, dist capped at 70%, angle, normalized -1 to 1, knob transform, callback
- **Touch Look Zone**: Right 50% screen invisible div, swipe to look, auto decay after 100ms

#### Action Buttons (Center Right Cluster):
- **AIM (64px, gold)**: Hold for precision, slows sensitivity, crosshair grows
- **SHOOT (84px, red)**: Big red ◉, auto-aim assist, vibration 20ms
- **Jump (52px)**: ⬆, Space
- **Crouch (52px)**: ◐, green border, toggle stealth
- **Reload (52px)**: ↻
- **Sprint (52px)**: ⚡, yellow, toggle
- **Grenade (48px, rounded)**: 💣
- **Mine (48px)**: 💥
- **Vehicle (48px)**: 🚗
- **Weapon (48px)**: 🔫, cycles guns

#### Top Bar:
- Map [M], Guns [TAB], Gyro OFF/ON, Cutscene 🎬, Settings ⚙
- All buttons: rgba(0,0,0,0.6) + backdrop blur, border color coded, Orbitron 10px

#### Gyro Aim:
- Button toggles, requests permission on iOS (DeviceOrientationEvent.requestPermission)
- Listens deviceorientation, gamma (left/right) *0.01, beta (front/back) *0.01, deadzone 0.05, sets lookVector x*0.5, y*0.3, decays after 50ms
- Works on F15 5G

#### Auto-Aim Assist:
- Enabled by default, toggle in settings
- `getAutoAimTarget(camera, enemies, maxDist=80)`: camera direction, loop enemies, check health, dist, dot product >0.7, score = dot - dist*0.001, best score wins
- In shoot(): if mobile + autoAim, get target, lerp direction 0.3 towards target, visual feedback crosshair grows
- Helps on small screens

#### Haptics:
- `vibrate` in navigator check
- Patterns: 10ms edge, 20ms shoot, 30ms grenade, 40ms damage, 50ms purchase, [30,50,30] explosion
- Called on actions

#### Responsive HUD:
- mobile-mode: minimap 120px, questHud 200px, healthBar 140px, zen 14px, ammo big 20px, controls hidden, top/bottom padding reduced

#### Mobile Modal:
- Explains controls with grid, colors, gyro, auto-aim, haptics
- Toggle mobile mode button

#### Performance:
- Still F15 optimized, same LOD, but mobile forces low quality by default
- Touch events passive:false to prevent scroll, overscroll-behavior:none, tap-highlight transparent

---

## 🎮 Integration in main.js

- Import CutsceneManager, MobileController
- Init both in init()
- cutsceneManager.update(dt) in updateCamera() when playing, blocks player/enemy updates
- mobileController.getMoveInput(keys) merges joystick to WASD
- mobileController.getLookInput() adds to camYaw/Pitch
- shoot() uses auto-aim if mobile
- tryEnterVehicle(), throwGrenade(), etc check cutscene playing and block
- playCutscene(key) saves player pos/yaw/pitch, shows progress bar, plays, restores on end, handles endgame kill
- UI: playBtn triggers intro cutscene after 300ms, V key, HUD buttons, quest click triggers cutscene, armoury list, settings toggles
- New settings: toggleMobile, toggleAutoAim, toggleGyro, toggleHaptics, toggleCutscenes, fovSlider
- Crosshair aiming class for mobile AIM button and RMB
- Mobile bindings via IDs with touchstart + mousedown, vibration

---

## 📱 Testing on Galaxy F15 5G

- Device: Exynos 1330, Mali-G57 MC2, 4GB RAM, 90Hz, 6.5" FHD+
- Target: 60 FPS low, 45 FPS med
- Touch: 10-point, haptics motor
- Gyro: Yes
- Browser: Chrome mobile
- PWA: manifest.json, standalone, landscape

---

## 🚀 Future

- Voice acting with Web Speech API
- Subtitles in Hindi/English
- More cutscenes for side quests
- Mobile: pinch to zoom sniper, double-tap to sprint, hold shoot for auto
