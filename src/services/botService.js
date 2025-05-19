import axios from "axios";

const API_URL = "/api/Bots";

export async function getMyBot() {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data; // axios pone la data aquí
  } catch (error) {
    throw new Error(error.response?.data?.message || "No se pudo obtener el bot");
  }
}

export async function createBot(botData) {
  const response = await fetch("/api/Bots", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(botData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Error al crear el bot");
  }

  return response.json();
}
