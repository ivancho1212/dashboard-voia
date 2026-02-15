import axios from "axios";
import { decodeToken, refreshAccessToken, logout } from "./authService";

// runAuthLogout se registra como global desde AuthContext cuando se carga en el dashboard
// Evita importar AuthContext directamente para no incluirlo en el bundle del widget
const runAuthLogout = () => {
  if (typeof window !== 'undefined' && typeof window.__runAuthLogout === 'function') {
    window.__runAuthLogout();
  }
};

const isWidgetContext = () => typeof window !== "undefined" && !!window.__VIA_WIDGET__;

// ✅ Configurar timeout global para prevenir cuelgues indefinidos
axios.defaults.timeout = 15000;

// 🔄 DEDUPLICACIÓN: Evitar múltiples refresh simultáneos
let refreshTokenPromise = null;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 30000; // 30 segundos entre refresh
const TOKEN_REFRESH_THRESHOLD = 30 * 60; // 30 minutos antes de expirar (token dura 8h)

// Interceptor para agregar el token JWT a todas las peticiones si existe
axios.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("token");
    if (!token) return config;

    // En widget/landing público: solo añadir token si existe, sin refresh ni logout
    if (isWidgetContext()) {
      config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    }

    const decoded = decodeToken(token);
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded?.exp ? decoded.exp - now : Infinity;
    
    // 🔄 Solo refresh si faltan menos de 30 minutos Y no se hizo refresh recientemente
    if (decoded && decoded.exp && timeUntilExpiry < TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
      const timeSinceLastRefresh = now * 1000 - lastRefreshTime;
      
      // ✅ DEDUPLICACIÓN: Evitar refresh múltiples
      if (refreshTokenPromise) {
        console.log('🔄 [axios] Refresh ya en progreso, esperando...');
        try {
          const newToken = await refreshTokenPromise;
          config.headers["Authorization"] = `Bearer ${newToken}`;
          return config;
        } catch (e) {
          // Si falla el refresh en progreso, usar el token actual (aún puede ser válido)
          console.warn('⚠️ [axios] Error en refresh compartido, usando token actual:', e?.message);
          refreshTokenPromise = null;
          config.headers["Authorization"] = `Bearer ${token}`;
          return config;
        }
      }
      
      // ✅ RATE LIMITING: Evitar refresh muy seguidos
      if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
        config.headers["Authorization"] = `Bearer ${token}`;
        return config;
      }
      
      console.log(`🔄 [axios] Token expira en ${Math.floor(timeUntilExpiry/60)}min, refrescando...`);
      
      try {
        lastRefreshTime = Date.now();
        refreshTokenPromise = refreshAccessToken();
        const newToken = await refreshTokenPromise;
        refreshTokenPromise = null;
        
        config.headers["Authorization"] = `Bearer ${newToken}`;
        console.log('✅ [axios] Token refrescado exitosamente');
        return config;
      } catch (e) {
        console.warn('⚠️ [axios] Error al refrescar token, usando token actual:', e?.message);
        refreshTokenPromise = null;
        // NO cerrar sesión aquí — el token actual aún puede ser válido
        // Solo si realmente expiró y el backend devuelve 401 se cerrará la sesión
        config.headers["Authorization"] = `Bearer ${token}`;
        return config;
      }
    }
    
    // Si el token ya expiró, intentar refresh antes de enviar
    if (decoded && decoded.exp && timeUntilExpiry <= 0) {
      console.warn('⚠️ [axios] Token expirado, intentando refresh...');
      try {
        if (!refreshTokenPromise) {
          lastRefreshTime = Date.now();
          refreshTokenPromise = refreshAccessToken();
        }
        const newToken = await refreshTokenPromise;
        refreshTokenPromise = null;
        config.headers["Authorization"] = `Bearer ${newToken}`;
        console.log('✅ [axios] Token renovado después de expiración');
        return config;
      } catch (e) {
        refreshTokenPromise = null;
        console.error('❌ [axios] No se pudo renovar token expirado');
        // Continuar con token expirado — el 401 response handler limpiará la sesión
        config.headers["Authorization"] = `Bearer ${token}`;
        return config;
      }
    }
    
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: 401/403 → intentar refresh antes de cerrar sesión
// Track de reintentos para evitar loops infinitos
let retryCount = 0;
const MAX_RETRIES = 1;

axios.interceptors.response.use(
  (response) => {
    retryCount = 0; // Reset en respuesta exitosa
    return response;
  },
  async (error) => {
    // ✅ Manejar timeout — NO cerrar sesión por timeout
    if (error.code === 'ECONNABORTED') {
      console.warn('⏱️ [axios] Timeout en petición:', error.config?.url);
      return Promise.reject(error);
    }
    
    // ✅ Manejar errores de autenticación (401/403) — intentar refresh primero
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('🔒 [axios] Error de autenticación:', error.response.status, error.config?.url);
      
      if (!isWidgetContext() && retryCount < MAX_RETRIES) {
        retryCount++;
        try {
          console.log('🔄 [axios] Intentando refresh por 401...');
          const newToken = await refreshAccessToken();
          retryCount = 0;
          // Reintentar la petición original con el nuevo token
          error.config.headers["Authorization"] = `Bearer ${newToken}`;
          return axios(error.config);
        } catch (refreshErr) {
          console.warn('⚠️ [axios] Refresh falló tras 401 — sesión inválida');
          retryCount = 0;
          const hadToken = !!localStorage.getItem("token");
          if (hadToken) {
            logout();
            runAuthLogout();
            if (window && window.showSessionExpiredModal) {
              window.showSessionExpiredModal();
            }
            // NO usar alert() — es intrusivo. El modal o la redirección es suficiente.
          }
        }
      }
    }
    
    // ✅ Manejar errores de red (servidor caído, no hay internet, etc.)
    if (error.message === 'Network Error') {
      console.error('🌐 [axios] Error de red - servidor posiblemente no disponible');
    }
    
    return Promise.reject(error);
  }
);

export default axios;
