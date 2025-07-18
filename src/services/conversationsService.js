import axios from "axios";

const BASE_URL = "http://localhost:5006"; // ⚠️ Solo para desarrollo

// ✅ Cargar conversaciones del usuario
export async function getConversationsByUser(userId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/Conversations/by-user/${userId}`);

    console.log("✅ [getConversationsByUser] Respuesta cruda:", response.data);

    const conversations = Array.isArray(response.data.conversations)
      ? response.data.conversations
      : Array.isArray(response.data)
      ? response.data
      : [];

    console.log(`✅ [getConversationsByUser] ${conversations.length} conversaciones procesadas`);

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

    console.log("✅ [getMessagesByConversationId] Respuesta cruda:", response.data);

    const messages = Array.isArray(response.data) ? response.data : [];

    console.log(`✅ [getMessagesByConversationId] ${messages.length} mensajes procesados`);

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
