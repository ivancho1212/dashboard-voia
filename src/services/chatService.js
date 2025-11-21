// dashboard-voia/src/services/chatService.js
import axios from "axios";
import { getOrGenerateFingerprint } from "./fingerprintService";

const API_URL = "http://localhost:5006/api";

// chatService.js
export async function createConversation(userId, botId, clientSecret, forceNewSession = false) {
  try {
    // 🆕 Obtener fingerprint del navegador
    const browserFingerprint = await getOrGenerateFingerprint();
    
    // ✅ IMPORTANTE: Usuarios anónimos del widget deben tener userId = null o 0
    // Si userId no está definido o es <= 0, entonces es usuario público
    const finalUserId = userId && userId > 0 ? userId : null;
    
    // ✅ VALIDAR QUE EL CLIENT SECRET EXISTE
    if (!clientSecret) {
      console.error("❌ [createConversation] Client secret not provided");
      return null;
    }
    
    const { data } = await axios.post(
      `${API_URL}/Conversations/get-or-create`,
      { 
        userId: finalUserId,  // ✅ null para usuarios públicos del widget
        botId, 
        clientSecret,  // ✅ Se envía como JWT del frontend
        forceNewSession,
        browserFingerprint
      },
      { timeout: 20000, withCredentials: true } // ✅ Permitir cookies pero SIN requerir CSRF (endpoint es público)
    );
    return data.conversationId;
  } catch (error) {
    console.error("❌ [createConversation] Error:", error.response?.data?.message || error.message);
    return null;
  }
}