import axios from "axios";

const API_URL = "http://localhost:5006/api/Bots";

export async function fullRollbackBot(botId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/${botId}/full-rollback`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en fullRollbackBot:", error.response?.data || error.message);
    throw error;
  }
}
