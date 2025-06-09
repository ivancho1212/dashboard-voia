import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";

// Obtener todos los proveedores IA
export const getIaProviders = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/AiProviders`);
  return response.data;
};

// Obtener modelos según proveedor IA
export const getIaModelsByProvider = async (providerId) => {
  const response = await axios.get(`${API_BASE_URL}/api/AiModels/by-provider/${providerId}`);
  return response.data;
};

export async function getAvailableBotTemplates() {
  const res = await axios.get(`${API_BASE_URL}/api/bottemplates/available`);
  return res.data;
}

// --- FUNCIONES PARA BOT TEMPLATES ---

// Crear plantilla de bot
export const createBotTemplate = async (payload) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/bottemplates`, payload);
    return response.data;
  } catch (error) {
    console.error("Error al crear la plantilla:", error.response?.data || error.message);
    throw error;
  }
};

// Actualizar plantilla de bot
export const updateBotTemplate = async (templateId, payload) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/api/bottemplates/${templateId}`, payload);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar la plantilla:", error.response?.data || error.message);
    throw error;
  }
};

// Obtener plantilla por id
export const getBotTemplateById = async (templateId) => {
  const response = await axios.get(`${API_BASE_URL}/api/bottemplates/${templateId}`);
  return response.data;
};

// Listar todas las plantillas de bot
export const getBotTemplates = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/bottemplates`);
  return response.data;
};
// Borrar plantilla de bot
export const deleteBotTemplate = async (templateId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/api/bottemplates/${templateId}`);
    return response.data; // o solo devolver true
  } catch (error) {
    console.error("Error al eliminar la plantilla:", error.response?.data || error.message);
    throw error;
  }
};
