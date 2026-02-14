import { useEffect, useRef } from 'react';
import { refreshAccessToken } from 'services/authService';

/**
 * Hook para mantener la sesión activa mientras el usuario está usando la plataforma
 * Detecta actividad del usuario y extiende automáticamente la sesión
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
        
        // Si el usuario estuvo activo en los últimos 5 minutos
        if (timeSinceActivity < 5 * 60 * 1000) {
          const token = localStorage.getItem('token');
          if (!token) return;

          try {
            // Decodificar token para ver tiempo restante
            const base64Payload = token.split('.')[1];
            const payload = JSON.parse(atob(base64Payload));
            const timeUntilExpiry = payload.exp - Math.floor(Date.now() / 1000);
            
            // Si al token le quedan menos de 10 minutos Y el usuario está activo
            if (timeUntilExpiry < 10 * 60) {
              console.log('🔄 [ActivityTracker] Usuario activo, extendiendo sesión...');
              await refreshAccessToken();
              console.log('✅ [ActivityTracker] Sesión extendida por actividad');
            } else {
              console.log(`ℹ️ [ActivityTracker] Token válido por ${Math.floor(timeUntilExpiry/60)} minutos más`);
            }
          } catch (e) {
            console.warn('⚠️ [ActivityTracker] Error verificando token:', e);
          }
        } else {
          console.log('😴 [ActivityTracker] Usuario inactivo por más de 5 minutos');
        }
      }, 2 * 60 * 1000); // Cada 2 minutos
    };

    // Iniciar heartbeat después de 1 minuto
    const initTimer = setTimeout(startHeartbeat, 60000);

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      
      clearTimeout(initTimer);
    };
  }, []);

  return {
    getLastActivity: () => lastActivityRef.current,
    isUserActive: () => Date.now() - lastActivityRef.current < 5 * 60 * 1000
  };
};