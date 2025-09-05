// dashboard-voia/src/services/signalr.js
import * as signalR from "@microsoft/signalr";

// Recibe el conversationId para asociar la conexión
export const createHubConnection = (conversationId) => {
  return new signalR.HubConnectionBuilder()
    .withUrl(`http://localhost:5006/chatHub?conversationId=${conversationId}`, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
};
