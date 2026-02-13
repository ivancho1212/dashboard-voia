// Mover estos useEffect dentro del componente WidgetFrame
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import PropTypes from 'prop-types';
import ChatWidget from "layouts/bot/style/components/ChatWidget";
import { getBotDataWithToken } from "services/botService";
import widgetAuthService from "services/widgetAuthService";
import { getApiBaseUrl } from "config/environment";
import { generateWidgetJwtAsync } from "services/widgetJwtService"; // ✅ NUEVO: JWT generator
import axios from "axios"; // ✅ Para usar axios en WidgetFrame

// Función robusta para detectar si es emoji
function isEmoji(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  if (trimmed.includes('/') || trimmed.includes('.') || trimmed.includes('http') || trimmed.includes('data:')) {
    return false;
  }
  if (trimmed.length > 8) return false;
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/u;
  return emojiRegex.test(trimmed);
}

const CONFIG_LOAD_TIMEOUT_MS = 12000;

function WidgetFrame(props) {
  const {
    botId: propBotId = null,
    userId: propUserId = null,
    isMobile: propIsMobile = false,
    clientSecret: propClientSecret = null
  } = props;

  // ✅ Si no hay props, leer de query params (cuando se carga como iframe desde /widget-frame)
  const queryParams = new URLSearchParams(window.location.search);
  
  // ✅ Obtener parámetros desde props (pasados por widget/index.js) O desde URL
  const botId = propBotId 
    ? parseInt(propBotId, 10) 
    : queryParams.get('bot') 
      ? parseInt(queryParams.get('bot'), 10) 
      : null;

  // Forzar userId como string, usar 'anon' si está vacío/null
  let userIdRaw = propUserId != null && propUserId !== '' ? propUserId : (queryParams.get('userId') || queryParams.get('user'));
  const userId = userIdRaw !== undefined && userIdRaw !== null && userIdRaw !== '' ? String(userIdRaw) : 'anon';
      
  const isMobileView = propIsMobile === true || queryParams.get('isMobile') === 'true';
  
  const urlSecret = propClientSecret || queryParams.get('secret') || null;
  
  // Parámetros adicionales para móvil
  // ✅ Mantener como string para evitar warnings de PropTypes
  const conversationId = queryParams.get('conversation') || null;
    
  const tokenParam = queryParams.get('token') || null;

  // HOOKS SIEMPRE AL INICIO
  const [styleConfig, setStyleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realToken, setRealToken] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false); // Desactivar auto-refresh por defecto
  // Estado de visibilidad del chat - EN MÓVIL, ABRIR POR DEFECTO; EN WEB, CERRADO
  const [isOpen, setIsOpen] = useState(false); // Siempre empezar cerrado, luego isMobileView lo abre si es necesario
  // Ref used to measure the preferred size of the widget content
  const rootRef = useRef(null);
  const [containerSize, setContainerSize] = useState(null);
  // ✅ NUEVO: clientSecret como STATE para que React lo rastree
  const [clientSecret, setClientSecret] = useState(urlSecret);
  // Cancelación de carga anterior (Strict Mode / re-runs)
  const loadCancelRef = useRef(0);

  // ✅ NUEVO: Effect para obtener JWT válido del backend cuando no hay secret en URL
  React.useEffect(() => {
    if (!clientSecret && botId) {
      // Primero intentar obtener token del backend
      const apiBaseUrl = getApiBaseUrl();
      
      const generateBackendToken = async () => {
        try {
          const response = await axios.post(
            `${apiBaseUrl}/BotIntegrations/generate-widget-token`,
            { botId: botId },
            { timeout: 5000, withCredentials: true }
          );
          
          setClientSecret(response.data.token);
        } catch (backendError) {
          console.error('❌ [WidgetFrame] Error obteniendo token del backend:', backendError);
          // Fallback: generar JWT en frontend
          try {
            const jwt = await generateWidgetJwtAsync(botId, "localhost");
            setClientSecret(jwt);
          } catch (jwtError) {
            console.error('❌ [WidgetFrame] Error generando JWT local:', jwtError);
            setClientSecret(`test-secret-bot-${botId}`);
          }
        }
      };
      
      generateBackendToken();
    }
  }, [botId, clientSecret]); // Ejecutar cuando botId cambie o clientSecret sea null

  // useMemo para estilos, antes de cualquier return
  const styleToPass = useMemo(() => {
    const base = styleConfig?.styles || styleConfig?.style || {};
    const result = { ...base };
    if (styleConfig?.styles) {
      const styles = styleConfig.styles;
      let avatarUrl = styles.avatarUrl || styles.AvatarUrl || "";
      if (!isEmoji(avatarUrl)) {
        if (
          avatarUrl &&
          typeof avatarUrl === "string" &&
          !avatarUrl.startsWith("http") &&
          !avatarUrl.startsWith("data:") &&
          !avatarUrl.startsWith("/")
        ) {
          avatarUrl = `/${avatarUrl}`;
        }
        if (
          avatarUrl &&
          typeof avatarUrl === "string" &&
          avatarUrl.startsWith("/") &&
          !avatarUrl.startsWith("/VIA.png") &&
          !avatarUrl.startsWith("/static") &&
          !avatarUrl.startsWith("data:")
        ) {
          avatarUrl = getApiBaseUrl().replace(/\/api$/, "") + avatarUrl;
        }
      }
      Object.assign(result, {
        title: styles.title || styles.Title || "Asistente Virtual",
        theme: styles.theme || styles.Theme || "light",
        primaryColor: styles.launcherBackground || styles.LauncherBackground || "#000000",
        secondaryColor: styles.userMessageBackground || styles.UserMessageBackground || "#ffffff",
        headerBackgroundColor: styles.headerBackgroundColor || styles.HeaderBackgroundColor || styles.headerBackground || styles.HeaderBackground || "#000000",
        fontFamily: styles.fontFamily || styles.FontFamily || "Arial",
        avatarUrl,
        position: styles.position || styles.Position || "bottom-right",
        allowImageUpload: styles.allowImageUpload ?? styles.AllowImageUpload ?? true,
        allowFileUpload: styles.allowFileUpload ?? styles.AllowFileUpload ?? true,
        customCss: styles.customCss || styles.CustomCss || ""
      });
    }
    result.primaryColor = result.primaryColor || "#000000";
    result.secondaryColor = result.secondaryColor || "#ffffff";
    result.headerBackgroundColor = result.headerBackgroundColor || result.primaryColor || "#000000";
    if (!result.title) {
      result.title = styleConfig?.name || styleConfig?.settings?.styles?.name || "Asistente Virtual";
    }
    return result;
  }, [styleConfig]);

  // Función para cargar configuración del bot (siempre termina con setLoading(false))
  const loadBotConfiguration = useCallback(async () => {
    const runId = ++loadCancelRef.current;
    const isCancelled = () => runId !== loadCancelRef.current;

    const safeSetLoading = (v) => {
      if (!isCancelled()) setLoading(v);
    };
    const safeSetStyleConfig = (c) => {
      if (!isCancelled()) setStyleConfig(c);
    };
    const safeSetError = (e) => {
      if (!isCancelled()) setError(e);
    };

    try {
      // Fallback: try to find a token in localStorage (e.g., when embedding from dashboard)
      let finalToken = tokenParam;
      if ((!finalToken || finalToken === 'undefined') && typeof window !== 'undefined') {
        const stored = localStorage.getItem('widgetToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
        if (stored && stored !== 'undefined') {
          finalToken = stored;
          // Set early so child can consume it when mounting
          setRealToken(stored);
        }
      }
      
      // Si el token es "auto", generar un JWT real
      if (tokenParam === "auto") {
        try {
          finalToken = await widgetAuthService.getWidgetToken(botId);
          setRealToken(finalToken);
        } catch (jwtError) {
          finalToken = null;
        }
      }
      
      let botConfig = null;
      
      // ✅ OPTIMIZACIÓN: No intentar con token si ya sabemos que fue rechazado (401)
      const wasRejected = finalToken && widgetAuthService.wasTokenRejected(finalToken);
      const isExpired = finalToken && !widgetAuthService.isTokenNotExpired(finalToken);
      
      if (isExpired && finalToken) {
        if (localStorage.getItem('widgetToken') === finalToken) localStorage.removeItem('widgetToken');
        if (localStorage.getItem('jwt') === finalToken) localStorage.removeItem('jwt');
        if (localStorage.getItem('token') === finalToken) localStorage.removeItem('token');
        finalToken = null;
      }
      
      // Intentar obtener configuración vía endpoint widget-settings SOLO si:
      // 1. Token existe
      // 2. Token NO fue rechazado previamente (401)
      // 3. Token NO está expirado
      if (finalToken && !wasRejected && !isExpired) {
        try {
          botConfig = await getBotDataWithToken(botId, finalToken);
        } catch (configError) {
          const status = configError?.response?.status;
          if (status === 401) {
            // Token fue rechazado, marcarlo para no intentar de nuevo
            widgetAuthService.markTokenAsInvalid(finalToken);
          }
          botConfig = null; // Forzar fallback
        }
      } else if (finalToken && (wasRejected || isExpired)) {
        const reason = wasRejected ? "rechazado por servidor" : "expirado";
      }
      
      // Fallback a widgetAuthService si la petición falló o no hubo token válido
      if (!botConfig) {
        try {
          // ✅ Si no hay token, generar uno ANTES de llamar a getWidgetSettings
          if (!finalToken) {
            try {
              const generated = await widgetAuthService.getWidgetToken(botId);
              if (generated) {
                setRealToken(generated);
                finalToken = generated;
                try { localStorage.setItem('widgetToken', generated); } catch(e) {}
              }
            } catch (genErr) {
              console.error('❌ [WidgetFrame] Error generando token para fallback:', genErr.message);
            }
          }

          // Ahora sí, cargar configuración con token
          if (finalToken) {
            const fallback = await widgetAuthService.getWidgetSettings(botId, finalToken);
            botConfig = fallback?.settings || fallback;

            // Si el fallback devolvió un token válido, úsalo
            if (fallback && fallback.isValid && fallback.token) {
              setRealToken(fallback.token);
              finalToken = fallback.token;
              try { localStorage.setItem('widgetToken', fallback.token); } catch(e) {}
            }
          }
        } catch (err2) {
          console.error('❌ [WidgetFrame] Error en fallback de configuración:', err2.message);
        }
      }
      
      // Si aún no hay configuración, usar fallback
      if (!botConfig) {
        botConfig = {
          styles: {
            Title: "Asistente Virtual",
            LauncherBackground: "#a39700",
            HeaderBackground: "#a39700",
            HeaderBackgroundColor: "#a39700",
            HeaderText: "#FFFFFF",
            UserMessageBackground: "#ffffff",
            UserMessageText: "#000000",
            ResponseMessageBackground: "#f4f7f9",
            ResponseMessageText: "#000000",
            Position: "bottom-right",
            Theme: "custom",
            FontFamily: "Arial",
            AllowImageUpload: true,
            AllowFileUpload: true
          },
          welcomeMessage: "¡Hola! ¿En qué puedo ayudarte?"
        };
      }
      
      safeSetStyleConfig({
        ...botConfig,
        botId,
        tokenParam
      });
      safeSetLoading(false);

      // Notificar al padre que el widget está listo
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'widget-ready',
          botId: botId,
          config: botConfig
        }, '*');
      }
    } catch (error) {
      if (!isCancelled()) {
        console.error('[WidgetFrame] Error en loadBotConfiguration:', error?.message || error);
        safeSetError(`Error de configuración: ${error?.message || String(error)}`);
      }
    } finally {
      safeSetLoading(false);
    }
  }, [botId, tokenParam]);

  // El ChatWidget con previewMode={true} maneja su propia posición fixed
  // No necesitamos aplicar estilos al contenedor #via-widget-root

  // PostMessage listener -> wait for parent to inform applied size
  useEffect(() => {
    const parentOrigin = (function () {
      try {
        return new URL(document.referrer).origin;
      } catch (e) {
        return null;
      }
    })();

    function onMessage(event) {
      try {
        if (!event.data || typeof event.data !== 'object') return;
        // If we have a referrer-derived parentOrigin, enforce it
        if (parentOrigin && event.origin !== parentOrigin) return;

        const data = event.data;
        if (data.type === 'parent-applied-size' && data.width && data.height) {
          // Apply container size and inform parent
          setContainerSize({ width: Number(data.width), height: Number(data.height) });

          // Acknowledge back to parent
          window.parent.postMessage({ type: 'child-ack' }, event.origin || '*');
        }
      } catch (e) {
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    if (!botId || isNaN(botId) || botId <= 0) {
      setError("No se proporcionó un botId válido en la URL (?bot=ID). Ejemplo: ?bot=2");
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeoutMs = CONFIG_LOAD_TIMEOUT_MS;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Config load timeout')), timeoutMs);
    });
    Promise.race([loadBotConfiguration(), timeoutPromise]).catch((err) => {
      if (err?.message === 'Config load timeout') {
        loadCancelRef.current++;
        setStyleConfig({
          styles: {
            Title: "Asistente Virtual",
            LauncherBackground: "#a39700",
            HeaderBackgroundColor: "#a39700",
            Position: "bottom-right",
            AllowImageUpload: true,
            AllowFileUpload: true
          },
          botId,
          tokenParam
        });
      }
    }).finally(() => {
      setLoading(false);
    });
  }, [botId, tokenParam, loadBotConfiguration]);

  // Medir y enviar preferred-size al padre (iframe) cuando cambie layout (abrir/cerrar chat)
  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      try {
        const el = rootRef.current || document.getElementById('root');
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const preferredWidth = Math.ceil(rect.width) || 300;
        let preferredHeight = Math.ceil(rect.height) || 200;
        const MAX_WIDGET_HEIGHT = 700;
        if (preferredHeight > MAX_WIDGET_HEIGHT) preferredHeight = MAX_WIDGET_HEIGHT;
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'preferred-size', width: preferredWidth, height: preferredHeight }, '*');
        }
      } catch (e) {}
    }, 80);
    return () => clearTimeout(t);
  }, [loading, styleConfig, isOpen]); // isOpen: reenviar al abrir/cerrar

    // Eliminar auto-refresh para evitar remounts
    // const refreshInterval = setInterval(() => {
    //   if (autoRefresh) {
    //     console.log("🔄 Auto-refresh: Recargando configuración del bot...");
    //     loadBotConfiguration();
    //   }
    // }, 30000); // 30 segundos

    // Cleanup
    // return () => {
    //   clearInterval(refreshInterval);
    // };

  if (loading) {
    // During load we render a compact spinner positioned where the closed launcher will appear.
    // Use fixed positioning so it's always visible regardless of parent container.
    return (
      <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 999999, pointerEvents: 'auto' }}>
        <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', borderRadius: '50%' }}>
          <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        color: 'red', 
        padding: 32, 
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        background: '#fff',
        borderRadius: '8px',
        margin: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Error de Widget</div>
        <div style={{ fontSize: '14px' }}>{error}</div>
      </div>
    );
  }

  // ...existing code...

  // Mapear nombres de propiedades del backend al frontend
  if (styleConfig?.styles) {
    const styles = styleConfig.styles;
    let avatarUrl = styles.avatarUrl || styles.AvatarUrl || "";
    // Si es emoji, no modificar la URL
    if (!isEmoji(avatarUrl)) {
      // Si la URL es relativa y no es base64, prepende el dominio del backend
      if (
        avatarUrl &&
        typeof avatarUrl === "string" &&
        !avatarUrl.startsWith("http") &&
        !avatarUrl.startsWith("data:") &&
        !avatarUrl.startsWith("/")
      ) {
        avatarUrl = `/${avatarUrl}`;
      }
      if (
        avatarUrl &&
        typeof avatarUrl === "string" &&
        avatarUrl.startsWith("/") &&
        !avatarUrl.startsWith("/VIA.png") &&
        !avatarUrl.startsWith("/static") &&
        !avatarUrl.startsWith("data:")
      ) {
        // Si es una ruta relativa, prepende el dominio del backend
        avatarUrl = getApiBaseUrl().replace(/\/api$/, "") + avatarUrl;
      }
    }
    Object.assign(styleToPass, {
      title: styles.title || styles.Title || "Asistente Virtual",
      theme: styles.theme || styles.Theme || "light",
      primaryColor: styles.launcherBackground || styles.LauncherBackground || "#000000",
      secondaryColor: styles.userMessageBackground || styles.UserMessageBackground || "#ffffff",
      headerBackgroundColor: styles.headerBackgroundColor || styles.HeaderBackgroundColor || styles.headerBackground || styles.HeaderBackground || "#000000",
      fontFamily: styles.fontFamily || styles.FontFamily || "Arial",
      avatarUrl,
      position: styles.position || styles.Position || "bottom-right",
      width: styles.width ?? styles.Width ?? 380,
      height: styles.height ?? styles.Height ?? 600,
      allowImageUpload: styles.allowImageUpload ?? styles.AllowImageUpload ?? true,
      allowFileUpload: styles.allowFileUpload ?? styles.AllowFileUpload ?? true,
      customCss: styles.customCss || styles.CustomCss || ""
    });
  }

  // Asegurar valores por defecto para prevenir errores
  styleToPass.primaryColor = styleToPass.primaryColor || "#000000";
  styleToPass.secondaryColor = styleToPass.secondaryColor || "#ffffff";
  styleToPass.headerBackgroundColor = styleToPass.headerBackgroundColor || styleToPass.primaryColor || "#000000";

  // Asegurar que tenga título
  if (!styleToPass.title) {
    styleToPass.title = styleConfig?.name || styleConfig?.settings?.styles?.name || "Asistente Virtual";
  }

    // Normalize token: prefer realToken (from generation/localStorage), but ensure we never pass 'undefined' string
    const widgetTokenToPass = (realToken && String(realToken) !== 'undefined') ? realToken : (tokenParam && String(tokenParam) !== 'undefined' ? tokenParam : null);

    return (
      <ChatWidget
        key={"main-widget"}
        botId={botId}
        userId={userId}
        widgetClientSecret={clientSecret}  // ✅ NUEVO
        style={styleToPass}
        isDemo={false} // Siempre false para widgets - no usar modo demo
        isWidget={true}
        previewMode={true} // ✅ Usar estilos de preview para posición fixed y tamaño correcto
        widgetToken={widgetTokenToPass}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        // Pass ref and container size so child can be measured and adapt to parent-applied-size
        rootRef={rootRef}
        containerSize={containerSize}
        // Parámetros para modo móvil
        isMobileView={isMobileView}
        conversationId={conversationId}
      />
    );
}

WidgetFrame.propTypes = {
  botId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isMobile: PropTypes.bool,
  clientSecret: PropTypes.string,
};

export default WidgetFrame;