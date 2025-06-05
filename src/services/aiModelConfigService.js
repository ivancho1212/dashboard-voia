import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006"; // Ajusta según corresponda

export const getModelConfigs = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/AiModelConfigs`);
  return response.data;
};

export const getModelConfigsByProvider = async (providerId) => {
  const response = await axios.get(`${API_BASE_URL}/api/AiModelConfigs/by-provider/${providerId}`);
  return response.data;
};
  
export const createModelConfig = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/api/AiModelConfigs`, data);
  return response.data;
};

export const deleteModelConfig = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/api/AiModelConfigs/${id}`);
  // No necesitas retornar data porque el DELETE responde 204 No Content
  if (response.status !== 204) {
    throw new Error("Error eliminando la configuración");
  }
  return true;
};

export const updateModelConfig = async (id, data) => {
  const response = await axios.put(`${API_BASE_URL}/api/AiModelConfigs/${id}`, data);
  if (response.status !== 204) {
    // La API no retorna contenido, pero si no es 204, algo salió mal
    throw new Error("Error actualizando la configuración");
  }
  return true;
};
