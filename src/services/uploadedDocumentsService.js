import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/UploadedDocuments`;

// 🔼 Subir archivo
export const uploadFile = async (file, botId, userId) => {
  const formData = new FormData();
  formData.append("File", file);
  formData.append("BotId", botId);
  formData.append("BotTemplateId", botId > 0 ? 1 : null);
  formData.append("UserId", userId);

  console.log('Enviando archivo con datos:', {
    fileName: file.name,
    botId,
    userId
  });

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
