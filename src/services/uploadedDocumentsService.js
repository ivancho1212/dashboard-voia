// src/services/uploadedDocumentsService.js
import axios from "axios";

const API_URL = "http://localhost:5006/api/UploadedDocuments";

/**
 * Sube un archivo asociado a una plantilla y un usuario (obligatorio).
 * Opcionalmente puede incluir ID de sesión de entrenamiento.
 */
export const uploadFile = async (file, botTemplateId, userId, templateTrainingSessionId = null) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("botTemplateId", botTemplateId);
  formData.append("userId", userId); // 🔐 Clave foránea
  formData.append("fileName", file.name);
  formData.append("fileType", file.type);
  formData.append("filePath", `/uploads/${file.name}`);

  if (templateTrainingSessionId) {
    formData.append("templateTrainingSessionId", templateTrainingSessionId);
  }

  const response = await axios.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
