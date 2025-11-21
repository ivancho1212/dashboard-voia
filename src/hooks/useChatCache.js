import { useRef } from "react";
import { unifyMessages, normalizeMessage } from "../utils/chatUtils";

/**
 * Custom hook para manejar caché y sesión de chat
 * - Recupera y guarda mensajes en sessionStorage/localStorage
 * - Deduplica y normaliza mensajes
 * - Expone API simple para el componente principal
 */
export default function useChatCache(CACHE_KEY) {
  const loadedConversationsRef = useRef(new Set());

  function loadCache() {
    let cached = null;
    try {
      const session = sessionStorage.getItem(CACHE_KEY);
      const local = localStorage.getItem(CACHE_KEY);
      cached = session ? JSON.parse(session) : local ? JSON.parse(local) : null;
    } catch (e) {
      cached = null;
    }
    let messages = [];
    if (cached && Array.isArray(cached.messages)) {
      // Normalizar y deduplicar
      messages = unifyMessages(cached.messages.map(normalizeMessage));
    }
    return { messages };
  }

  function saveCache(messages) {
    try {
      const data = JSON.stringify({ messages });
      sessionStorage.setItem(CACHE_KEY, data);
      localStorage.setItem(CACHE_KEY, data);
    } catch (e) {
      // Silenciar errores de almacenamiento
    }
  }

  function clearCache() {
    try {
      sessionStorage.removeItem(CACHE_KEY);
      localStorage.removeItem(CACHE_KEY);
    } catch (e) {}
  }

  return {
    loadCache,
    saveCache,
    clearCache,
    loadedConversationsRef,
  };
}
