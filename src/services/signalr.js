// dashboard-voia/src/services/signalr.js
import * as signalR from "@microsoft/signalr";

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
      token = localStorage.getItem('jwt') || localStorage.getItem('token') || '';
      if (token) {
      } else {
        console.warn('⚠️  [createHubConnection] NO hay token disponible - conexión podría fallar si hub requiere autenticación');
      }
    }
  } catch (e) {
    console.error('❌ [createHubConnection] Error obteniendo token:', e.message);
    token = '';
  }

  // ✅ Construir URL con parámetros de query
  let url = base;
  const params = [];
  if (conversationId) params.push(`conversationId=${conversationId}`);
  if (token) params.push(`access_token=${encodeURIComponent(token)}`);
  
  if (params.length > 0) {
    url += '?' + params.join('&');
  }


  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => {
        // 🔄 Si el token está en la URL, también lo enviamos en accessTokenFactory
        // para máxima compatibilidad con diferentes versiones de SignalR
        try {
          let factoryToken = '';
          if (explicitToken && typeof explicitToken === 'string' && explicitToken.trim() !== '') {
            factoryToken = explicitToken;
          } else {
            factoryToken = localStorage.getItem('jwt') || localStorage.getItem('token') || '';
          }
          if (factoryToken) {
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
    .configureLogging(signalR.LogLevel.Information)
    .build();
};
