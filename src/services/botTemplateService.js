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
