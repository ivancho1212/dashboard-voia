import axios from "axios";

const API_URL = "http://localhost:5006/api/BotIntegrations";

export async function createBotIntegration(dto) {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${API_URL}/upsert`, {
    botId: dto.botId,
    settings: {
      allowedDomain: dto.allowedDomain
    }
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function getBotIntegrationByBotId(botId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/bot/${botId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    // Si es 404, significa que no hay integración para este bot
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getBotIntegrationsByUserId(userId) {
  // Este método ya no se necesita, pero lo mantenemos para compatibilidad
  console.log("ℹ️ getBotIntegrationsByUserId ya no se usa, usar getBotIntegrationByBotId");
  return [];
}

export async function deleteBotIntegration(integrationId) {
  const token = localStorage.getItem("token");
  const response = await axios.delete(`${API_URL}/${integrationId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function deleteBotIntegrationByBotId(botId) {
  const token = localStorage.getItem("token");
  const response = await axios.delete(`${API_URL}/bot/${botId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
