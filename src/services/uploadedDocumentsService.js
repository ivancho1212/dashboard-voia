// src/services/uploadedDocumentsService.js
import axios from "axios";

const API_URL = "http://localhost:5006/api/UploadedDocuments";

/**
 * Sube un archivo asociado a una plantilla y un usuario (obligatorio).
 * Opcionalmente puede incluir ID de sesión de entrenamiento.
 */
export const uploadFile = async (file, botTemplateId, userId, templateTrainingSessionId = null) => {
  const formData = new FormData();
  formData.append("File", file); // <- Debe ser "File" (según tu controller)
  formData.append("BotTemplateId", botTemplateId);
  formData.append("UserId", userId);

  // Solo si hay sesión de entrenamiento
  if (templateTrainingSessionId) {
    formData.append("TemplateTrainingSessionId", templateTrainingSessionId); // <- Nombre exacto
  }

  // ✅ Campos opcionales que no están en tu DTO no se envían
  // formData.append("fileName", file.name);
  // formData.append("fileType", file.type);
  // formData.append("filePath", `/uploads/${file.name}`);

  const response = await axios.post(API_URL, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};
