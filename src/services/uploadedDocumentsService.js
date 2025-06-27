import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/UploadedDocuments`;

// 🔼 Subir archivo
export const uploadFile = async (file, botTemplateId, userId, templateTrainingSessionId = null) => {
  const formData = new FormData();
  formData.append("File", file);
  formData.append("BotTemplateId", botTemplateId);
  formData.append("UserId", userId);
  if (templateTrainingSessionId) {
    formData.append("TemplateTrainingSessionId", templateTrainingSessionId);
  }

  const response = await axios.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// 🔍 Obtener archivos por plantilla
export const getUploadedDocumentsByTemplate = async (templateId) => {
  const response = await axios.get(`${API_URL}/by-template/${templateId}`);
  return response.data;
};

// 🗑️ Eliminar archivo por ID
export const deleteUploadedDocument = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
