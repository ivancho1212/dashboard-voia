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

// 🔸 Guardar texto plano
export const createTrainingCustomText = async (data) => {
  console.log("📄 Enviando Text:", data);
  const response = await axios.post(`${BASE_URL}/TrainingCustomTexts`, data);
  return response.data;
};

// 🔸 Guardar enlace remoto (URL web)
export const createTrainingUrl = async (data) => {
  console.log("🔗 Enviando Training URL:", data);
  const response = await axios.post(`${BASE_URL}/TrainingUrls`, data);
  return response.data;
};

// 🔸 Procesar embeddings
export const generateEmbeddings = async (botTemplateId) => {
  console.log("⚙️ Generando Embeddings para Template ID:", botTemplateId);
  const response = await axios.post(
    `${BASE_URL}/VectorEmbeddings/generate-for-template`,
    { botTemplateId }
  );
  return response.data;
};
