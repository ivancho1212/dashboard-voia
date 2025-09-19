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
      alias: c.alias,
      lastMessage: c.userMessage || "",
      updatedAt: c.createdAt || new Date().toISOString(),
      status: c.status,
      blocked: false,
      isWithAI: c.isWithAI ?? true, // ← añadido aquí
    }));
  } catch (error) {
    console.error("❌ [getConversationsByUser] Error al obtener conversaciones:", error);
    return [];
  }
}

// ✅ Nuevo: Actualizar el estado de una conversación
export async function updateConversationStatus(conversationId, newStatus) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/Conversations/${conversationId}/status`,
      { status: newStatus } // El cuerpo coincide con el UpdateStatusDto
    );
    console.log("✅ [updateConversationStatus] Estado actualizado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [updateConversationStatus] Error al actualizar el estado:", error);
    return null;
  }
}

// ✅ Cargar historial completo (mensajes + archivos + detalles)
export async function getConversationHistory(conversationId) {
  try {
    // 💡 Recuerda: la API ahora devuelve { ConversationDetails: {...}, History: [...] }
    const response = await axios.get(`${BASE_URL}/api/Conversations/history/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("❌ [getConversationHistory] Error al obtener historial:", error);
    return null; // Devolver null para manejar el error en el componente
  }
}
// ✅ Nuevo: Marcar mensajes como leídos en una conversación
export async function markMessagesAsRead(conversationId) {
  try {
    const response = await axios.post(`${BASE_URL}/api/Messages/mark-read/${conversationId}`);
    console.log("✅ [markMessagesAsRead] Mensajes marcados como leídos:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [markMessagesAsRead] Error al marcar mensajes como leídos:", error);
    return null;
  }
}

// ⚠️ Esta función podría ser redundante si `getConversationHistory` ya hace lo que necesitas.
// Considera si aún la necesitas o si puedes usar `getConversationHistory` en su lugar.
export async function getMessagesByConversationId(conversationId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/Messages/by-conversation/${conversationId}`);

    const messages = Array.isArray(response.data) ? response.data : [];

    return messages.map((msg) => ({
      id: msg.id,
      from: msg.sender,
      text: msg.messageText,
      timestamp: msg.createdAt,
      replyTo: msg.replyToMessageId
        ? {
            id: msg.replyToMessageId,
            text: "mensaje anterior",
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

// ✅ Nuevo: Actualizar si la conversación es con IA
export async function updateConversationIsWithAI(conversationId, isWithAI) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/Conversations/${conversationId}/with-ai`,
      { isWithAI } // Suponiendo que el backend espera un body con { isWithAI: true/false }
    );
    console.log("✅ [updateConversationIsWithAI] Estado IA actualizado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ [updateConversationIsWithAI] Error al actualizar IA:", error);
    return null;
  }
}
// ✅ Cargar conversaciones con su último mensaje (texto o archivo)
export async function getConversationsWithLastMessage() {
  try {
    const response = await axios.get(`${BASE_URL}/api/Conversations/with-last-message`);

    const conversations = Array.isArray(response.data) ? response.data : [];

    return conversations.map((c) => ({
      id: `${c.id}`,
      alias: c.alias,
      lastMessage: c.lastMessage
        ? c.lastMessage.type === "text"
          ? c.lastMessage.content // Use content for text
          : c.lastMessage.type === "image"
          ? "📷 Imagen" // Consistent naming
          : `📎 Archivo: ${c.lastMessage.content}` // Use content for file name
        : "Conversación iniciada",
      updatedAt: c.lastMessage?.timestamp || c.updatedAt || new Date().toISOString(), // Use timestamp from lastMessage
      status: c.status,
      blocked: false,
      isWithAI: c.isWithAI,
    }));
  } catch (error) {
    console.error("❌ [getConversationsWithLastMessage] Error:", error);
    return [];
  }
}
