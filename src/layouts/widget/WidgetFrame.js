// Mover estos useEffect dentro del componente WidgetFrame
import React, { useEffect, useState, useMemo, useRef } from "react";
import ChatWidget from "layouts/bot/style/components/ChatWidget";
import { getBotDataWithToken } from "services/botService";
import widgetAuthService from "services/widgetAuthService";
import { getApiBaseUrl } from "config/environment";

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

function WidgetFrame() {
  // Debug hooks will be declared after state hooks to avoid TDZ
  if (!window.widgetFrameRenderCount) window.widgetFrameRenderCount = 0;
  window.widgetFrameRenderCount++;
  console.log(`[RENDER] WidgetFrame renderizado #${window.widgetFrameRenderCount} en`, new Date().toISOString());
  const searchParams = new URLSearchParams(window.location.search);
  const botId = parseInt(searchParams.get("bot"), 10);
  let tokenParam = searchParams.get("token");
  const userId = parseInt(searchParams.get("user"), 10) || null; // Para widgets, userId puede ser null

  // HOOKS SIEMPRE AL INICIO
  const [styleConfig, setStyleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realToken, setRealToken] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false); // Desactivar auto-refresh por defecto
  // Estado de visibilidad del chat
  const [isOpen, setIsOpen] = useState(false);
  // Ref used to measure the preferred size of the widget content
  const rootRef = useRef(null);
  const [containerSize, setContainerSize] = useState(null);

  // Debug hooks (deben estar dentro del componente y después de las declaraciones de estado)
  React.useEffect(() => {
    console.log('[DEBUG WidgetFrame] Cambio en styleConfig:', styleConfig);
  }, [styleConfig]);
  React.useEffect(() => {
    console.log('[DEBUG WidgetFrame] Cambio en isOpen:', isOpen);
  }, [isOpen]);
  React.useEffect(() => {
    console.log('[DEBUG WidgetFrame] Cambio en loading:', loading);
  }, [loading]);
  React.useEffect(() => {
    console.log('[DEBUG WidgetFrame] Cambio en error:', error);
  }, [error]);
  React.useEffect(() => {
    console.log('[DEBUG WidgetFrame] Cambio en realToken:', realToken);
  }, [realToken]);
  React.useEffect(() => {
    console.log('[DEBUG WidgetFrame] Cambio en autoRefresh:', autoRefresh);
  }, [autoRefresh]);

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

  // Función para cargar configuración del bot
  const loadBotConfiguration = async () => {
    try {
      console.log("🔧 WidgetFrame - Cargando configuración del bot...", { 
        botId, 
        tokenParam: tokenParam ? (String(tokenParam).substring(0, 20) + '...') : null
      });
      
      // Fallback: try to find a token in localStorage (e.g., when embedding from dashboard)
      let finalToken = tokenParam;
      if ((!finalToken || finalToken === 'undefined') && typeof window !== 'undefined') {
        const stored = localStorage.getItem('widgetToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
        if (stored && stored !== 'undefined') {
          finalToken = stored;
          console.log('🔁 Usando token desde localStorage como fallback.');
          // Set early so child can consume it when mounting
          setRealToken(stored);
        }
      }
      
      // Si el token es "auto", generar un JWT real
      if (tokenParam === "auto") {
        console.log("🔄 Token es 'auto', generando JWT real...");
        try {
          finalToken = await widgetAuthService.getWidgetToken(botId);
          console.log("✅ JWT real generado:", finalToken?.substring(0, 20) + '...');
          setRealToken(finalToken);
        } catch (jwtError) {
          console.error("❌ Error generando JWT:", jwtError);
          finalToken = null;
        }
      }
      
      let botConfig = null;
      
      // Intentar obtener configuración vía endpoint widget-settings (si se pasó token)
      try {
        botConfig = await getBotDataWithToken(botId, finalToken);
        console.log("✅ Configuración obtenida:", botConfig);
      } catch (configError) {
        console.warn("⚠️ Error obteniendo configuración vía widget-settings (se intentó con token):", configError?.response?.status || configError.message || configError);
        // Si el token dio 401, limpiarlo para no reutilizarlo
        const status = configError?.response?.status;
        if (status === 401 && finalToken) {
          try {
            // Limpiar token guardado para evitar negociaciones con token inválido
            if (localStorage.getItem('widgetToken') === finalToken) localStorage.removeItem('widgetToken');
            if (localStorage.getItem('jwt') === finalToken) localStorage.removeItem('jwt');
            if (localStorage.getItem('token') === finalToken) localStorage.removeItem('token');
          } catch (e) {
            // ignore
          }
        }

        // Intentar cargar configuración directamente desde widgetAuthService cuando no hay token válido
        try {
          const fallback = await widgetAuthService.getWidgetSettings(botId, finalToken);
          console.log("ℹ️ Configuración obtenida vía widgetAuthService fallback:", fallback);
          botConfig = fallback?.settings || fallback;

          // Si el fallback devolvió un token válido, úsalo
          if (fallback && fallback.isValid && fallback.token) {
            setRealToken(fallback.token);
            finalToken = fallback.token;
            try { localStorage.setItem('widgetToken', fallback.token); } catch(e) {}
          } else {
            // Si no se devolvió token, solicitar uno nuevo al endpoint de generación
            try {
              const generated = await widgetAuthService.getWidgetToken(botId);
              if (generated) {
                console.log("🔑 Token generado por fallback:", generated?.substring(0,20) + '...');
                setRealToken(generated);
                finalToken = generated;
                try { localStorage.setItem('widgetToken', generated); } catch(e) {}
              }
            } catch (genErr) {
              console.warn("⚠️ No se pudo generar token de widget tras fallback:", genErr);
            }
          }
        } catch (err2) {
          console.warn("⚠️ Error fallback widgetAuthService:", err2);
        }
      }
      
      // Si aún no hay configuración, usar fallback
      if (!botConfig) {
        console.log("🔄 Usando configuración por defecto como fallback...");
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
      
      setStyleConfig({
        ...botConfig,
        botId,
        tokenParam
      });
      setLoading(false);
      
      // Notificar al padre que el widget está listo
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'widget-ready',
          botId: botId,
          config: botConfig
        }, '*');
      }
      
    } catch (error) {
      console.error("❌ Error general al cargar configuración del bot:", error);
      setError(`Error de configuración: ${error.message}`);
      setLoading(false);
    }
  };

  // Aplicar estilos globales para hacer transparente SOLO el contenedor iframe, no el widget
  useEffect(() => {
    console.log('[DEBUG] WidgetFrame montado', {
      botId,
      tokenParam,
      userId,
      styleConfig,
      loading,
      error,
      realToken,
      autoRefresh,
      location: window.location.href
    });
    // Crear y agregar estilos CSS para hacer transparente solo el contenedor
    const style = document.createElement('style');
    style.textContent = `
      /* Solo hacer transparente el contenedor iframe, NO el ChatWidget */
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        /* Do not force overflow hidden; let widget decide behavior inside iframe */
        overflow: visible !important;
        background: transparent !important;
        height: 100% !important;
      }
      /* Root should fill the iframe viewport in percent units (no vw/vh here) */
      #root {
        background: transparent !important;
        width: 100% !important;
        height: 100% !important;
        position: relative !important;
        box-sizing: border-box !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      console.log('[DEBUG] WidgetFrame desmontado', {
        botId,
        tokenParam,
        userId,
        styleConfig,
        loading,
        error,
        realToken,
        autoRefresh,
        location: window.location.href
      });
      // Cleanup al desmontar
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // PostMessage listener -> wait for parent to inform applied size
  useEffect(() => {
    const parentOrigin = (function () {
      try {
        return new URL(document.referrer).origin;
      } catch (e) {
        console.warn('[child] document.referrer is empty or invalid; parent origin unknown');
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
          console.log('[child] received parent-applied-size', data);
          // Apply container size and inform parent
          setContainerSize({ width: Number(data.width), height: Number(data.height) });

          // Acknowledge back to parent
          window.parent.postMessage({ type: 'child-ack' }, event.origin || '*');
        }
      } catch (e) {
        console.error('[child] onMessage error', e);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  useEffect(() => {
    console.log('[DEBUG] useEffect de configuración disparado', {
      botId,
      tokenParam,
      styleConfig,
      styleConfigBotId: styleConfig?.botId,
      styleConfigTokenParam: styleConfig?.tokenParam
    });
    if (!botId || isNaN(botId) || botId <= 0) {
      setError("No se proporcionó un botId válido en la URL (?bot=ID). Ejemplo: ?bot=2");
      setLoading(false);
      return;
    }

    // Solo recargar si botId o tokenParam cambian realmente (no por cambios en styleConfig)
    setLoading(true);
    loadBotConfiguration();
  }, [botId, tokenParam]);

  // After bot configuration is ready, measure preferred size and notify parent
  useEffect(() => {
    if (loading) return;
    // Wait a tick so layout stabilizes
    const t = setTimeout(() => {
      try {
        const el = rootRef.current || document.getElementById('root');
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const preferredWidth = Math.ceil(rect.width) || 300;
        const preferredHeight = Math.ceil(rect.height) || 200;
        console.log('[child] measured preferredSize', { preferredWidth, preferredHeight });
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'preferred-size', width: preferredWidth, height: preferredHeight }, '*');
          console.log('[child] sent preferred-size to parent');
        }
      } catch (e) {
        console.error('[child] error measuring preferred size', e);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [loading, styleConfig]);

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

  console.log('🔧 WidgetFrame Debug:', { 
    botId, 
    tokenParam: tokenParam ? (String(tokenParam).substring(0, 20) + '...') : null, 
    realToken: realToken ? (String(realToken).substring(0, 20) + '...') : null,
    finalTokenToUse: (realToken || tokenParam) ? (String(realToken || tokenParam).substring(0, 20) + '...') : null,
    userId, 
    loading, 
    error, 
    styleConfig 
  });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
  alignItems: 'center', 
  height: '100%',
        fontFamily: 'Arial, sans-serif',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🤖</div>
          <div>Cargando widget...</div>
        </div>
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
      allowImageUpload: styles.allowImageUpload ?? styles.AllowImageUpload ?? true,
      allowFileUpload: styles.allowFileUpload ?? styles.AllowFileUpload ?? true,
      customCss: styles.customCss || styles.CustomCss || ""
    });
  }

  // Asegurar valores por defecto para prevenir errores
  styleToPass.primaryColor = styleToPass.primaryColor || "#000000";
  styleToPass.secondaryColor = styleToPass.secondaryColor || "#ffffff";
  styleToPass.headerBackgroundColor = styleToPass.headerBackgroundColor || styleToPass.primaryColor || "#000000";

  // Debug para ver qué configuración se está pasando
  console.log("🔧 WidgetFrame - Estilos que se pasan al ChatWidget:", {
    originalStyleConfig: styleConfig,
    finalStyleToPass: styleToPass,
    botId,
    hasValidToken: !!(realToken || tokenParam)
  });

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
      style={styleToPass}
      isDemo={false} // Siempre false para widgets - no usar modo demo
      isWidget={true}
      widgetToken={widgetTokenToPass}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      // Pass ref and container size so child can be measured and adapt to parent-applied-size
      rootRef={rootRef}
      containerSize={containerSize}
    />
  );
}

export default WidgetFrame;