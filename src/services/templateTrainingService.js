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
