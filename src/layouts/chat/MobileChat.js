import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import WidgetFrame from "layouts/widget/WidgetFrame";
import "layouts/widget/WidgetStyles.css";
import { getCsrfToken, getCsrfHeaderName } from "services/csrfService";

const API_URL = "http://localhost:5006/api";

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
  
  // 🔴 INACTIVIDAD: Referencias para timers
  const inactivityTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const inactivityWarningShownRef = useRef(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false); // false | true (alerta) | 'expired' (expirada)
  
  // 🆕 VALIDACIÓN: Estado para conversación expirada al cargar y error de unión móvil
  const [conversationStatus, setConversationStatus] = useState(null); // null | 'valid' | 'expired'
  const [isValidating, setIsValidating] = useState(true);
  const [mobileJoinError, setMobileJoinError] = useState(null); // null | string (mensaje de error)
  
  // 🔴 INACTIVIDAD: Constante 3 minutos
  const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutos

  const botId = searchParams.get("bot");
  const conversationId = searchParams.get("conversation");
  const token = searchParams.get("token");

  // 🆕 VALIDACIÓN: Verificar si conversación existe y no está expirada
  useEffect(() => {
    const validateConversation = async () => {
      // Si NO hay conversationId en la URL, permitir crear nueva
      if (!conversationId) {
        setConversationStatus('valid');
        setIsValidating(false);
        return;
      }

      // Si hay conversationId, validar que no esté expirada
      try {
        const response = await fetch(`${API_URL}/Conversations/history/${conversationId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          setConversationStatus('valid');
        } else if (response.status === 410) {
          // 410 Gone = Conversación expirada
          setConversationStatus('expired');
        } else if (response.status === 404) {
          // 404 = Conversación no existe
          setConversationStatus('expired');
        } else {
          setConversationStatus('expired');
        }
      } catch (error) {
        console.error('❌ [MobileChat] Error validando conversación:', error);
        setConversationStatus('expired');
      } finally {
        setIsValidating(false);
      }
    };

    validateConversation();
  }, [conversationId]);

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

    // 🔴 INACTIVIDAD: Iniciar timer de 3 minutos
    inactivityTimerRef.current = setTimeout(() => {
      console.log('⏱️  [MobileChat] 3 minutos sin interacción - mostrando alerta');
      setShowInactivityMessage(true);
      inactivityWarningShownRef.current = true;

      // Después de 30 segundos más, mostrar página expirada
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
      }, 30 * 1000); // 30 segundos
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


  useEffect(() => {
    // Validar parámetros mínimos
    if (!botId) {
      navigate("/", { replace: true });
    }
  }, [botId, navigate]);

  // 🔴 INACTIVIDAD: Función para notificar al backend que móvil se fue
  const notifyMobileLeft = React.useCallback(async () => {
    if (!conversationId) return;
    try {
      await fetch(
        `${API_URL}/Conversations/${conversationId}/leave-mobile`,
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
          `${API_URL}/Conversations/${conversationId}/join-mobile`,
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
            const statusResp = await fetch(`${API_URL}/Conversations/${conversationId}/status`, {
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
        `${API_URL}/Conversations/${conversationId}/leave-mobile`,
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
    ...(token && { token }),
    isMobile: "true", // Parámetro especial para indicar modo móvil
  });

  // 🔴 INACTIVIDAD: Componente de alerta visual
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
      animation: 'fadeIn 0.3s ease-in'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '90%',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏱️</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
          Conversación por expirar
        </div>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          Por inactividad, la conversación se cerrará en 30 segundos
        </div>
        <div style={{ fontSize: '12px', color: '#999' }}>
          Interactúa con el chat para continuar
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
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

      {/* 🔴 VALIDACIÓN: Si conversación está expirada, mostrar error */}
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
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f', marginBottom: '8px' }}>
              Conversación No Disponible
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              Esta conversación ha expirado o no existe.<br /><br />Por favor, solicita un nuevo código QR para iniciar una nueva conversación.
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
