// Obtiene un bot por su ID
import axios from "axios";

const API_BASE = "http://localhost:5006/api";

export async function getBotById(botId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`http://localhost:5006/api/Bots/${botId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    const err = new Error(error.response?.data?.message || "No se pudo obtener el bot");
    err.status = error.response?.status;
    throw err;
  }
}
// Marca el bot como listo (IsReady = true)
// Actualiza el bot con el payload completo requerido por UpdateBotDto
export async function updateBotReady(botId, botData) {
  try {
    const token = localStorage.getItem("token");
  const response = await axios.put(`${API_URL}/${botId}`, botData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en updateBotReady:", error.response?.data || error.message);
    throw error;
  }
}
const API_URL = "http://localhost:5006/api/Bots";

export async function getMyBot() {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "No se pudo obtener el bot");
  }
}
export async function getBotsByUserId(userId) {
  try {
    const response = await axios.get(`${API_URL}/byUser/${userId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "No se pudieron obtener los bots del usuario");
  }
}

export async function createBot(botData) {
  try {
    const token = localStorage.getItem("token"); // 🔥 tomar token guardado
    const response = await axios.post(API_URL, botData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en createBot:", error.response?.status, error.response?.data || error.message);
    // Throw a clearer error for callers to handle UX (401 -> auth issue)
    const err = new Error(error.response?.data?.message || error.message || 'Error creating bot');
    err.status = error.response?.status;
    err.details = error.response?.data;
    throw err;
  }
}

export async function deleteBot(botId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/${botId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en deleteBot:", error.response?.data || error.message);
    throw error;
  }
}

export async function forceDeleteBot(botId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/${botId}/force`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error en forceDeleteBot:", error.response?.data || error.message);
    throw error;
  }
}

export const updateBotStyle = async (botId, styleId) => {
  return axios.patch(`http://localhost:5006/api/Bots/${botId}/style`, {
    styleId: styleId,
  });
};

export const getBotContext = async (botId) => {
  try {
    const response = await fetch(`${API_URL}/${botId}/context`);
    if (!response.ok) {
      throw new Error("Error al obtener el contexto del bot");
    }
    return await response.json();
  } catch (error) {
    console.error("Error en getBotContext:", error);
    return null;
  }
  
};

export const getBotDataWithToken = async (botId, token) => {
  try {
    // Only include token param when it's a non-empty string (avoid sending 'undefined')
    const config = { timeout: 10000 };
    if (token && typeof token === 'string' && token.trim() !== '' && token !== 'undefined') {
      config.params = { token };
    }
    const response = await axios.get(`${API_URL}/${botId}/widget-settings`, config);
    return response.data;
  } catch (error) {
    console.error("Error en getBotDataWithToken:", error?.response?.status, error?.response?.data || error.message || error);
    throw error;
  }
};

// Get authoritative phases for a bot from backend
export async function getBotPhases(botId) {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE}/BotPhases/bot/${botId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // shape: { phases: { training: { completed, completedAt, meta }, ... } }
  } catch (error) {
    console.error("Error fetching bot phases:", error?.response?.data || error.message || error);
    // Rethrow so callers can decide fallback behavior
    throw error;
  }
}