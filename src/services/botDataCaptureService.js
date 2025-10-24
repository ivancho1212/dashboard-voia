import axios from "axios";

const API_URL = "http://localhost:5006/api/botdatacapturefields";

export const getBotDataCaptureFields = async (botId) => {
  const token = localStorage.getItem("token");
  if (!botId) return [];
  try {
    const response = await axios.get(`${API_URL}/by-bot/${botId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener campos de captura de datos:", error);
    return [];
  }
};
