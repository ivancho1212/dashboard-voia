// Hook para manejar el mensaje de bienvenida personalizado
import { useState, useRef, useEffect } from "react";

export default function useWelcomeMessage({ userLocation, botId, initialDemo }) {
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const welcomeShownRef = useRef(false);
  const welcomeTimeoutRef = useRef(null);

  useEffect(() => {
    if (!userLocation || !botId || initialDemo) return;
    // ...fetch y lógica aquí...
  }, [userLocation, botId, initialDemo]);

  return { welcomeMessage, setWelcomeMessage, welcomeShownRef, welcomeTimeoutRef };
}
