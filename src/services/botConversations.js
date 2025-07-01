import axios from "axios";

const API_URL = "http://localhost:5006/api/BotConversations";

export const askBot = async ({ botId, userId, question }) => {
  try {
    const response = await axios.post(`${API_URL}/ask`, {
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
