// dashboard-voia/src/services/signalr.js
import * as signalR from "@microsoft/signalr";

// Recibe el conversationId para asociar la conexión
export const createHubConnection = (conversationId, explicitToken) => {
  // accessTokenFactory will be used by SignalR to send the JWT over the WebSocket connection.
  // If an explicitToken is provided (e.g. widget iframe), prefer it. Otherwise fall back to localStorage.
  const base = `http://localhost:5006/chatHub`;
  const url = conversationId ? `${base}?conversationId=${conversationId}` : base;

  return new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => {
        try {
          if (explicitToken && typeof explicitToken === 'string' && explicitToken.trim() !== '') {
            return explicitToken;
          }
          const token = localStorage.getItem('jwt') || localStorage.getItem('token') || '';
          return token || '';
        } catch (e) {
          return '';
        }
      },
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
};
