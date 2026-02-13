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
      // Priorizar localStorage (persiste al recargar iframe); sessionStorage se borra
      const local = localStorage.getItem(CACHE_KEY);
      const session = sessionStorage.getItem(CACHE_KEY);
      cached = local ? JSON.parse(local) : session ? JSON.parse(session) : null;
    } catch (e) {
      cached = null;
    }
    let messages = [];
    if (cached && Array.isArray(cached.messages)) {
      // Quitar fileContent/preview (base64) al cargar — evita out of memory con caché antiguo
      const strip = (m) => {
        if (!m) return m;
        const out = { ...m };
        if (out.multipleFiles?.length) out.multipleFiles = out.multipleFiles.map(({ fileContent, preview, ...r }) => r);
        if (out.file && (out.file.fileContent || out.file.preview)) out.file = (({ fileContent, preview, ...r }) => r)(out.file);
        if (out.images?.length) out.images = out.images.map(({ fileContent, preview, ...r }) => r);
        return out;
      };
      messages = unifyMessages(cached.messages.map((m) => normalizeMessage(strip(m))));
    }
    return {
      conversationId: cached?.conversationId ?? cached?.messages?.[0]?.conversationId ?? null,
      messages
    };
  }

  function saveCache(conversationId, messages) {
    try {
      const data = JSON.stringify({ conversationId, messages: messages ?? [] });
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
