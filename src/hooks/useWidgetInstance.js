import { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";

/**
 * Hook para inicializar la instancia del widget y la clave de caché
 * - Genera un id único por pestaña
 * - Devuelve botId, userId, widgetInstanceId y CACHE_KEY
 */
export default function useWidgetInstance(propBotId, propUserId) {
  const botId = propBotId ?? 2;
  const userId = propUserId ?? null;
  const widgetInstanceId = useMemo(() => {
    let id = sessionStorage.getItem("widgetInstanceId");
    if (!id) {
      id = uuidv4();
      sessionStorage.setItem("widgetInstanceId", id);
    }
    return id;
  }, []);
  const CACHE_KEY = `chat_cache_${botId}_${userId ?? "anon"}_${widgetInstanceId}`;
  return { botId, userId, widgetInstanceId, CACHE_KEY };
}
