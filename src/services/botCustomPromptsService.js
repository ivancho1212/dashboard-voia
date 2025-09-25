import axios from "axios";

const API_URL = "http://localhost:5006/api/BotCustomPrompts";

// Obtiene todos los prompts para un ID de plantilla específico
export async function getBotCustomPromptsByTemplateId(templateId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/by-template/${templateId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching prompts for template ${templateId}:`, error.response?.data || error.message);
    throw error; 
  }
}

export async function getBotCustomPromptsByBotId(botId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/by-bot/${botId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching prompts for bot ${botId}:`, error.response?.data || error.message);
    throw error;
  }
}

// Crea un nuevo prompt personalizado
export async function createBotCustomPrompt(promptData) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(API_URL, promptData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error creating custom prompt:", error.response?.data || error.message);
    throw error;
  }
}

// Elimina un prompt por su ID
export async function deleteBotCustomPrompt(promptId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/${promptId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting prompt ${promptId}:`, error.response?.data || error.message);
    throw error;
  }
}