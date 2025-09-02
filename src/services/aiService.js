import axios from "axios";

const controller = new AbortController();

export async function getBotResponse(botId, userId, question, capturedFields = [], signal = null) {
  try {
    const response = await axios.post(
      `${API_URL}/GetResponse`,
      { botId, userId, question, capturedFields },
      { signal }
    );
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.warn("⏹️ Request cancelado");
      return { error: true, message: "Request cancelado" };
    }
    console.error("❌ Error en getBotResponse:", error.response?.data || error.message);
    return { error: true, message: error.response?.data || error.message };
  }
}

