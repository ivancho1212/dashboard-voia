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
    // 🚫 Detectar bloqueo de usuario (403) — múltiples formas de detección
    const respData = error.response?.data || {};
    const respStatus = error.response?.status;
    const errMsg = respData.message || respData.Message || error.message || '';
    const errCode = respData.error || respData.Error || '';
    
    const isBlocked = respStatus === 403 || 
                      errCode === 'USER_BLOCKED' ||
                      errMsg.includes('restringido') || 
                      errMsg.includes('bloqueado');
    
    console.warn(`🔍 [createConversation] Error capturado: status=${respStatus}, errCode=${errCode}, msg=${errMsg}, isBlocked=${isBlocked}`);
    
    if (isBlocked) {
      console.warn("🚫 [createConversation] Usuario bloqueado detectado:", respData);
      return { 
        blocked: true, 
        message: errMsg || "Acceso restringido",
        reason: respData.reason || respData.Reason,
        contactEmail: respData.contactEmail || respData.ContactEmail || null
      };
    }
    console.error("❌ [createConversation] Error:", errMsg);
    return null;
  }
}