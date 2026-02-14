import axios from "axios";
import { decodeToken, refreshAccessToken, logout } from "./authService";
import { runAuthLogout } from "contexts/AuthContext";

const isWidgetContext = () => typeof window !== "undefined" && !!window.__VIA_WIDGET__;

// ✅ Configurar timeout global para prevenir cuelgues indefinidos
axios.defaults.timeout = 15000;

// 🔄 DEDUPLICACIÓN: Evitar múltiples refresh simultáneos
let refreshTokenPromise = null;
let lastRefreshTime = 0;
const REFRESH_COOLDOWN = 10000; // 10 segundos entre refresh
const TOKEN_REFRESH_THRESHOLD = 180; // 3 minutos antes de expirar (era 60s)

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
    const timeUntilExpiry = decoded?.exp ? decoded.exp - now : 0;
    
    // 🔄 Solo refresh si faltan menos de 3 minutos Y no se hizo refresh recientemente
    if (decoded && decoded.exp && timeUntilExpiry < TOKEN_REFRESH_THRESHOLD) {
      const timeSinceLastRefresh = now * 1000 - lastRefreshTime;
      
      // ✅ DEDUPLICACIÓN: Evitar refresh múltiples
      if (refreshTokenPromise) {
        console.log('🔄 [axios] Refresh ya en progreso, esperando...');
        try {
          const newToken = await refreshTokenPromise;
          config.headers["Authorization"] = `Bearer ${newToken}`;
          return config;
        } catch (e) {
          // Si falla el refresh en progreso, intentar logout
          console.error('❌ [axios] Error en refresh compartido:', e);
          refreshTokenPromise = null;
          throw e;
        }
      }
      
      // ✅ RATE LIMITING: Evitar refresh muy seguidos
      if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
        console.log('⏳ [axios] Refresh en cooldown, usando token actual');
        config.headers["Authorization"] = `Bearer ${token}`;
        return config;
      }
      
      console.warn(`⚠️ [axios] Token expira en ${Math.floor(timeUntilExpiry/60)}min ${timeUntilExpiry%60}s, refrescando...`);
      
      // 💬 Usuario activo = extender sesión para mejor UX
      
      try {
        lastRefreshTime = Date.now();
        refreshTokenPromise = refreshAccessToken();
        const newToken = await refreshTokenPromise;
        refreshTokenPromise = null;
        
        config.headers["Authorization"] = `Bearer ${newToken}`;
        console.log('✅ [axios] Token refrescado exitosamente');
        return config;
      } catch (e) {
        console.error('❌ [axios] Error al refrescar token:', e);
        refreshTokenPromise = null;
        logout();
        if (window && window.showSessionExpiredModal) {
          window.showSessionExpiredModal();
        } else {
          alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        }
        return Promise.reject(new Error("Sesión expirada. Debe iniciar sesión nuevamente."));
      }
    }
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: 401/403 → cerrar sesión en React y redirigir a login (dashboard)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ Manejar timeout específicamente
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ [axios] Timeout en petición:', error.config?.url);
      // Verificar si el token está expirado
      const token = localStorage.getItem("token");
      if (token && !isWidgetContext()) {
        try {
          const decoded = decodeToken(token);
          const now = Math.floor(Date.now() / 1000);
          if (decoded && decoded.exp && decoded.exp < now) {
            console.warn('⚠️ [axios] Token expirado detectado en timeout');
            logout();
            runAuthLogout();
            if (window && window.showSessionExpiredModal) {
              window.showSessionExpiredModal();
            } else {
              alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            }
          }
        } catch (e) {
          console.error('❌ [axios] Error verificando token en timeout:', e);
        }
      }
    }
    
    // ✅ Manejar errores de autenticación (401/403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.warn('🔒 [axios] Error de autenticación:', error.response.status);
      if (!isWidgetContext()) {
        const hadToken = !!localStorage.getItem("token");
        if (hadToken) {
          logout(); // limpia localStorage y opcionalmente llama al backend
          runAuthLogout(); // actualiza AuthContext y redirige a /authentication/sign-in
          if (window && window.showSessionExpiredModal) {
            window.showSessionExpiredModal();
          } else {
            alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
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
