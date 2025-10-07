// ✅ Eliminar etiqueta por id
export async function deleteConversationTag(tagId) {
  try {
    await axios.delete(`${BASE_URL}/api/ConversationTags/${tagId}`);
    return true;
  } catch (error) {
    console.error("❌ [deleteConversationTag] Error al eliminar etiqueta:", error);
    return false;
  }
}
import axios from "axios";

const BASE_URL = "http://localhost:5006"; // ⚠️ Solo para desarrollo

// ✅ Obtener etiquetas por conversación
export async function getTagsByConversationId(conversationId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/ConversationTags/conversation/${conversationId}`);

    const tags = Array.isArray(response.data) ? response.data : [];

    return tags.map((tag) => ({
      id: tag.id,
      label: tag.label,
      messageId: tag.highlightedMessageId,
      createdAt: tag.createdAt,
    }));
  } catch (error) {
    console.error("❌ [getTagsByConversationId] Error al obtener etiquetas:", error);
    return [];
  }
}

// ✅ Crear una nueva etiqueta
export async function createConversationTag({ conversationId, label, highlightedMessageId = null }) {
  try {
    const payload = {
      conversationId,
      label,
      highlightedMessageId,
    };

    const response = await axios.post(`${BASE_URL}/api/ConversationTags`, payload);
    return response.data;
  } catch (error) {
    console.error("❌ [createConversationTag] Error al crear etiqueta:", error);
    return null;
  }
}
