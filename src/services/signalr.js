// dashboard-voia/src/services/signalr.js
import * as signalR from "@microsoft/signalr";

// Verifica si un token JWT está expirado
function isTokenExpired(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp && payload.exp < now;
  } catch (e) {
    return false; // Si no se puede decodificar, asumir que no expiró
  }
}

// Recibe el conversationId para asociar la conexión
export const createHubConnection = (conversationId, explicitToken) => {
  // accessTokenFactory will be used by SignalR to send the JWT over the WebSocket connection.
  // If an explicitToken is provided (e.g. widget iframe), prefer it. Otherwise fall back to localStorage.
  const base = `http://localhost:5006/chatHub`;

  // 🔑 Obtener el token ANTES de construir la URL para agregarlo como query param
  let token = '';
  try {
    if (explicitToken && typeof explicitToken === 'string' && explicitToken.trim() !== '') {
      token = explicitToken;
    } else {
      token = localStorage.getItem('token') || '';
      if (!token) {
        console.warn('⚠️  [createHubConnection] NO hay token disponible - conexión podría fallar si hub requiere autenticación');
      }
    }
  } catch (e) {
    console.error('❌ [createHubConnection] Error obteniendo token:', e.message);
    token = '';
  }

  // ✅ Construir URL base SIN token (accessTokenFactory lo proveerá de forma dinámica)
  let url = base;
  if (conversationId) {
    url += `?conversationId=${conversationId}`;
  }

  // 🔐 Obtener token CSRF si está disponible
  let csrfToken = null;
  let csrfHeaderName = 'X-CSRF-Token';
  try {
    csrfToken = sessionStorage.getItem('csrf_token') || localStorage.getItem('csrf_token');
    const storedHeaderName = sessionStorage.getItem('csrf_header_name') || localStorage.getItem('csrf_header_name');
    if (storedHeaderName) {
      csrfHeaderName = storedHeaderName;
    }
  } catch (e) {
    console.warn('⚠️ [SignalR] No se pudo obtener token CSRF:', e.message);
  }

  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      // ✅ Agregar headers CSRF si están disponibles
      headers: csrfToken ? { [csrfHeaderName]: csrfToken } : {},
      // ✅ accessTokenFactory async: renueva el token si está expirado antes de conectar/reconectar
      accessTokenFactory: async () => {
        try {
          // Widget con token explícito: no hay refresh, devolver tal cual
          if (explicitToken && typeof explicitToken === 'string' && explicitToken.trim() !== '') {
            return explicitToken;
          }

          let factoryToken = localStorage.getItem('token') || '';

          // Si el token expiró, intentar refresh silencioso
          if (factoryToken && isTokenExpired(factoryToken)) {
            console.warn('⚠️ [accessTokenFactory] Token expirado, intentando refresh...');
            try {
              const { refreshAccessToken } = await import('./authService');
              const newToken = await refreshAccessToken();
              return newToken;
            } catch (refreshErr) {
              console.error('❌ [accessTokenFactory] No se pudo renovar el token:', refreshErr?.message);
              // Devolver el token expirado; el 401 resultante mostrará el error apropiado
              return factoryToken;
            }
          }

          return factoryToken;
        } catch (e) {
          console.error('❌ [accessTokenFactory] Error:', e.message);
          return '';
        }
      },
      withCredentials: true,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000]) // Retry intervals
    .configureLogging(signalR.LogLevel.Warning)
    .build();
};
