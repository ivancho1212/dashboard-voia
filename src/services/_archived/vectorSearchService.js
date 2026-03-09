import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/vectorsearch`;

export const searchVector = async (query, botId, limit = 3) => {
  try {
    const response = await axios.post(`${API_URL}/search`, {
      query,
      botId,
      limit,
    });
    return response.data; // { results: [...] }
  } catch (error) {
    console.error("❌ Error en searchVector:", error);
    throw error;
  }
};
