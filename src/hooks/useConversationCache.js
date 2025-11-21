import { useCallback } from "react";
import useChatCache from "./useChatCache";
import { getSenderColor } from "../utils/colors";

/**
 * Hook para gestionar caché y sesión de conversación
 * - saveConversationCache: guarda mensajes relevantes y deduplica
 * - loadConversationCache: recupera mensajes normalizados
 * - clearCache: elimina caché
 * - loadedConversationsRef: referencia para control de historial
 */
export default function useConversationCache(CACHE_KEY) {
  const {
    loadCache,
    saveCache,
    clearCache,
    loadedConversationsRef,
  } = useChatCache(CACHE_KEY);

  const saveConversationCache = useCallback((convId, msgs) => {
    if (!convId || !msgs?.length) return;
    const cacheableMessages = msgs.filter(m =>
      (m.id || m.tempId) && ["sent", "queued", "sending"].includes(m.status)
    );
    if (!cacheableMessages.length) return;
    // Deduplicar y colorear
    const map = new Map();
    cacheableMessages.forEach(m => {
      const key = m.id ?? m.tempId;
      map.set(key, { ...m, color: m.color ?? getSenderColor(m.from) });
    });
    const mergedMessages = Array.from(map.values());
    saveCache(mergedMessages);
  }, [saveCache]);

  const loadConversationCache = useCallback(() => {
    return loadCache();
  }, [loadCache]);

  return {
    saveConversationCache,
    loadConversationCache,
    clearCache,
    loadedConversationsRef,
  };
}
