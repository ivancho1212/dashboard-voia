import { useEffect, useRef } from 'react';
import { refreshAccessToken } from 'services/authService';

/**
 * Hook para mantener la sesión activa mientras el usuario está usando la plataforma
 * Detecta actividad del usuario y extiende automáticamente la sesión.
 * 
 * Con tokens de 8 horas, el refresh se hace 30 min antes de expirar.
 * El heartbeat revisa cada 10 minutos si el token necesita renovación.
 */
export const useActivityTracker = () => {
  const lastActivityRef = useRef(Date.now());
  const heartbeatIntervalRef = useRef(null);

  useEffect(() => {
    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Registrar listeners de actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    // Heartbeat: verificar si el usuario está activo y extender sesión si es necesario
    const startHeartbeat = () => {
      heartbeatIntervalRef.current = setInterval(async () => {
        const now = Date.now();
        const timeSinceActivity = now - lastActivityRef.current;
        
        // Si el usuario estuvo activo en los últimos 30 minutos
        if (timeSinceActivity < 30 * 60 * 1000) {
          const token = localStorage.getItem('token');
          if (!token) return;

          try {
            // Decodificar token para ver tiempo restante
            const base64Payload = token.split('.')[1];
            const payload = JSON.parse(atob(base64Payload));
            const timeUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
            
            // Si al token le quedan menos de 60 minutos Y el usuario está activo → refrescar
            if (timeUntilExpiry < 60 * 60 && timeUntilExpiry > 0) {
              await refreshAccessToken();
            } else if (timeUntilExpiry > 0) {
            } else {
              // Token expirado — intentar refresh
              console.warn('⚠️ [ActivityTracker] Token expirado, intentando renovar...');
              try {
                await refreshAccessToken();
              } catch (e) {
                console.error('❌ [ActivityTracker] No se pudo renovar token expirado:', e?.message);
              }
            }
          } catch (e) {
            console.warn('⚠️ [ActivityTracker] Error verificando token:', e);
          }
        } else {
        }
      }, 10 * 60 * 1000); // Cada 10 minutos
    };

    // Iniciar heartbeat inmediatamente
    startHeartbeat();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

  return {
    getLastActivity: () => lastActivityRef.current,
    isUserActive: () => Date.now() - lastActivityRef.current < 30 * 60 * 1000
  };
};