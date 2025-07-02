import axios from "axios";

// Endpoints base
const BOT_CONVERSATIONS_API = "http://localhost:5006/api/BotConversations";
const CONVERSATIONS_API = "http://localhost:5006/api/Conversations";

/**
 * Envía una pregunta a un bot
 */
export const askBot = async ({ botId, userId, question }) => {
  try {
    const response = await axios.post(`${BOT_CONVERSATIONS_API}/ask`, {
      botId,
      userId,
      question,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en askBot:", error);
    return {
      success: false,
      error: error.response?.data?.error || "Error desconocido",
    };
  }
};

/**
 * Obtiene las conversaciones relacionadas con los bots de un usuario específico (temporal)
 */
export const getConversationsByUser = async (userId) => {
  try {
    const response = await axios.get(`${CONVERSATIONS_API}/by-user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener conversaciones del usuario:", error);
    return [];
  }
};
/**
 * Crea una nueva conversación entre un usuario y un bot
 */
export const createConversation = async ({ userId, botId, title = "", userMessage = "", botResponse = "" }) => {
  try {
    const response = await axios.post(CONVERSATIONS_API, {
      userId,
      botId,
      title,
      userMessage,
      botResponse,
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error al crear conversación:", error);
    throw error;
  }
};
