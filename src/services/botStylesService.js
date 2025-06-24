// src/services/botStylesService.js
import axios from "axios";

const API_URL = "http://localhost:5006/api/BotStyles";

// Obtener todos los estilos (solo si es necesario)
export const getAllBotStyles = () => axios.get(API_URL);

// Obtener estilos por ID de usuario (para estilos personalizados del usuario)
export const getBotStylesByUser = (userId) =>
  axios.get(`${API_URL}/byUser/${userId}`);

// Obtener un estilo por su ID
export const getBotStyleById = (id) => axios.get(`${API_URL}/${id}`);

// Crear un nuevo estilo
export const createBotStyle = (data) => axios.post(API_URL, data);

// Actualizar un estilo existente
export const updateBotStyle = (id, data) => axios.put(`${API_URL}/${id}`, data);

// Eliminar un estilo
export const deleteBotStyle = (id) => axios.delete(`${API_URL}/${id}`);
