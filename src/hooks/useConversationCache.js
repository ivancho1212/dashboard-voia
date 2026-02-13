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

  // Quitar fileContent/preview (base64) antes de guardar — provocan out of memory en localStorage
  const stripHeavyFileData = (m) => {
    const out = { ...m, color: m.color ?? getSenderColor(m.from) };
    if (out.multipleFiles?.length) {
      out.multipleFiles = out.multipleFiles.map(({ fileContent, preview, ...rest }) => rest);
    }
    if (out.file && (out.file.fileContent || out.file.preview)) {
      const { fileContent, preview, ...rest } = out.file;
      out.file = rest;
    }
    if (out.images?.length) {
      out.images = out.images.map(({ fileContent, preview, ...rest }) => rest);
    }
    return out;
  };

  const saveConversationCache = useCallback((convId, msgs) => {
    if (!convId || !msgs?.length) return;
    const cacheableMessages = msgs.filter(m =>
      (m.id || m.tempId) && m.status !== "error"
    );
    if (!cacheableMessages.length) return;
    const map = new Map();
    cacheableMessages.forEach(m => {
      const key = m.id ?? m.tempId;
      map.set(key, stripHeavyFileData(m));
    });
    const mergedMessages = Array.from(map.values());
    saveCache(convId, mergedMessages);
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
