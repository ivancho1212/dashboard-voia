import axios from "axios";

// ✅ Cargar conversaciones del usuario
export async function getConversationsByUser(userId) {
  const response = await axios.get(`/api/Conversations/by-user/${userId}`);
  return response.data.map((c) => ({
    id: `${c.id}`,
    alias: c.user?.name || `Usuario ${String(c.id).slice(-4)}`,
    lastMessage: c.userMessage || "",
    updatedAt: c.createdAt || new Date().toISOString(),
    status: "activa",
    blocked: false,
  }));
}

// ✅ Cargar mensajes por conversación
export async function getMessagesByConversationId(conversationId) {
  const response = await axios.get(`/api/Messages/by-conversation/${conversationId}`);

  return response.data.map((msg) => ({
    id: msg.id,
    from: msg.sender, // "user" | "admin" | "bot"
    text: msg.messageText,
    timestamp: msg.createdAt,
    replyTo: msg.replyToMessageId
      ? {
          id: msg.replyToMessageId,
          text: "mensaje anterior", // puedes mejorarlo si el backend lo trae
        }
      : null,
    multipleFiles: null,       // Placeholder (puedes implementar soporte para archivos luego)
    fileContent: null,
    fileType: null,
    fileName: null,
  }));
}
