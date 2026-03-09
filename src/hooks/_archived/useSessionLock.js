// Hook para manejar el bloqueo por dispositivo y sesión móvil
import { useState, useEffect } from "react";

export default function useSessionLock({ deviceSessionLock }) {
  const [isBlockedByOtherDevice, setIsBlockedByOtherDevice] = useState(deviceSessionLock.isBlockedByOtherDevice);
  const [blockMessage, setBlockMessage] = useState(deviceSessionLock.blockMessage);
  const [isMobileSessionActive, setIsMobileSessionActive] = useState(false);
  const [isMobileConversationExpired, setIsMobileConversationExpired] = useState(false);

  useEffect(() => {
    setIsBlockedByOtherDevice(deviceSessionLock.isBlockedByOtherDevice);
    setBlockMessage(deviceSessionLock.blockMessage);
  }, [deviceSessionLock.isBlockedByOtherDevice, deviceSessionLock.blockMessage]);

  return { isBlockedByOtherDevice, setIsBlockedByOtherDevice, blockMessage, setBlockMessage, isMobileSessionActive, setIsMobileSessionActive, isMobileConversationExpired, setIsMobileConversationExpired };
}
