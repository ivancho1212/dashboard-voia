import axios from "axios";

const API_URL = "http://localhost:5006/api/BotDataSubmissions";

// Obtener las capturas agrupadas por campo para un bot específico
export const getCapturedSubmissionsByBot = (botId) => {
  return axios.get(`${API_URL}/by-bot/${botId}`);
};

// Obtener todas las capturas (sin agrupar)
export const getAllSubmissions = () => {
  return axios.get(API_URL);
};

// Obtener una sola captura por ID
export const getSubmissionById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

// Crear una nueva captura de dato
export const createSubmission = (submissionData) => {
  return axios.post(API_URL, {
    botId: submissionData.botId,
    captureFieldId: submissionData.captureFieldId,
    submissionValue: submissionData.submissionValue,
    userId: submissionData.userId ?? null,
    submissionSessionId: submissionData.submissionSessionId ?? null
  });
};

// Actualizar una captura existente
export const updateSubmission = (id, updatedData) => {
  return axios.put(`${API_URL}/${id}`, {
    botId: updatedData.botId,
    captureFieldId: updatedData.captureFieldId,
    submissionValue: updatedData.submissionValue
  });
};

// Eliminar una captura por ID
export const deleteSubmission = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};
