import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * Hook para inicializar la instancia del widget y la clave de caché
 * - Genera un id único por pestaña
 * - Devuelve botId, userId, widgetInstanceId y CACHE_KEY
 */
export default function useWidgetInstance(propBotId, propUserId) {
  const botId = propBotId ?? 2;
  // Forzar userId como string, usar 'anon' si está vacío/null/undefined
  const userId = (propUserId !== undefined && propUserId !== null && propUserId !== '') ? String(propUserId) : 'anon';
  const widgetInstanceId = useMemo(() => {
    let id = sessionStorage.getItem("widgetInstanceId");
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem("widgetInstanceId", id);
    }
    return id;
  }, []);
  // CACHE_KEY SIN widgetInstanceId para persistir al recargar
  const CACHE_KEY = `chat_cache_${botId}_${userId ?? "anon"}`;
  return { botId, userId, widgetInstanceId, CACHE_KEY };
}
