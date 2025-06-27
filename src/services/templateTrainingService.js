import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/TemplateTrainingSessions`;

// 🔸 Crear sesión de entrenamiento
export const createTemplateTrainingSession = async (data) => {
  const response = await axios.post(`${API_URL}`, data);
  return response.data;
};

// 🔸 Crear sesión con prompts
export const createTemplateTrainingSessionWithPrompts = async (data) => {
  const response = await axios.post(`${API_URL}/with-prompts`, data);
  return response.data;
};

// 🔸 Procesar embeddings para la plantilla
export const generateEmbeddings = async (botTemplateId) => {
  const response = await axios.post(
    `${BASE_URL}/VectorEmbeddings/generate-for-template`,
    { botTemplateId }
  );
  return response.data;
};
