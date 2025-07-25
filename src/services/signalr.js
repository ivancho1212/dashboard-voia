import * as signalR from "@microsoft/signalr";

const SIGNALR_URL = "http://localhost:5006/chatHub";

// Exportamos una función que crea y devuelve una nueva conexión
export const createHubConnection = () => {
  return new signalR.HubConnectionBuilder()
    .withUrl(SIGNALR_URL, {
      withCredentials: true,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
};