// src/services/signalr.js
import * as signalR from "@microsoft/signalr";

// ⚠️ Asegúrate de que la URL sea la del backend donde está expuesto el Hub
const SIGNALR_URL = "http://localhost:5006/chatHub"; // o el puerto que uses

const connection = new signalR.HubConnectionBuilder()
  .withUrl(SIGNALR_URL, {
    withCredentials: true, // si usas cookies o auth, si no, puedes quitarlo
  })
  .withAutomaticReconnect()
  .build();

export default connection;
