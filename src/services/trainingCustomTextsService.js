// Obtener textos planos por botId
export const getTrainingTextsByBot = async (botId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/by-bot/${botId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/TrainingCustomTexts`;

export const createTrainingCustomText = async (data) => {
  try {
    const response = await axios.post(API_URL, data);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // Mensaje personalizado para el frontend
      return {
        duplicate: true,
        message:
          '⚠️ Este texto ya fue registrado anteriormente y no puede ser adjuntado de nuevo. Por favor, ingresa otro texto diferente. Si consideras que esta información te pertenece, envía un PQR a ejemplo@via.com.co.',
        existingId: error.response.data?.existingId,
      };
    }
    throw error;
  }
};

export const getTrainingTextsByTemplate = async (botTemplateId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/by-template/${botTemplateId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const deleteTrainingText = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
