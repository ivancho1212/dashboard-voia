import { io } from "socket.io-client";

// Reemplaza con tu URL real del backend
const SOCKET_URL = "http://localhost:3001"; // o https://tudominio.com si ya tienes servidor

const socket = io(SOCKET_URL, {
  autoConnect: false,
});

export default socket;
