import axios from "axios";
import { decodeToken, refreshAccessToken, logout } from "./authService";

// Interceptor para agregar el token JWT a todas las peticiones si existe
axios.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("token");
    if (token) {
      // Verifica si el token está expirado o por expirar (menos de 1 min)
      const decoded = decodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      if (decoded && decoded.exp && decoded.exp < now + 60) {
        try {
          token = await refreshAccessToken();
        } catch (e) {
          logout();
          // Mostrar modal de sesión expirada en vez de redirigir abruptamente
          if (window && window.showSessionExpiredModal) {
            window.showSessionExpiredModal();
          } else {
            alert("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
          }
          // No redirigir automáticamente
          return Promise.reject("Sesión expirada. Debe iniciar sesión nuevamente.");
        }
      }
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// Interceptor de respuesta para manejar 401/403 globalmente
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Limpiar sesión y redirigir a login
      logout();
      // Mostrar modal de sesión expirada en vez de redirigir abruptamente
      if (window && window.showSessionExpiredModal) {
        window.showSessionExpiredModal();
      } else {
        alert("Tu sesión ha expirado o no tienes autorización. Por favor, inicia sesión nuevamente.");
      }
      // No redirigir automáticamente
      return Promise.reject("Sesión expirada o no autorizada. Redirigiendo a login.");
    }
    return Promise.reject(error);
  }
);

export default axios;
