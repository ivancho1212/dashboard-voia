import axios from "axios";

const API_URL = "http://localhost:5006/api/Ai";

export async function getBotResponse(botId, userId, question, capturedFields = []) {
  try {
    // ✅ Aquí agregas el log
    console.log("📤 Enviando a backend:", { botId, userId, question, capturedFields });

    const response = await axios.post(`${API_URL}/GetResponse`, {
      botId,
      userId,
      question,
      capturedFields,
    });

    return response.data; // lo que devuelva tu backend (texto o JSON)
  } catch (error) {
    console.error("❌ Error en getBotResponse:", error.response?.data || error.message);
    return "{}"; // algo seguro para no romper el flujo
  }
}

