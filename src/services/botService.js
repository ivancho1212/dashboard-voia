// src/services/botService.js
import axios from "axios";

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
    const response = await axios.post(API_URL, botData);
    return response.data;
  } catch (error) {
    console.error("Error en createBot:", error);
    throw error;
  }
}

// ✅ Nuevo método para actualizar solo el estilo del bot
export async function updateBotStyle(botId, styleId) {
  try {
    const res = await axios.get(`${API_URL}/${botId}`);
    const bot = res.data;
    const updatedBot = { ...bot, styleId };
    return await axios.put(`${API_URL}/${botId}`, updatedBot);
  } catch (error) {
    console.error("Error al actualizar el estilo del bot:", error);
    throw error;
  }
}
