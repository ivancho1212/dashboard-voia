// src/services/uploadedDocumentsService.js
import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/UploadedDocuments`;

/**
 * 🔼 Sube un archivo asociado a una plantilla y un usuario.
 * 🔗 Puede incluir opcionalmente una sesión de entrenamiento (TemplateTrainingSessionId).
 * @param {File} file - Archivo a subir
 * @param {number} botTemplateId - ID de la plantilla
 * @param {number} userId - ID del usuario
 * @param {number} templateTrainingSessionId - ID de la sesión (opcional)
 */
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
