import axios from "./axiosConfig";
import { logClaims, hasRole } from "services/authService";

const BASE_URL = "http://localhost:5006"; // ⚠️ Solo para desarrollo

// small helper to check auth token presence before calling protected endpoints
function _ensureToken() {
  const token = localStorage.getItem("token");
  if (!token) {
    return null;
  }
  return token;
}

// ✅ Mover conversación a papelera (soft delete)
export async function moveConversationToTrash(conversationId) {
  try {
    if (!_ensureToken() === null) {
      // _ensureToken already logs missing token; continue to attempt request anyway
    }
    const response = await axios.patch(
      `${BASE_URL}/api/Conversations/${conversationId}/move-to-trash`
    );
    return response.data;
  } catch (error) {
    return null;
  }
}

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
    return [];
  }
}

// ✅ Nuevo: Actualizar el estado de una conversación
export async function updateConversationStatus(conversationId, newStatus) {
  try {
    if (!_ensureToken()) {
      console.warn('⚠️ [updateConversationStatus] No hay token, abortando.');
      return null;
    }

    // Quick role check: el backend valida permisos con [HasPermission("CanEditConversations")]
    // Solo loguear si no tiene rol Admin, pero NO bloquear — dejar que el backend decida
    if (!hasRole('Admin')) {
      console.warn('⚠️ [updateConversationStatus] hasRole("Admin") = false. Intentando de todas formas...');
    }

    const response = await axios.patch(
      `${BASE_URL}/api/Conversations/${conversationId}/status`,
      { status: newStatus } // El cuerpo coincide con el UpdateStatusDto
    );
    console.log('✅ [updateConversationStatus] Respuesta:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [updateConversationStatus] Error:', error?.response?.status, error?.response?.data || error?.message);
    return null;
  }
}

// 🚫 Bloquear o desbloquear al usuario público de una conversación
export async function blockUserByConversation(conversationId, block = true, reason = null) {
  try {
    if (!_ensureToken()) {
      console.warn('⚠️ [blockUserByConversation] No hay token, abortando.');
      return null;
    }

    const response = await axios.patch(
      `${BASE_URL}/api/Conversations/${conversationId}/block-user`,
      { block, reason }
    );
    console.log(`✅ [blockUserByConversation] Usuario ${block ? 'bloqueado' : 'desbloqueado'}:`, response.data);
    return response.data;
  } catch (error) {
    console.error('❌ [blockUserByConversation] Error:', error?.response?.status, error?.response?.data || error?.message);
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
    return null; // Devolver null para manejar el error en el componente
  }
}

// ✅ Nuevo: obtener mensajes paginados usando el endpoint del backend
export async function getMessagesPaginated(conversationId, before = null, limit = 50) {
  try {
    const params = {};
    if (before) params.before = before; // Date ISO string
    if (limit) params.limit = limit;
    const response = await axios.get(`${BASE_URL}/api/Conversations/${conversationId}/messages`, { params });
    // Response shape: { conversationId, messages: [...], hasMore, nextBefore }
    return response.data;
  } catch (error) {
    return null;
  }
}

// Nuevo: obtener mensajes paginados agrupados por día desde el servidor
export async function getMessagesGrouped(conversationId, before = null, limit = 50) {
  try {
    const params = {};
    if (before) params.before = before;
    if (limit) params.limit = limit;
    const response = await axios.get(`${BASE_URL}/api/Conversations/${conversationId}/messages/grouped`, { params });
    return response.data;
  } catch (error) {
    return null;
  }
}
// ✅ Nuevo: Marcar mensajes como leídos en una conversación
export async function markMessagesAsRead(conversationId) {
  try {
    if (!_ensureToken()) return null;

    if (!hasRole('Admin')) {
      return null;
    }

    const response = await axios.post(`${BASE_URL}/api/Messages/mark-read/${conversationId}`);
    return response.data;
  } catch (error) {
    return null;
  }
}

// ⚠️ Esta función podría ser redundante si `getConversationHistory` ya hace lo que necesitas.
// Considera si aún la necesitas o si puedes usar `getConversationHistory` en su lugar.
export async function getMessagesByConversationId(conversationId) {
  try {
    const response = await axios.get(`${BASE_URL}/api/Messages/by-conversation/${conversationId}`);
    const raw = Array.isArray(response.data) ? response.data : [];

    return raw.map((msg) => {
      const id = msg.id ?? msg.Id;
      const text = msg.messageText ?? msg.MessageText ?? msg.text ?? msg.Text ?? "";
      const timestamp = msg.createdAt ?? msg.CreatedAt ?? null;
      let fromRole = msg.sender ?? msg.Sender ?? null;
      if (!fromRole) fromRole = msg.BotId ? "bot" : (msg.UserId || msg.PublicUserId ? "user" : "user");
      const fromName = (msg.user && msg.user.name) || msg.UserName || msg.userName || null;
      const replyTo = msg.replyToMessageId ?? msg.ReplyToMessageId ?? null;

      // ✅ Extraer datos de archivo desde el backend (ChatUploadedFile incluido)
      const fileUrl = msg.fileUrl ?? msg.FileUrl ?? null;
      const fileName = msg.fileName ?? msg.FileName ?? null;
      const fileType = msg.fileType ?? msg.FileType ?? null;
      const hasFile = fileUrl && fileName;

      // ✅ FIX: Limpiar texto placeholder cuando el mensaje tiene archivo adjunto
      // El backend guarda MessageText="📎 filename" pero no debe mostrarse en el chat
      let cleanText = text;
      if (hasFile && cleanText) {
        if (/^📎\s/.test(cleanText) || /^Se enviaron múltiples imágenes/.test(cleanText)) {
          cleanText = "";
        }
      }

      return {
        id,
        from: fromRole,
        text: cleanText,
        timestamp,
        fromRole,
        fromName,
        replyTo: replyTo
          ? {
              id: replyTo,
              text: "mensaje anterior",
            }
          : null,
        // ✅ Mapear archivos del backend al formato del frontend
        files: hasFile ? [{ fileName, fileType, fileUrl }] : null,
        fileUrl: fileUrl,
        fileType: fileType,
        fileName: fileName,
        multipleFiles: null,
        fileContent: null,
      };
    });
  } catch (error) {
    // Return null to indicate the fetch failed (distinguish from an empty but successful response)
    return null;
  }
}

// ✅ Nuevo: Actualizar si la conversación es con IA
export async function updateConversationIsWithAI(conversationId, isWithAI) {
  try {
    const response = await axios.patch(
      `${BASE_URL}/api/Conversations/${conversationId}/with-ai`,
      { isWithAI } // Suponiendo que el backend espera un body con { isWithAI: true/false }
    );
    return response.data;
  } catch (error) {
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
      blocked: c.blocked || false,
      isWithAI: c.isWithAI,
    }));
  } catch (error) {
    return [];
  }
}
