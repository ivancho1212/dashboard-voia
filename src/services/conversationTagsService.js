import axios from "axios";

const BASE_URL = "http://localhost:5006"; // ⚠️ Solo para desarrollo

// ✅ Obtener etiquetas por conversación
export async function getTagsByConversation(conversationId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/ConversationTags/by-conversation/${conversationId}`);
    return response.data || [];
  } catch (error) {
    console.error("❌ [getTagsByConversation] Error al obtener etiquetas:", error);
    return [];
  }
}

// ✅ Crear una nueva etiqueta
export async function createConversationTag(conversationId, tagText) {
  try {
    const response = await axios.post(`${BASE_URL}/api/ConversationTags`, {
      conversationId,
      tag: tagText,
    });
    return response.data;
  } catch (error) {
    console.error("❌ [createConversationTag] Error al crear etiqueta:", error);
    throw error;
  }
}

// ✅ Eliminar etiqueta por ID
export async function deleteConversationTag(tagId) {
  try {
    const response = await axios.delete(`${BASE_URL}/api/ConversationTags/${tagId}`);
    return response.data;
  } catch (error) {
    console.error("❌ [deleteConversationTag] Error al eliminar etiqueta:", error);
    throw error;
  }
}

// ✅ Actualizar una etiqueta existente
export async function updateConversationTag(tagId, newTagText) {
  try {
    const response = await axios.put(`${BASE_URL}/api/ConversationTags/${tagId}`, {
      tag: newTagText,
    });
    return response.data;
  } catch (error) {
    console.error("❌ [updateConversationTag] Error al actualizar etiqueta:", error);
    throw error;
  }
}
