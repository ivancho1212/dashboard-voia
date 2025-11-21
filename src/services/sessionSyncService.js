/**
 * 🆕 Service SIMPLIFICADO para sincronizar estado de sesión
 * 
 * ✅ SOLO para persistencia: recordar conversation_id en el widget embebido
 * ❌ NO para bloqueo entre dispositivos (eso es SignalR + Backend)
 * 
 * Bloqueo y sincronización multi-dispositivo se hace vía:
 * - Backend Endpoints: POST /join-mobile, POST /leave-mobile
 * - SignalR Events: "MobileSessionStarted", "MobileSessionEnded"
 */

export const sessionSyncService = {
  /**
   * ✅ GUARDAR estado de conversación en localStorage
   * Para que el widget embebido recuerde si recarga
   */
  saveConversationState: (conversationId, botId) => {
    if (!conversationId) return;
    
    try {
      const state = {
        conversationId,
        botId,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(`conversation_${conversationId}`, JSON.stringify(state));
    } catch (e) {
      console.error('❌ Error guardando estado conversación:', e);
    }
  },

  /**
   * ✅ CARGAR estado de conversación desde localStorage
   */
  loadConversationState: (conversationId) => {
    if (!conversationId) return null;
    
    try {
      const data = localStorage.getItem(`conversation_${conversationId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('❌ Error cargando estado conversación:', e);
      return null;
    }
  },

  /**
   * ✅ LIMPIAR estado de conversación
   */
  clearConversationState: (conversationId) => {
    if (!conversationId) return;
    
    try {
      localStorage.removeItem(`conversation_${conversationId}`);
    } catch (e) {
      console.error('❌ Error limpiando estado conversación:', e);
    }
  },

  /**
   * ✅ OBTENER conversation ID activa del localStorage
   * Para buscar la más reciente
   */
  getActiveConversationId: () => {
    try {
      // Buscar la más reciente en localStorage
      let mostRecent = null;
      let mostRecentDate = null;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('conversation_')) {
          const data = JSON.parse(localStorage.getItem(key));
          const saveDate = new Date(data.savedAt);
          
          if (!mostRecentDate || saveDate > mostRecentDate) {
            mostRecentDate = saveDate;
            mostRecent = data.conversationId;
          }
        }
      }
      return mostRecent;
    } catch (e) {
      console.error('❌ Error obteniendo conversation activa:', e);
      return null;
    }
  }
};

export default sessionSyncService;
