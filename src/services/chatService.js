// dashboard-voia/src/services/chatService.js
import axios from "axios";

const API_URL = "http://localhost:5006/api";

// chatService.js
export async function createConversation(userId, botId) {
  try {
    const { data } = await axios.post(
      `${API_URL}/Conversations/create-empty`,
      { userId, botId },
      { timeout: 20000 } // 20 segundos
    );
    return data.conversationId;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      console.warn("⚠️ La petición a createConversation se abortó por timeout");
    } else {
      console.error("Error creando conversación:", error);
    }
    return null;
  }
}
