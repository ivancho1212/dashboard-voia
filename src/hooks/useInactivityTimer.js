/**
 * 🆕 Custom Hook: useInactivityTimer
 * 
 * Detecta inactividad (sin clicks, teclas, toques) y ejecuta callback al timeout.
 * Usado en móvil para cerrar sesión automáticamente después de 30 segundos.
 * 
 * Muestra countdown: 30s → 25s → 5s (warning) → 0s (cierre)
 */

import { useEffect, useState, useRef, useCallback } from 'react';

export const useInactivityTimer = (
  conversationId,
  onTimeoutCallback,
  timeoutSeconds = 30,
  warningSeconds = 5
) => {
  const [secondsRemaining, setSecondsRemaining] = useState(timeoutSeconds);
  const [showWarning, setShowWarning] = useState(false);
  const timerRef = useRef(null);
  const lastActivityTimeRef = useRef(Date.now());

  // Función para reiniciar el timer
  const resetTimer = useCallback(() => {
    lastActivityTimeRef.current = Date.now();
    setSecondsRemaining(timeoutSeconds);
    setShowWarning(false);

    // Limpiar timer anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Iniciar nuevo countdown
    let remaining = timeoutSeconds;
    timerRef.current = setInterval(() => {
      remaining--;
      setSecondsRemaining(remaining);

      // Mostrar warning últimos X segundos
      if (remaining <= warningSeconds) {
        setShowWarning(true);
      }

      // Timeout
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        console.log('⏰ [useInactivityTimer] Timeout de inactividad alcanzado');
        onTimeoutCallback?.();
      }
    }, 1000);
  }, [timeoutSeconds, warningSeconds, onTimeoutCallback]);

  // EFECTO: Configurar el timer al montar y reaccionar a cambios
  useEffect(() => {
    resetTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [resetTimer]);

  // EFECTO: Listeners de actividad
  useEffect(() => {
    const handleActivity = () => {
      // Solo reiniciar si está en warning o está a punto de expirar
      // Esto evita reiniciar constantemente si el usuario está escribiendo
      if (showWarning || secondsRemaining <= warningSeconds + 5) {
        resetTimer();
      }
    };

    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [resetTimer, showWarning, secondsRemaining, warningSeconds]);

  return {
    secondsRemaining,
    showWarning,
    isExpired: secondsRemaining <= 0,
    resetTimer
  };
};

export default useInactivityTimer;
