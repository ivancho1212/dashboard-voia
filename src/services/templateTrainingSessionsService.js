import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";
const API_URL = `${API_BASE_URL}/api/TemplateTrainingSessions`;

// Obtener sesiones de entrenamiento por plantilla
export const getTemplateTrainingSessionsByTemplate = async (botTemplateId) => {
  const response = await axios.get(`${API_URL}/by-template/${botTemplateId}`);
  return response.data;
};

// Obtener sesión por ID
export const getTemplateTrainingSessionById = async (sessionId) => {
  const response = await axios.get(`${API_URL}/${sessionId}`);
  return response.data;
};
