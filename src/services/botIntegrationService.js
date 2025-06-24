import axios from "axios";

const API_URL = "http://localhost:5006/api/BotIntegrations";

export async function createBotIntegration(dto) {
  const token = localStorage.getItem("token");
  const response = await axios.post(API_URL, dto, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
