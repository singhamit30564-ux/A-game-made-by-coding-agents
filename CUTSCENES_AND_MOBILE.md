# STEALTH RESILIENCE v2.0 - CUTSCENES + MOBILE AAA

## 🎬 CUTSCENE SYSTEM (AAA)

### Engine: `src/engine/cutscene.js`
- **Letterbox**: 52px top, 64px bottom on phones, black bars with 0.5s transition
- **Camera Paths**: Lerp with smoothstep interpolation between keyframes
- **Timeline**: Each cutscene has duration + scenes array with t (time), camPos, camLook, fov, subtitle, dialogue, effect, shake
- **Dialogue**: Speaker (Jackson/Handler/Michael), text, portrait (scraped images), color coding (Michael red, Jackson green, Handler blue)
- **Effects**: redVignette (Michael), scope (sniper), flash (gunshot), gold (victory), partyLight (yacht, hue cycling), hack (grid), slowMo (blur)
- **UI**: Subtitle bar bottom, portrait 64px, speaker name Orbitron, skip button, progress bar top, title flash 2.5s
- **Controls**: tap SKIP (mobile), blocks player input/camera during play
- **Mobile tuning**: letterbox 52px/64px, tap SKIP button >= 46px, hint reads "TAP SKIP TO CONTINUE"
- **Integration**: auto-plays on shift start, on quest start, on boss kill, and from the 🎬 top bar button

### 7 Cinematics:

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

6. **06:00 AM - GET UP FOR WORK (28s)** (auto-plays at the start of every shift)
   - Blinking red alarm, Jackson's apartment, coffee and gear check, city flyover

7. **MISSION 30 - ENDGAME (25s)**
   - Final compound breach, king's guard, throne room doors, Michael monologue, Jackson final line, slowMo execute, gold victory, handler extraction

### How to Trigger:
- Auto: `wakeUpWork` at the start of the shift, then `intro` 10s later
- Auto: Relevant cutscene on quest activation (contract on quest 1, sniper on 6, etc.)
- Auto: `endgame` when Michael is killed
- Manual: 🎬 top bar button, the wake-up button in the main menu, the armoury cutscene list
- Skip: tap the SKIP button

---

## 📱 MOBILE CONTROLS v2 (MOBILE ONLY - `mobile.html` + `src/mobile-main.js`)

> This build is **mobile only**. There is no desktop code path left: no keyboard
> listeners, no mouse listeners, no `requestPointerLock`, no quality presets.
> `index.html` is a thin bootstrap that forwards to `mobile.html`.

### Boot chain (this is what makes it work on a phone)
1. Inline script in `<head>`: `window.isMobileDevice` = UA **or** `min(w,h) <= 900`
   **or** `ontouchstart`/`maxTouchPoints`, forces `mobile-mode` before first paint.
2. `es-module-shims` loaded **before** the import map; the module graph is started
   with a dynamic `import()` on `window.load` so the shim has always processed the
   map (iOS Safari 12-16.3 included).
3. **TAP TO PLAY** button unlocks audio (mobile autoplay policy) and starts the game.
4. `window.isMobileDevice` / `body.mobile-mode` are also honoured as a CSS fallback.

### Page locks
`position:fixed` html+body, `touch-action:none`, `overscroll-behavior:none`,
`-webkit-tap-highlight-color:transparent`, plus JS guards for `gesturestart`
(iOS pinch), `dblclick` (double tap zoom), multi-touch `touchmove` (pinch) and
`contextmenu` (long-press menu). No scroll, no pull-to-refresh, no rubber band.

### Controls
| Element | Size | Notes |
| --- | --- | --- |
| Left stick MOVE | 132px, green `#00ff88` | analog, haptic at 85% deflection, auto-sprint past 92% |
| Right stick LOOK | 132px, blue `#00aaff` | crosshair lines, **rate based** (dt scaled) |
| SPRINT / CROUCH / JUMP | 38px visual | `.tap::after` gives a **52px minimum touch target** |
| RELOAD / WEAPON / USE | 38px visual | USE is context sensitive: ENTER / EXIT / SLEEP |
| SHOOT | 88px, red, `FIRE` label | hold = auto fire at the gun RPM, auto-aim 80m, 22ms haptic |
| AIM | 60px, gold | hold for precision, slows move speed |
| FLARE | 62px, orange | launches the flare picked in the selector |
| GRENADE / MINE / WORK | 44px | frag, AP mine, 06:00 alarm |
| Selector | R / G / W / ☀ / 💨 28px | red, green, white, 60K parachute, smoke |
| Top bar | MAP / GUNS / FLARES / GYRO / 🎬 / ⚙ | 34px pills, `safe-area-inset` aware |
| Weapon wheel | 500ms long press | radial, 8 owned guns, drag + release to equip |

All bottom clusters use `padding-bottom: env(safe-area-inset-bottom)` and the
whole control layer scales down under 430px of viewport height.

### Correctness details
- **Multi-touch safe**: every joystick tracks its own `touch.identifier` and reads
  `changedTouches`, so holding MOVE never corrupts LOOK.
- **z-order**: the swipe look zone sits *under* the buttons (`z-index`), otherwise
  it would steal taps from SHOOT/FLARE.
- **Haptics** via `navigator.vibrate`: 10ms edge, 22ms fire, 30ms grenade/vehicle,
  `[30,40,30]` kill, `[40,60,40]` explosion.
- **Auto-aim scoring**: `score = dot * 2 - dist/80` inside an 80m / dot > 0.7 cone;
  the crosshair flashes a red lock dot when a target is acquired.
- **Gyro**: `DeviceOrientationEvent.requestPermission()` on iOS, calibrated to the
  pose the phone is held in on the first event, `gamma`/`beta` deadzone 0.02.
- No pointer lock anywhere; `document.exitPointerLock` is never needed.

### Ultra low renderer
`pixelRatio 0.8`, `antialias:false`, `stencil:false`, `shadowMap:false`,
`FogExp2 0.004`, 40 buildings, 50 trees, 18 enemies, ground `12x12`.
Object pools for particles/projectiles/tracers, shared + merged geometries,
cached flare glow textures, and **zero allocations in the render loop**.

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
