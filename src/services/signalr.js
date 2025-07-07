// src/services/signalr.js
import * as signalR from "@microsoft/signalr";

const SIGNALR_URL = "http://localhost:5006/chatHub";

const connection = new signalR.HubConnectionBuilder()
  .withUrl(SIGNALR_URL, {
    withCredentials: true,
  })
  .withAutomaticReconnect()
  .configureLogging(signalR.LogLevel.Information)
  .build();

export default connection;
