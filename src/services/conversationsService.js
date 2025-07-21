import axios from "axios";

const BASE_URL = "http://localhost:5006"; // ⚠️ Solo para desarrollo

// ✅ Cargar conversaciones del usuario
export async function getConversationsByUser(userId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/Conversations/by-user/${userId}`);


    const conversations = Array.isArray(response.data.conversations)
      ? response.data.conversations
      : Array.isArray(response.data)
      ? response.data
      : [];


    return conversations.map((c) => ({
      id: `${c.id}`,
      alias: c.user?.name || `Usuario ${String(c.id).slice(-4)}`,
      lastMessage: c.userMessage || "",
      updatedAt: c.createdAt || new Date().toISOString(),
      status: "activa",
      blocked: false,
    }));
  } catch (error) {
    console.error("❌ [getConversationsByUser] Error al obtener conversaciones:", error);
    return [];
  }
}

// ✅ Cargar mensajes por conversación
export async function getMessagesByConversationId(conversationId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/Messages/by-conversation/${conversationId}`);


    const messages = Array.isArray(response.data) ? response.data : [];


    return messages.map((msg) => ({
      id: msg.id,
      from: msg.sender, // "user" | "admin" | "bot"
      text: msg.messageText,
      timestamp: msg.createdAt,
      replyTo: msg.replyToMessageId
        ? {
            id: msg.replyToMessageId,
            text: "mensaje anterior", // puedes mejorar esto si backend lo soporta
          }
        : null,
      multipleFiles: null,
      fileContent: null,
      fileType: null,
      fileName: null,
    }));
  } catch (error) {
    console.error("❌ [getMessagesByConversationId] Error al obtener mensajes:", error);
    return [];
  }
}
// ✅ Nuevo: historial completo (mensajes + archivos ordenados)
export async function getConversationHistory(conversationId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/Conversations/history/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("❌ [getConversationHistory] Error al obtener historial:", error);
    return [];
  }
}
