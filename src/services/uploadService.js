import axios from "axios";
import { getApiBaseUrl } from "config/environment";

const getAPIUrl = () => getApiBaseUrl();

// Subir archivo genérico
export const uploadFile = async (file, path = "/upload") => {
  const token = localStorage.getItem("authToken");
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
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Subir imagen de avatar
export const uploadAvatar = async (file, type = "avatar") => {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  formData.append("file", file); // Cambiar "avatar" por "file" para coincidir con el controlador
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
    return response.data.url; // Retornar directamente la URL
  } catch (error) {
    console.error("Error uploading avatar:", error);
    throw error;
  }
};

// Subir imagen de perfil de bot
export const uploadBotAvatar = async (file, botId) => {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  formData.append("file", file); // Cambiar "avatar" por "file"
  formData.append("botId", botId);

  try {
    const response = await axios.post(`${getAPIUrl()}/upload/bot-avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data.url; // Retornar directamente la URL
  } catch (error) {
    console.error("Error uploading bot avatar:", error);
    throw error;
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

// Eliminar archivo
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
    console.error("Error deleting file:", error);
    throw error;
  }
};
