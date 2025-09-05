// dashboard-voia/src/services/chatService.js
import axios from "axios";

const API_URL = "http://localhost:5006/api";

// Solo crea la conversación y devuelve el conversationId
export async function createConversation(userId, botId) {
  try {
    const { data } = await axios.post(`${API_URL}/Conversations/create-empty`, {
      userId,
      botId
    });
    return data.conversationId;
  } catch (error) {
    console.error("Error creando conversación:", error);
    return null;
  }
}
