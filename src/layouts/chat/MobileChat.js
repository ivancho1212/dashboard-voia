import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import WidgetFrame from "layouts/widget/WidgetFrame";
import "layouts/widget/WidgetStyles.css";
import { getCsrfToken, getCsrfHeaderName } from "services/csrfService";
import { getApiBaseUrl } from "config/environment";

/**
 * 🆕 MobileChat Component
 * 
 * Componente que maneja la vista mobile del chat.
 * Reutiliza WidgetFrame pero señala que es una vista móvil.
 * 
 * ✅ Notifica al backend cuando móvil se conecta/desconecta:
 *    - Al entrar: POST /Conversations/{id}/join-mobile
 *    - Al salir: POST /Conversations/{id}/leave-mobile
 * 
 * 🔴 LÓGICA DE INACTIVIDAD (3 minutos):
 *    - Al pasar 3 min sin interacción → muestra alerta
 *    - Después de 30s más → se cierra y limpia caché
 *    - Emite evento SignalR MobileInactivityExpired
 * 
 * URL esperada: /chat/mobile?bot=24&conversation=92
 */
export default function MobileChat() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- NUEVO: Si viene fingerprint en la URL, guardarlo en localStorage antes de cualquier otra cosa ---
  React.useEffect(() => {
    const fingerprint = searchParams.get("fingerprint");
    if (fingerprint) {
      try {
        localStorage.setItem("voia_browser_fingerprint", fingerprint);
        // Opcional: window.voiaFingerprint?.debugFingerprint?.();
        // console.log("[MobileChat] Fingerprint recibido y guardado desde URL:", fingerprint);
      } catch (e) {
        // console.error("[MobileChat] Error guardando fingerprint:", e);
      }
    }
  }, [searchParams]);
  
  // 🔴 INACTIVIDAD: Referencias para timers
  const inactivityTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const inactivityWarningShownRef = useRef(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false); // false | true (alerta) | 'expired' (expirada)
  const [inactivityCountdown, setInactivityCountdown] = useState(null); // 10, 9, 8... 0
  
  // 🆕 VALIDACIÓN: Estado para conversación expirada al cargar y error de unión móvil
  // validationError: null | 'expired' | 'network' | 'missing_params'
  const [conversationStatus, setConversationStatus] = useState(null); // null | 'valid' | 'expired'
  const [validationError, setValidationError] = useState(null); // null | 'expired' | 'network' | 'missing_params'
  const [isValidating, setIsValidating] = useState(true);
  const [mobileJoinError, setMobileJoinError] = useState(null); // null | string (mensaje de error)
  
  // 🔴 INACTIVIDAD: Constante 3 minutos + 10 segundos de aviso
  const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutos
  const INACTIVITY_COUNTDOWN_SEC = 10; // 10 segundos de aviso con conteo regresivo

  const botId = searchParams.get("bot");
  const conversationId = searchParams.get("conversation");
  const token = searchParams.get("token");
  // Permitir userId o user como parámetro y forzar string
  let userId = searchParams.get("userId") || searchParams.get("user");
  if (userId !== undefined && userId !== null) userId = String(userId);

  // 🆕 VALIDACIÓN: Verificar si conversación existe y no está expirada (con timeout para no colgar)
  const VALIDATION_TIMEOUT_MS = 8000; // 8 s abort (respuesta más rápida si el backend no responde)
  const SAFETY_MAX_MS = 15000; // 15 s máximo en pantalla "Validando..." (fallback absoluto)

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_TIMEOUT_MS);
    const API_URL = getApiBaseUrl();

    // Resetear estado al cambiar bot/conversation para que la UI muestre "Validando..." y no quede colgada
    setIsValidating(true);
    setValidationError(null);

    const validateConversation = async () => {
      // ❌ MÓVIL: requiere bot y conversationId en la URL (solo desde QR válido)
      if (!conversationId || !botId) {
        setValidationError('missing_params');
        setConversationStatus('expired');
        setIsValidating(false);
        return;
      }

      // ❌ Rechazar IDs inválidos: solo números positivos (evitar 0, negativos, NaN)
      const convIdNum = parseInt(conversationId, 10);
      if (isNaN(convIdNum) || convIdNum <= 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[MobileChat] ⚠️ conversationId inválido:', conversationId);
        }
        setValidationError('expired');
        setConversationStatus('expired');
        setIsValidating(false);
        return;
      }

      // ✅ Validar conversación vigente: /history devuelve 404 si no existe, 410 si cerrada/expirada
      const url = `${API_URL}/Conversations/history/${conversationId}`;
      if (process.env.NODE_ENV === 'development') {
        console.info('[MobileChat] 🔄 Validando conversación vigente:', url);
      }
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
          signal: controller.signal,
          credentials: 'include',
          mode: 'cors',
          cache: 'no-store',
        });

        if (cancelled) return;

        if (process.env.NODE_ENV === 'development') {
          console.info('[MobileChat] ✅ Respuesta recibida:', response.status, response.ok);
        }

        try {
          await response.text();
        } catch (_) { /* ignorar si falla leer el cuerpo */ }

        if (cancelled) return;
        if (response.ok) {
          if (process.env.NODE_ENV === 'development') {
            console.info('[MobileChat] ✅ Conversación vigente, mostrando chat');
          }
          setValidationError(null);
          setConversationStatus('valid');
        } else if (response.status === 404) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MobileChat] ⚠️ Conversación no existe (404)');
          }
          setValidationError('expired');
          setConversationStatus('expired');
        } else if (response.status === 410) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MobileChat] ⚠️ Conversación cerrada o expirada (410)');
          }
          setValidationError('expired');
          setConversationStatus('expired');
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[MobileChat] ⚠️ Error inesperado:', response.status);
          }
          setValidationError('expired');
          setConversationStatus('expired');
        }
      } catch (error) {
        if (cancelled) return;
        if (process.env.NODE_ENV === 'development') {
          console.error('[MobileChat] ❌ Validación fallida:', error?.message || error, 'URL:', url);
        }
        if (error.name === 'AbortError') {
          setValidationError('network');
        } else {
          setValidationError('network');
        }
        setConversationStatus('expired');
      } finally {
        if (!cancelled) {
          if (process.env.NODE_ENV === 'development') {
            console.info('[MobileChat] 🏁 Finalizando validación, isValidating → false');
          }
          clearTimeout(timeoutId);
          setIsValidating(false);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.info('[MobileChat] 🚫 Validación cancelada (componente desmontado)');
          }
        }
      }
    };

    validateConversation();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [conversationId, botId]);

  // Revalidar cuando la pestaña vuelve a estar visible: si la conversación se cerró (ej. en otra pestaña o por inactividad), mostrar "No disponible" sin tener que recargar
  useEffect(() => {
    if (!conversationId || !botId || conversationStatus !== 'valid') return;
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      const convIdNum = parseInt(conversationId, 10);
      if (isNaN(convIdNum) || convIdNum <= 0) return;
      const API_URL = getApiBaseUrl();
      fetch(`${API_URL}/Conversations/history/${conversationId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
        credentials: 'include',
        cache: 'no-store',
      })
        .then((res) => {
          if (res.status === 404 || res.status === 410) {
            setValidationError('expired');
            setConversationStatus('expired');
          }
        })
        .catch(() => {});
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [conversationId, botId, conversationStatus]);

  // 🆕 Timeout de seguridad: si tras SAFETY_MAX_MS seguimos en "Validando...", forzar salida (evita quedar colgado)
  const validatingRef = useRef(true);
  validatingRef.current = isValidating;
  useEffect(() => {
    if (!conversationId || !botId) return;
    const safetyId = setTimeout(() => {
      if (validatingRef.current) {
        setValidationError('network');
        setConversationStatus('expired');
        setIsValidating(false);
      }
    }, SAFETY_MAX_MS);
    return () => clearTimeout(safetyId);
  }, [conversationId, botId]);

  // 🔴 INACTIVIDAD: Función para resetear timer
  const resetInactivityTimer = React.useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    inactivityWarningShownRef.current = false;
    setShowInactivityMessage(false);
    setInactivityCountdown(null);

    // 🔴 INACTIVIDAD: Iniciar timer de 3 minutos
    inactivityTimerRef.current = setTimeout(() => {
      console.log('⏱️  [MobileChat] 3 minutos sin interacción - mostrando alerta');
      setShowInactivityMessage(true);
      setInactivityCountdown(INACTIVITY_COUNTDOWN_SEC);
      inactivityWarningShownRef.current = true;

      // Después de 10 segundos (conteo regresivo), cerrar conversación y notificar widget
      closeTimerRef.current = setTimeout(() => {
        console.log('🔴 [MobileChat] Inactividad expirada - mostrando página y notificando al widget');
        
        // 🔴 PASO 1: Emitir evento al widget ANTES de cambiar interfaz
        try {
          window.parent.postMessage({
            type: 'mobile-inactivity-expired',
            conversationId: conversationId,
            timestamp: new Date().toISOString()
          }, '*');
          console.log('✅ [MobileChat] Evento enviado al widget');
        } catch (err) {
          console.error('❌ [MobileChat] Error enviando evento:', err);
        }

        // 🔴 PASO 2: Notificar al backend que móvil se desconecta
        notifyMobileLeft();

        // 🔴 PASO 3: Mostrar página expirada (NO cerrar)
        setShowInactivityMessage('expired');
        setInactivityCountdown(null);
      }, INACTIVITY_COUNTDOWN_SEC * 1000); // 10 segundos de aviso
    }, INACTIVITY_TIMEOUT); // 3 minutos
  }, [conversationId]);

  // 🔴 INACTIVIDAD: Detectar interacción del usuario
  useEffect(() => {
    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Escuchar eventos de interacción
    const events = ['mousedown', 'keydown', 'touchstart', 'click', 'input'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });

    // Iniciar timer al montar
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // 🔴 Conteo regresivo: 10, 9, 8... cuando se muestra alerta de inactividad
  React.useEffect(() => {
    if (!showInactivityMessage || showInactivityMessage === 'expired') return;
    const id = setInterval(() => {
      setInactivityCountdown((prev) => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showInactivityMessage]);

  // Solo redirigir si no hay ningún parámetro útil (evitar redirigir cuando mostramos "Enlace incompleto")
  useEffect(() => {
    if (!botId && !conversationId) {
      navigate("/", { replace: true });
    }
  }, [botId, conversationId, navigate]);

  // 🔴 INACTIVIDAD: Función para notificar al backend que móvil se fue
  const notifyMobileLeft = React.useCallback(async () => {
    if (!conversationId) return;
      try {
        await fetch(
          `${getApiBaseUrl()}/Conversations/${conversationId}/leave-mobile`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'inactivity-expired' }),
          keepalive: true
        }
      );
    } catch (error) {
      console.error('❌ [MobileChat] Error notificando leave:', error);
    }
  }, [conversationId]);

  // 🆕 EFECTO: Notificar al backend cuando móvil se conecta/desconecta
  useEffect(() => {
    if (!conversationId) return;

    /**
     * 📱 Notificar al backend que móvil se unió a la conversación
     */
    const notifyMobileJoined = async () => {
      try {
        // Obtener token CSRF
        const csrfToken = await getCsrfToken();
        const csrfHeaderName = getCsrfHeaderName();
        const headers = {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        if (csrfToken) {
          headers[csrfHeaderName] = csrfToken;
        }
        const response = await fetch(
          `${getApiBaseUrl()}/Conversations/${conversationId}/join-mobile`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              deviceType: 'mobile',
              userAgent: navigator.userAgent
            }),
            credentials: 'include' // Permitir cookies
          }
        );
        const result = await response.json().catch(() => null);
        if (!response.ok) {
          console.error('❌ [MobileChat] join-mobile error:', response.status, result);
          let errorMsg = 'No se pudo unir la sesión móvil.';
          if (response.status === 403) errorMsg = 'Acceso denegado. Ya existe una sesión móvil activa en esta conversación.';
          else if (response.status === 410) errorMsg = 'La conversación ha expirado.';
          else if (response.status === 404) errorMsg = 'La conversación no existe.';

          // Mejora: Consultar estado real de la conversación
          try {
            const statusResp = await fetch(`${getApiBaseUrl()}/Conversations/${conversationId}/status`, {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
            if (statusResp.ok) {
              const statusData = await statusResp.json();
              if (statusData.status === 'closed' || !statusData.activeMobileSession) {
                errorMsg = 'La conversación ha terminado. Por favor, escanea un nuevo QR.';
              } else if (statusData.activeMobileSession) {
                errorMsg = 'Ya existe una sesión móvil activa. No puedes continuar en esta conversación desde el móvil.';
              }
            }
          } catch (e) {
            // Si falla la consulta, mantener el mensaje original
          }
          setMobileJoinError(errorMsg);
        } else {
          console.log('✅ [MobileChat] join-mobile success:', response.status, result);
          setMobileJoinError(null);
        }
      } catch (error) {
        console.error('❌ [MobileChat] Error notificando join:', error);
        setMobileJoinError('Error de red al intentar unir la sesión móvil.');
      }
    };

    // Notificar que móvil entró
    notifyMobileJoined();

    // 🆕 Agregar handler para beforeunload (cuando usuario cierra pestaña/app)
    const handleBeforeUnload = () => {
      // Usar sendBeacon para asegurar que se envía antes de cerrar
      navigator.sendBeacon(
        `${getApiBaseUrl()}/Conversations/${conversationId}/leave-mobile`,
        JSON.stringify({ reason: 'page-closed' })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: Notificar que móvil salió cuando se desmonta el componente
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      notifyMobileLeft();
    };
  }, [conversationId, notifyMobileLeft]);

  if (!botId) {
    return null;
  }

  // Construir parámetros para WidgetFrame
  const widgetParams = new URLSearchParams({
    bot: botId,
    ...(conversationId && { conversation: conversationId }),  // ✅ INCLUIR conversationId si existe
    ...(userId ? { userId } : {}), // Propagar userId solo si existe y no es vacío
    ...(token && { token }),
    isMobile: "true", // Parámetro especial para indicar modo móvil
  });

  // 🔴 INACTIVIDAD: Componente de alerta visual (sin parpadeo; con mensaje explicativo)
  const InactivityAlert = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '24px 28px 28px',
        maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
          Conversación por expirar
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginBottom: '16px', lineHeight: 1.4 }}>
          Por inactividad la conversación se cerrará. Interactúa con el chat para continuar.
        </div>
        <div style={{ fontSize: '56px', fontWeight: '700', color: '#b71c1c', lineHeight: 1, marginBottom: '4px' }}>
          {inactivityCountdown ?? INACTIVITY_COUNTDOWN_SEC}
        </div>
        <div style={{ fontSize: '14px', fontWeight: '500', color: '#c62828' }}>
          segundos
        </div>
      </div>
    </div>
  );

  // 🔴 INACTIVIDAD: Página de conversación expirada
  const ExpiredPage = () => (
    <div style={{
      width: '100%',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        maxWidth: '400px'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏰</div>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
          Conversación Expirada
        </h1>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
          Esta conversación ha expirado por inactividad. 
          <br /><br />
          La sesión móvil se cerrará automáticamente en breve.
        </p>
        <p style={{ fontSize: '12px', color: '#999' }}>
          Cierre esta ventana o aguarde a que se cierre automáticamente.
        </p>
      </div>
    </div>
  );


  return (
    <div style={{
      width: "100%",
      height: "100vh",
      overflow: "hidden",
      backgroundColor: "#f5f5f5",
      position: "relative"
    }}>
      {/* 🔴 VALIDACIÓN: Si está validando, mostrar spinner */}
      {isValidating && (
        <div style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⏳</div>
            <p style={{ fontSize: '14px', color: '#666' }}>Validando conversación...</p>
          </div>
        </div>
      )}

      {/* 🔴 VALIDACIÓN: Si conversación está expirada o error, mostrar mensaje claro */}
      {!isValidating && conversationStatus === 'expired' && (
        <div style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
          <div style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              {validationError === 'missing_params' ? '🔗' : validationError === 'network' ? '📡' : '❌'}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '8px' }}>
              {validationError === 'missing_params'
                ? 'Enlace incompleto'
                : validationError === 'network'
                  ? 'No se pudo conectar'
                  : 'Conversación No Disponible'}
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              {validationError === 'missing_params'
                ? 'Faltan parámetros en la URL (bot o conversación). Usa el enlace completo: escanea de nuevo el código QR desde el widget.'
                : validationError === 'network'
                  ? 'No se pudo conectar al API. Comprueba que el backend esté en marcha (puerto correcto, ej. 5006) y que CORS permita este origen. En consola (F12) verás la URL que se intentó.'
                  : 'Esta conversación ha expirado o no existe. Solicita un nuevo código QR para iniciar una nueva conversación.'}
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>Puedes cerrar esta ventana ahora.</p>
          </div>
        </div>
      )}

      {/* 🔴 VALIDACIÓN: Si error al unir móvil, mostrar error y bloquear UI */}
      {!isValidating && conversationStatus === 'valid' && mobileJoinError && (
        <div style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
          <div style={{ textAlign: 'center', padding: '40px', maxWidth: '400px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '8px' }}>
              Sesión móvil bloqueada
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              {mobileJoinError}
              <br /><br />No puedes interactuar con esta conversación desde el móvil.
            </p>
            <p style={{ fontSize: '12px', color: '#999' }}>Cierra esta ventana o escanea un nuevo código QR.</p>
          </div>
        </div>
      )}

      {/* 🔴 INACTIVIDAD: Si expiró, mostrar página expirada */}
      {!isValidating && conversationStatus === 'valid' && !mobileJoinError && showInactivityMessage === 'expired' && <ExpiredPage />}
      {/* 🔴 INACTIVIDAD: Si hay alerta, mostrar alerta (pero NOT expirada) */}
      {!isValidating && conversationStatus === 'valid' && !mobileJoinError && showInactivityMessage === true && <InactivityAlert />}
      {/* Chat widget normal si no hay expiración, conversación es válida y unión móvil exitosa */}
      {!isValidating && conversationStatus === 'valid' && !mobileJoinError && showInactivityMessage !== 'expired' && (
        <iframe
          src={`/widget-frame?${widgetParams.toString()}`}
          style={{ width: "100%", height: "100%", border: "none", borderRadius: 0 }}
          title="Mobile Chat Widget"
          allow="microphone; camera"
        />
      )}
      {/* CSS para animación de spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
