import axios from "axios";

const API_BASE_URL = "http://localhost:5006/api/Users";
const CSRF_TOKEN_URL = "http://localhost:5006/api/Auth/csrf-token";

// Función para obtener el token CSRF
async function getCsrfToken() {
  try {
    const response = await axios.get(CSRF_TOKEN_URL);
    return {
      token: response.data.token,
      headerName: response.data.header_name || "X-CSRF-Token"
    };
  } catch (error) {
    console.error("Error obteniendo CSRF token:", error);
    throw error;
  }
}

// Función para iniciar sesión (ahora soporta refreshToken)
export const login = async (email, password) => {
  try {
    const csrf = await getCsrfToken();
    const response = await axios.post(
      `${API_BASE_URL}/login`,
      { email, password },
      {
        headers: {
          [csrf.headerName]: csrf.token
        }
      }
    );
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    if (response.data.refreshToken) {
      localStorage.setItem("refreshToken", response.data.refreshToken);
    }
    return response.data;
  } catch (error) {
    console.error("Error de inicio de sesión:", error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error("Error al intentar iniciar sesión");
  }
};

// Función para refrescar el access token usando el refresh token
export const refreshAccessToken = async () => {
  // El backend espera el refresh token en la cookie httpOnly, no en el body
  const response = await axios.post(
    "http://localhost:5006/api/Auth/refresh",
    {},
    { withCredentials: true }
  );
  if (response.data.accessToken || response.data.token) {
    // Soporta ambos nombres por compatibilidad
    const newToken = response.data.accessToken || response.data.token;
    localStorage.setItem("token", newToken);
    return newToken;
  }
  throw new Error("No se pudo refrescar el token");
};

// Función para logout que limpia ambos tokens

export const logout = async () => {
  try {
    // Llama al backend para revocar el refresh token y eliminar la cookie
    await axios.post("http://localhost:5006/api/Auth/logout", {}, { withCredentials: true });
  } catch (e) {
    // Si falla, igual limpia el localStorage
    console.warn("[logout] Error llamando a /api/Auth/logout:", e);
  }
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
};

// Función para registrar un usuario
export const register = async (newUser) => {
  try {
    const csrf = await getCsrfToken();
    const response = await axios.post(
      `${API_BASE_URL}/register`,
      newUser,
      {
        headers: {
          [csrf.headerName]: csrf.token
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      // Mostrar el contenido completo de la respuesta de error
      console.error("[DEBUG] Respuesta completa del backend:", error.response.data);
      const { Message, Errors, Details } = error.response.data;
      if (Errors && Array.isArray(Errors)) {
        Errors.forEach(e => console.error("[IdentityError]", e.description || e.code));
        throw { message: Message || Details || "Error desconocido", errors: Errors };
      }
      // Si no hay Message ni Errors, mostrar todo el objeto
      throw new Error(JSON.stringify(error.response.data));
    } else {
      console.error("Error desconocido:", error);
      throw new Error("Error desconocido");
    }
  }
};

export const getMyProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener perfil:", error.response?.data || error.message);
    throw error;
  }
};

// authService.js
export const updateMyProfile = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${API_BASE_URL}/me`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// --- Debug helpers: decode JWT and check roles ---
export function decodeToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    // utf-8 safe decode
    const parsed = JSON.parse(decodeURIComponent(escape(decoded)));
    return parsed;
  } catch (e) {
    console.warn('[authService] failed to decode token', e);
    return null;
  }
}

export function hasRole(role) {
  const token = localStorage.getItem('token');
  const decoded = decodeToken(token);
  if (!decoded) return false;
  const roles = decoded.role || decoded.roles || decoded['role'] || decoded['roles'] || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
  if (!roles) return false;
  if (Array.isArray(roles)) return roles.includes(role);
  return String(roles).toLowerCase() === String(role).toLowerCase();
}

export function logClaims(prefix = '[authService]') {
  const token = localStorage.getItem('token');
  if (!token) return console.warn(prefix, 'no token in localStorage');
  const decoded = decodeToken(token);
  console.info(prefix, 'decoded token:', decoded);
  return decoded;
}
