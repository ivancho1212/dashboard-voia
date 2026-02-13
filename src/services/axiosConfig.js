import axios from "axios";
import { decodeToken, refreshAccessToken, logout } from "./authService";
import { runAuthLogout } from "contexts/AuthContext";

const isWidgetContext = () => typeof window !== "undefined" && !!window.__VIA_WIDGET__;

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
    if (decoded && decoded.exp && decoded.exp < now + 60) {
      try {
        const newToken = await refreshAccessToken();
        config.headers["Authorization"] = `Bearer ${newToken}`;
        return config;
      } catch (e) {
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
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
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
    return Promise.reject(error);
  }
);

export default axios;
