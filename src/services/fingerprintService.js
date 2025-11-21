/**
 * Browser Fingerprinting Service
 * Genera un hash único basado en características del navegador
 * 
 * Uso:
 * const fingerprint = await generateBrowserFingerprint();
 * // Devuelve algo como: "a1b2c3d4e5f6..." (64 caracteres)
 */

/**
 * Simple SHA256 implementation (usando SubtleCrypto si está disponible)
 */
async function sha256(message) {
  try {
    // Si el navegador soporta SubtleCrypto (moderno)
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }
  } catch (e) {
  }
  
  // Fallback: Simple hash (no es SHA256 real, pero suficientemente único)
  return simpleHash(message);
}

/**
 * Simple hash fallback (no es SHA256, pero bastante único)
 */
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a integer de 32-bit
  }
  return Math.abs(hash).toString(16);
}

/**
 * Genera fingerprint del canvas (muy único por GPU/driver)
 */
function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Especificaciones del canvas
    canvas.width = 280;
    canvas.height = 60;
    
    // Fondo
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgb(200, 50, 50)';
    ctx.fill();
    
    // Texto principal
    ctx.textBaseline = 'alphabetic';
    ctx.font = '25px Arial';
    ctx.fillStyle = 'rgb(26, 26, 26)';
    ctx.fillText('Voia Browser Fingerprint 🚀', 10, 30);
    
    // Más texto
    ctx.font = '12px Arial';
    ctx.fillStyle = 'rgb(100, 200, 100)';
    ctx.fillText('uuid:' + Math.random().toString(36).slice(2), 10, 50);
    
    // Obtener datos de imagen
    const dataURL = canvas.toDataURL();
    
    // Devolver solo un fragmento del dataURL (para no ser demasiado largo)
    return dataURL.substring(50, 150);
  } catch (e) {
    return 'canvas-unavailable';
  }
}

/**
 * Genera fingerprint de WebGL (información de GPU)
 */
function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return 'webgl-unavailable';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return `${vendor}|${renderer}`;
    }
    
    return 'webgl-available';
  } catch (e) {
    return 'webgl-unavailable';
  }
}

/**
 * Genera fingerprint de audio (muy único por hardware)
 */
async function getAudioFingerprint() {
  try {
    const audioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioContext) return 'audio-unavailable';
    
    const context = new audioContext();
    const oscillator = context.createOscillator();
    const analyser = context.createAnalyser();
    const gain = context.createGain();
    const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
    
    gain.gain.value = 0; // Sin sonido
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gain);
    gain.connect(context.destination);
    
    oscillator.start(0);
    
    return `${context.sampleRate}|${context.state}`;
  } catch (e) {
    return 'audio-unavailable';
  }
}

/**
 * Información básica del navegador y dispositivo
 */
function getBasicFingerprint() {
  return {
    // Screen
    screenResolution: `${screen.width}x${screen.height}`,
    screenColorDepth: screen.colorDepth,
    screenPixelDepth: screen.pixelDepth,
    screenOrientation: screen.orientation?.type || 'unknown',
    
    // Navigator
    userAgent: navigator.userAgent.substring(0, 50), // Primeros 50 caracteres
    language: navigator.language,
    languages: (navigator.languages || []).join(','),
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
    deviceMemory: navigator.deviceMemory || 'unknown',
    maxTouchPoints: navigator.maxTouchPoints || 0,
    
    // Timezone
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    
    // Características
    doNotTrack: navigator.doNotTrack,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    
    // Local storage
    localStorageEnabled: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return 'yes';
      } catch (e) {
        return 'no';
      }
    })(),
    
    // Session storage
    sessionStorageEnabled: (() => {
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        return 'yes';
      } catch (e) {
        return 'no';
      }
    })(),
    
    // IndexedDB
    indexedDBEnabled: (() => {
      try {
        return !!window.indexedDB;
      } catch (e) {
        return false;
      }
    })(),
  };
}

/**
 * Obtiene lista de plugins
 */
function getPluginsFingerprint() {
  try {
    if (!navigator.plugins) return 'plugins-unavailable';
    
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      const plugin = navigator.plugins[i];
      plugins.push({
        name: plugin.name.substring(0, 20),
        version: plugin.version.substring(0, 10),
      });
    }
    
    return JSON.stringify(plugins);
  } catch (e) {
    return 'plugins-unavailable';
  }
}

/**
 * FUNCIÓN PRINCIPAL: Genera fingerprint completo
 */
export async function generateBrowserFingerprint() {
  try {
    // Recolectar todos los datos
    const fingerprints = [];
    
    // 1. Canvas (muy único)
    const canvas = getCanvasFingerprint();
    fingerprints.push(canvas);
    
    // 2. WebGL (información de GPU)
    const webgl = getWebGLFingerprint();
    fingerprints.push(webgl);
    
    // 3. Audio (muy único por hardware)
    const audio = await getAudioFingerprint();
    fingerprints.push(audio);
    
    // 4. Información básica
    const basic = getBasicFingerprint();
    fingerprints.push(JSON.stringify(basic));
    
    // 5. Plugins
    const plugins = getPluginsFingerprint();
    fingerprints.push(plugins);
    
    // Combinar todo
    const combined = fingerprints.join('|');
    
    // Hacer hash
    const hash = await sha256(combined);
    
    return hash;
  } catch (error) {
    
    // Fallback: Usar timestamp + user agent como fingerprint
    const fallback = await sha256(
      navigator.userAgent + Date.now() + Math.random()
    );
    
    return fallback;
  }
}

/**
 * Obtiene fingerprint almacenado en localStorage, o genera uno nuevo
 */
export async function getOrGenerateFingerprint() {
  const FINGERPRINT_KEY = 'voia_browser_fingerprint';
  
  // Intentar obtener del localStorage
  const cached = localStorage.getItem(FINGERPRINT_KEY);
  if (cached) {
    return cached;
  }
  
  // Si no existe, generar uno nuevo
  const fingerprint = await generateBrowserFingerprint();
  
  // Guardar en localStorage
  try {
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  } catch (e) {
  }
  
  return fingerprint;
}

/**
 * Limpia el fingerprint guardado (para testing)
 */
export function clearStoredFingerprint() {
  localStorage.removeItem('voia_browser_fingerprint');
}

/**
 * Debugging: Muestra información detallada del fingerprint
 */
export async function debugFingerprint() {
  const basicInfo = getBasicFingerprint();
  const canvasInfo = getCanvasFingerprint().substring(0, 50) + '...';
  const webglInfo = getWebGLFingerprint();
  const audioInfo = await getAudioFingerprint();
  const pluginsInfo = getPluginsFingerprint();
  const final = await generateBrowserFingerprint();
}

// Para testing en consola: window.voiaFingerprint.debugFingerprint()
if (typeof window !== 'undefined') {
  window.voiaFingerprint = {
    generateBrowserFingerprint,
    getOrGenerateFingerprint,
    clearStoredFingerprint,
    debugFingerprint,
  };
}
