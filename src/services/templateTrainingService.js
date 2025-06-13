// src/services/templateTrainingService.js
import axios from "axios";

const API_URL = "http://localhost:5006/api/TemplateTrainingSessions";

/**
 * Crea una nueva sesión de entrenamiento para una plantilla.
 * @param {Object} data - Datos de la sesión, incluyendo:
 *   - botTemplateId: ID de la plantilla
 *   - sessionName: nombre de la sesión
 *   - description: descripción de la sesión
 */
export const createTemplateTrainingSession = async (data) => {
  const response = await axios.post(`${API_URL}`, data);
  return response.data;
};

export const createTemplateTrainingSessionWithPrompts = async (data) => {
  const response = await axios.post(`${API_URL}/with-prompts`, data);
  return response.data;
};

// 1. Texto plano
export const createTrainingCustomText = async (data) => {
    console.log("👤 Enviando Text", data); // <-- Esto
  return (await axios.post("http://localhost:5006/api/TrainingCustomTexts", data)).data;
};

// 2. Enlace remoto (URL PDF)
export const createTrainingUrl = async (data) => {
    console.log("👤 Enviando Training URL con:", data); // <-- Esto
  return (await axios.post("http://localhost:5006/api/TrainingUrls", data)).data;
};

// 4. Procesar embeddings (opcional)
export const generateEmbeddings = async (botTemplateId) => {
  console.log("👤 Enviando Embeddings URL con:", { botTemplateId }); // ✅ Mostramos el parámetro real
  return (
    await axios.post("http://localhost:5006/api/VectorEmbeddings/generate-for-template", {
      botTemplateId,
    })
  ).data;
};

