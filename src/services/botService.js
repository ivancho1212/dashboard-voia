import axios from "axios";

const API_URL = "http://localhost:5006/api/Bots"; // AJUSTA según tu backend

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
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(botData),
  });

  if (!response.ok) {
    const errorText = await response.text(); // por si no es JSON
    throw new Error(errorText || "Error al crear el bot");
  }

  return response.json();
}
