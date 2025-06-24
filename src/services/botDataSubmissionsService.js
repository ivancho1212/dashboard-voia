import axios from "axios";

const API_URL = "http://localhost:5006/api/BotDataSubmissions";

// Obtener las capturas agrupadas por sesión para un bot específico
export const getCapturedSubmissionsByBot = async (botId) => {
  const response = await axios.get(`${API_URL}/by-bot/${botId}`);

  return {
    data: response.data.map((entry) => ({
      sessionId: entry.sessionId,
      userId: entry.userId,
      values: entry.values ?? {}, // 👈 asegúrate de que siempre haya values
    })),
  };
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
    submissionSessionId: submissionData.submissionSessionId ?? null,
  });
};

// Actualizar una captura existente
export const updateSubmission = (id, updatedData) => {
  return axios.put(`${API_URL}/${id}`, {
    botId: updatedData.botId,
    captureFieldId: updatedData.captureFieldId,
    submissionValue: updatedData.submissionValue,
  });
};

// Eliminar una captura por ID
export const deleteSubmission = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

// Obtener capturas públicas agrupadas por sesión (API sin login)
export const getPublicCapturedSubmissionsByBot = async (botId) => {
  const response = await axios.get(
    `http://localhost:5006/api/BotDataSubmissions/public/by-bot/${botId}`
  );

  return {
    data: response.data.map((entry) => ({
      sessionId: entry.sessionId,
      userId: entry.userId,
      values: entry.values ?? {}, // siempre objeto
      createdAt: entry.createdAt ?? null,
    })),
  };
};
