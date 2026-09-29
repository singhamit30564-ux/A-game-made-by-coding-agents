// F15 5G OPTIMIZATION PROFILE (MOBILE ONLY)
// Samsung Galaxy F15 5G: Exynos 1330, Mali-G57 MC2, 4-6GB RAM, 90Hz panel.
// Target: locked 60 FPS. Everything below is the budget the renderer,
// the world generator and the particle system are built around.

export const MOBILE_PROFILE = {
  pixelRatio: 0.8,      // sub native buffer: the biggest single win on a 1080p phone
  antialias: false,
  shadows: false,
  stencil: false,
  fogDensity: 0.004,    // hides the horizon early, fewer pixels shaded
  drawDistance: 550,
  buildings: 40,        // was 80
  trees: 50,            // was 120
  enemies: 18,          // was 28
  groundSegments: 12,   // was 30
  particleLimit: 70,
  projectileLimit: 24,
  tracerLimit: 10,
  maxFlares: 8
};

export const Optimization = {
  /* Cheap heuristic - no WebGL debug info needed, keeps cold start fast. */
  detectDevice() {
    const nav = navigator;
    return {
      isLowEnd: (nav.hardwareConcurrency || 4) <= 4 || (nav.deviceMemory || 4) <= 3,
      cores: nav.hardwareConcurrency || 4,
      memory: nav.deviceMemory || 4,
      maxTouchPoints: nav.maxTouchPoints || 0,
      screen: Math.min(window.innerWidth, window.innerHeight) + 'x' + Math.max(window.innerWidth, window.innerHeight),
      dpr: window.devicePixelRatio || 1
    };
  },

  /* Everything is capped by the mobile profile; the tier only trims the world. */
  getQualityPreset(device) {
    if (device.isLowEnd) return { ...MOBILE_PROFILE, buildings: 30, trees: 34, enemies: 14, drawDistance: 450 };
    return { ...MOBILE_PROFILE };
  },

  /* Simple object pool - phones choke on per-frame allocation / GC. */
  createPool(factory, size) {
    const pool = [];
    for (let i = 0; i < size; i++) pool.push(factory());
    return {
      acquire() { return pool.pop() || factory(); },
      release(obj) { if (pool.length < size) pool.push(obj); }
    };
  }
};
