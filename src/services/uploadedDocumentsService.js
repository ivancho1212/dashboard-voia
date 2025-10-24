import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/UploadedDocuments`;

// Obtener documentos por botId
export const getUploadedDocumentsByBot = async (botId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/by-bot/${botId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// 🔼 Subir archivo
// file: File/Blob, botId: int, botTemplateId: int, userId: int, templateTrainingSessionId: int|null
// onUploadProgress: optional callback function(progressEvent)
export const uploadFile = async (file, botId, botTemplateId, userId, templateTrainingSessionId = null, onUploadProgress = undefined) => {
  const formData = new FormData();
  formData.append("File", file);
  formData.append("BotId", botId);
  formData.append("BotTemplateId", botTemplateId);
  formData.append("UserId", userId);
  if (templateTrainingSessionId !== null && templateTrainingSessionId !== undefined) {
    formData.append("TemplateTrainingSessionId", templateTrainingSessionId);
  }

  const token = localStorage.getItem("token");

  console.log('Enviando archivo con datos:', {
    fileName: file.name,
    botId,
    botTemplateId,
    userId,
    templateTrainingSessionId
  });

  try {
    const config = {
      headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${token}` },
    };
    if (onUploadProgress && typeof onUploadProgress === 'function') {
      config.onUploadProgress = onUploadProgress;
    }
    const response = await axios.post(API_URL, formData, config);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      console.warn(`⚠️ Archivo duplicado: ${file.name}. Ya existe en la plantilla.`);
      return { duplicate: true, message: error.response.data.message };
    }
    throw error;
  }
};

// 🔍 Obtener archivos por plantilla
export const getUploadedDocumentsByTemplate = async (templateId) => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_URL}/by-template/${templateId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// 🗑️ Eliminar archivo por ID
export const deleteUploadedDocument = async (id) => {
  const token = localStorage.getItem("token");
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
