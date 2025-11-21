/**
 * CSRF Token Service
 * Obtiene y maneja tokens CSRF para peticiones protegidas
 * NOTA: Para widgets públicos, los endpoints están excluidos de CSRF en el backend
 */

import axios from 'axios';

const API_URL = 'http://localhost:5006/api';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

let cachedCsrfToken = null;
let csrfTokenExpiry = null;
const TOKEN_VALIDITY_MS = 1000 * 60 * 60; // 1 hora

/**
 * Obtiene el token CSRF del backend
 * @returns {Promise<string|null>} Token CSRF o null si falla
 */
export const getCsrfToken = async () => {
  try {
    // Retornar token en caché si aún es válido
    if (cachedCsrfToken && csrfTokenExpiry && Date.now() < csrfTokenExpiry) {
      console.log('✅ [CSRF] Token en caché aún válido');
      return cachedCsrfToken;
    }

    // Obtener nuevo token del backend
    console.log('🔄 [CSRF] Obteniendo nuevo token del backend...');
    const response = await axios.get(`${API_URL}/auth/csrf-token`, {
      timeout: 3000,
      withCredentials: true // Permitir cookies
    });

    if (!response.data || !response.data.token) {
      console.warn('⚠️  [CSRF] Respuesta sin token');
      return null;
    }

    cachedCsrfToken = response.data.token;
    csrfTokenExpiry = Date.now() + TOKEN_VALIDITY_MS;

    console.log('✅ [CSRF] Token obtenido:', cachedCsrfToken.substring(0, 20) + '...');
    return cachedCsrfToken;
  } catch (error) {
    console.warn('⚠️  [CSRF] Error obteniendo token del backend:', error.message);
    return null;
  }
};

/**
 * Obtiene el nombre del header CSRF
 * @returns {string} Nombre del header
 */
export const getCsrfHeaderName = () => {
  return CSRF_HEADER_NAME;
};

/**
 * Obtiene el token CSRF desde cookies
 * @returns {string|null} Token CSRF o null
 */
export const getCsrfTokenFromCookie = () => {
  try {
    const name = CSRF_COOKIE_NAME + '=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    
    for (let cookie of cookieArray) {
      cookie = cookie.trim();
      if (cookie.indexOf(name) === 0) {
        return cookie.substring(name.length);
      }
    }
    return null;
  } catch (error) {
    console.warn('⚠️  [CSRF] Error leyendo cookie CSRF:', error.message);
    return null;
  }
};

/**
 * Agrega el token CSRF a la configuración de axios
 * Para endpoints públicos del widget (get-or-create, etc), no es necesario
 * @param {Object} config Configuración de axios
 * @returns {Promise<Object>} Configuración actualizada
 */
export const addCsrfToConfig = async (config = {}) => {
  try {
    // Intentar obtener token del backend (pero con timeout corto para no bloquear)
    let token = null;
    try {
      token = await getCsrfToken();
    } catch (e) {
      // Si falla timeout, silenciosamente ignorar
      console.debug('[CSRF] Timeout obteniendo token, continuando sin él');
    }

    // Si no tenemos token del backend, intentar desde cookie
    if (!token) {
      token = getCsrfTokenFromCookie();
    }

    // Si tenemos token, agregarlo
    if (token) {
      if (!config.headers) {
        config.headers = {};
      }
      config.headers[CSRF_HEADER_NAME] = token;
      console.log('✅ [CSRF] Token agregado a config');
    } else {
      console.debug('[CSRF] No hay token CSRF disponible, continuando sin él');
    }
    
    // Siempre permitir cookies
    config.withCredentials = true;
    return config;
  } catch (error) {
    console.warn('⚠️  [CSRF] Error agregando CSRF a config:', error.message);
    // Retornar config aunque haya error
    config.withCredentials = true;
    return config;
  }
};

/**
 * Interceptor para axios - agrega CSRF a todas las peticiones POST/PUT/PATCH/DELETE
 */
export const setupCsrfInterceptor = (axiosInstance) => {
  axiosInstance.interceptors.request.use(async (config) => {
    // Solo para métodos que requieren CSRF
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method.toUpperCase())) {
      // Excluir endpoints públicos
      const publicEndpoints = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];
      const isPublicEndpoint = publicEndpoints.some(endpoint => config.url.includes(endpoint));
      
      if (!isPublicEndpoint) {
        config = await addCsrfToConfig(config);
      }
    }
    return config;
  });
};

export default {
  getCsrfToken,
  getCsrfHeaderName,
  getCsrfTokenFromCookie,
  addCsrfToConfig,
  setupCsrfInterceptor
};

