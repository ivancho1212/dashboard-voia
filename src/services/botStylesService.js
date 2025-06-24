import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";
const API_URL = `${API_BASE_URL}/api/BotStyles`;

// Obtener todos los estilos
export const getAllBotStyles = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Obtener estilos por ID de usuario
export const getBotStylesByUser = async (userId) => {
  const response = await axios.get(`${API_URL}/byUser/${userId}`);
  return response.data;
};

// Obtener estilo por ID
export const getBotStyleById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Crear nuevo estilo
export const createBotStyle = async (data) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

// Actualizar estilo existente
export const updateBotStyle = async (id, data) => {
  const response = await axios.put(`${API_URL}/${id}`, data);
  if (response.status !== 204 && response.status !== 200) {
    throw new Error("Error actualizando el estilo");
  }
  return true;
};

// Eliminar estilo
export const deleteBotStyle = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  if (response.status !== 204 && response.status !== 200) {
    throw new Error("Error eliminando el estilo");
  }
  return true;
};
