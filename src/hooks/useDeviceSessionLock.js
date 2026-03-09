/**
 * 🆕 Custom Hook - Bloqueo Mutuo entre Dispositivos
 * 
 * ✅ NUEVO COMPORTAMIENTO: Mutuamente Excluyente
 *    - Si móvil se conecta → web se BLOQUEA
 *    - Si web se enfoca → móvil se CIERRA automáticamente
 * 
 * ✅ Escucha eventos SignalR del backend:
 *    - "MobileSessionStarted" → Bloquea web, muestra modal
 *    - "MobileSessionEnded" → Desbloquea web
 * 
 * 🔄 Sincronización mediante SignalR en tiempo real
 */

import { useEffect, useState, useRef } from 'react';

export const useDeviceSessionLock = (conversationId, hubConnection, isMobileView = false) => {
  const [isBlockedByOtherDevice, setIsBlockedByOtherDevice] = useState(false);
  const [blockingDevice, setBlockingDevice] = useState(null);
  const [blockMessage, setBlockMessage] = useState(null);
  const fallbackTimeoutRef = useRef(null); // Para timeout de fallback
  const pollingIntervalRef = useRef(null); // Para polling fallback

  // EFECTO: Escuchar eventos de SignalR
  useEffect(() => {
    if (!hubConnection || !conversationId) return;

    // 🆕 EN MÓVIL: NO escuchar eventos de bloqueo de dispositivo
    // El móvil está en su propia versión de la conversación
    if (isMobileView) {
      return;
    }


    // ✅ ESCUCHAR: Móvil se unió a esta conversación
    // � ACCIÓN: Bloquear web - Solo móvil puede estar activo
    hubConnection.on('MobileSessionStarted', (data) => {
      
      if (data?.conversationId === conversationId) {
        // 🔒 BLOQUEAR WEB cuando móvil se conecta
        setIsBlockedByOtherDevice(true);
        setBlockingDevice('mobile');
        setBlockMessage('Conversación abierta en móvil. Por favor, continúa desde ahí.');
        
        // 🆕 Establecer fallback: si no recibimos MobileSessionEnded en 6 minutos, desbloquear auto
        if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
        fallbackTimeoutRef.current = setTimeout(() => {
          console.warn('⚠️  [Hook] MobileSessionEnded no recibido en 6 minutos - Fallback desbloqueando web');
          setIsBlockedByOtherDevice(false);
          setBlockingDevice(null);
          setBlockMessage(null);
        }, 6 * 60 * 1000); // 6 minutos
        
        // 🆕 Iniciar polling para verificar estado en BD si evento falla
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = setInterval(async () => {
          try {
            const response = await fetch(
              `http://localhost:5006/api/Conversations/${conversationId}/status`,
              { 
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              }
            );
            
            if (response.ok) {
              const status = await response.json();
              
              // Si backend dice que móvil se cerró, desbloquear
              if (!status.activeMobileSession || status.status === 'closed') {
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                setIsBlockedByOtherDevice(false);
                setBlockingDevice(null);
                setBlockMessage(null);
              }
            }
          } catch (error) {
            console.error('❌ [Hook Polling] Error verificando estado:', error);
          }
        }, 3000); // Verificar cada 3 segundos
      }
    });

    // ✅ ESCUCHAR: Móvil se cerró
    // 🔓 ACCIÓN: Desbloquear web
    hubConnection.on('MobileSessionEnded', (data) => {
      
      if (data?.conversationId === conversationId) {
        // 🆕 Limpiar fallback timeout e interval si se recibe el evento
        if (fallbackTimeoutRef.current) {
          clearTimeout(fallbackTimeoutRef.current);
          fallbackTimeoutRef.current = null;
        }
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        
        setIsBlockedByOtherDevice(false);
        setBlockingDevice(null);
        setBlockMessage(null);
      }
    });

    // Cleanup: remover listeners cuando se desmonta
    return () => {
      hubConnection.off('MobileSessionStarted');
      hubConnection.off('MobileSessionEnded');
      if (fallbackTimeoutRef.current) clearTimeout(fallbackTimeoutRef.current);
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, [hubConnection, conversationId, isMobileView]);

  return {
    isBlockedByOtherDevice,
    blockingDevice,
    blockMessage
  };
};

export default useDeviceSessionLock;

