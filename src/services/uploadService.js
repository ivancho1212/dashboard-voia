import axios from "axios";
import { getApiBaseUrl } from "config/environment";
import { validateFileForUpload, warnBlockedFileUpload } from "./fileValidationService";
import { handleApiError } from "utils/errorHandler";

const getAPIUrl = () => getApiBaseUrl();

// ✅ MEJORADO: Subir archivo genérico con validación local
export const uploadFile = async (file, path = "/upload") => {
  const token = localStorage.getItem("authToken");

  // 1️⃣ Validación local primero (mejor UX, respuesta más rápida)
  const validation = validateFileForUpload(file);
  if (!validation.valid) {
    warnBlockedFileUpload(file, validation);
    const error = new Error(validation.error);
    error.code = validation.code;
    throw error;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post(`${getAPIUrl()}${path}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data;
  } catch (error) {
    // 2️⃣ Manejo mejorado de errores del backend
    const errorInfo = handleApiError(error, 'uploadFile');
    
    if (error.response?.status === 403) {
      throw new Error("❌ No tienes permiso para acceder a este archivo");
    }
    if (error.response?.status === 400) {
      throw new Error(error.response.data?.message || "❌ Tipo de archivo no permitido");
    }
    
    console.error("Error uploading file:", errorInfo);
    throw new Error(errorInfo.userMessage);
  }
};

// ✅ MEJORADO: Subir imagen de avatar con validación
export const uploadAvatar = async (file, type = "avatar") => {
  const token = localStorage.getItem("authToken");

  // Validación local
  const validation = validateFileForUpload(file);
  if (!validation.valid) {
    warnBlockedFileUpload(file, validation);
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);
  if (type) {
    formData.append("type", type);
  }

  try {
    const response = await axios.post(`${getAPIUrl()}/upload/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data.url;
  } catch (error) {
    const errorInfo = handleApiError(error, 'uploadAvatar');
    
    if (error.response?.status === 403) {
      throw new Error("❌ No tienes permiso para cambiar tu avatar");
    }
    
    console.error("Error uploading avatar:", errorInfo);
    throw new Error(errorInfo.userMessage);
  }
};

// ✅ MEJORADO: Subir imagen de perfil de bot con validación
export const uploadBotAvatar = async (file, botId) => {
  const token = localStorage.getItem("authToken");

  // Validación local
  const validation = validateFileForUpload(file);
  if (!validation.valid) {
    warnBlockedFileUpload(file, validation);
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("botId", botId);

  try {
    const response = await axios.post(`${getAPIUrl()}/upload/bot-avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data.url;
  } catch (error) {
    const errorInfo = handleApiError(error, 'uploadBotAvatar');
    
    if (error.response?.status === 403) {
      throw new Error("❌ No tienes permiso para cambiar avatar de este bot");
    }
    if (error.response?.status === 404) {
      throw new Error("❌ El bot no existe");
    }
    
    console.error("Error uploading bot avatar:", errorInfo);
    throw new Error(errorInfo.userMessage);
  }
};

// Subir múltiples archivos
export const uploadMultipleFiles = async (files, path = "/upload/multiple") => {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  
  files.forEach((file, index) => {
    formData.append(`files`, file);
  });

  try {
    const response = await axios.post(`${getAPIUrl()}${path}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error uploading multiple files:", error);
    throw error;
  }
};

// ✅ MEJORADO: Eliminar archivo con manejo de errores robusto
export const deleteFile = async (fileUrl) => {
  const token = localStorage.getItem("authToken");
  
  try {
    const response = await axios.delete(`${getAPIUrl()}/upload/delete`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
      data: { fileUrl }
    });
    return response.data;
  } catch (error) {
    const errorInfo = handleApiError(error, 'deleteFile');
    
    if (error.response?.status === 403) {
      throw new Error("❌ No tienes permiso para eliminar este archivo");
    }
    if (error.response?.status === 404) {
      throw new Error("❌ El archivo no existe");
    }
    if (error.response?.status === 409) {
      throw new Error("❌ El archivo está en uso y no puede ser eliminado");
    }
    
    console.error("Error deleting file:", errorInfo);
    throw new Error(errorInfo.userMessage);
  }
};
