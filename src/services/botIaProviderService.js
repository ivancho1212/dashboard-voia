// src/services/botIaProviderService.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";

export const getIaProviders = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/BotIaProviders`);
  return response.data;
};

export const createIaProvider = async (data) => {
  const response = await axios.post(`${API_BASE_URL}/api/BotIaProviders`, data);
  return response.data;
};

export const updateIaProvider = async (id, data) => {
  const response = await axios.put(`${API_BASE_URL}/api/BotIaProviders/${id}`, data);
  return response.data;
};

export const deleteIaProvider = async (id) => {
  const response = await axios.delete(`${API_BASE_URL}/api/BotIaProviders/${id}`);
  return response.data;
};

// Obtener modelos por proveedor (corregido)
export const getIaModelsByProvider = async (providerId) => {
  const response = await axios.get(`${API_BASE_URL}/api/AiModelConfigs/by-provider/${providerId}`);
  return response.data;
};

  