// ✅ Eliminar etiqueta por id
export async function deleteConversationTag(tagId) {
  try {
    await axios.delete(`${BASE_URL}/api/ConversationTags/${tagId}`);
    return true;
  } catch (error) {
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
    return null;
  }
}
