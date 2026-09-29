// F15 5G OPTIMIZATION ENGINE
// Samsung Galaxy F15 5G Specs: Exynos 1330, Mali-G57 MC2, 4-6GB RAM, 90Hz
// Target: 60 FPS on low, 30 FPS on high

export const Optimization = {
  // Adaptive quality
  detectDevice() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
    const isLowEnd = /Mali|Adreno.*3|Adreno.*4|PowerVR/.test(renderer) || navigator.hardwareConcurrency <= 4;
    return {
      renderer,
      isLowEnd,
      cores: navigator.hardwareConcurrency || 4,
      memory: navigator.deviceMemory || 4,
      isMobile: /Android|iPhone|iPad/.test(navigator.userAgent)
    };
  },

  getQualityPreset(device) {
    if(device.isLowEnd || device.isMobile) return 'low';
    if(device.memory < 6) return 'medium';
    return 'high';
  },

  applyPreset(renderer, scene, quality) {
    const presets = {
      low: {
        pixelRatio: 1.1,
        shadows: false,
        fogDensity: 0.0035,
        maxBuildings: 80,
        maxEnemies: 28,
        drawDistance: 600,
        antialias: false,
        particleLimit: 50
      },
      medium: {
        pixelRatio: 1.5,
        shadows: true,
        shadowMapSize: 1024,
        fogDensity: 0.0025,
        maxBuildings: 120,
        maxEnemies: 35,
        drawDistance: 900,
        antialias: true,
        particleLimit: 100
      },
      high: {
        pixelRatio: 2,
        shadows: true,
        shadowMapSize: 2048,
        fogDensity: 0.0018,
        maxBuildings: 180,
        maxEnemies: 45,
        drawDistance: 1300,
        antialias: true,
        particleLimit: 200
      }
    };
    return presets[quality] || presets.low;
  },

  // Object pooling for low-end
  createPool(factory, size) {
    const pool = [];
    for(let i=0;i<size;i++) pool.push(factory());
    return {
      acquire: () => pool.pop() || factory(),
      release: (obj) => { if(pool.length < size*2) pool.push(obj); }
    };
  },

  // LOD system
  updateLOD(objects, cameraPos, drawDistance) {
    objects.forEach(obj => {
      const dist = obj.position.distanceTo(cameraPos);
      obj.visible = dist < drawDistance * 1.2;
      if(obj.userData.lod) {
        const level = dist < 200 ? 0 : dist < 600 ? 1 : 2;
        obj.userData.lod.setLevel(level);
      }
    });
  }
};
