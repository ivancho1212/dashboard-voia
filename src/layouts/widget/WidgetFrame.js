// Mover estos useEffect dentro del componente WidgetFrame
import React, { useEffect, useState, useMemo } from "react";
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
  // Debug hooks (deben estar dentro del componente)
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
  if (!window.widgetFrameRenderCount) window.widgetFrameRenderCount = 0;
  window.widgetFrameRenderCount++;
  console.log(`[RENDER] WidgetFrame renderizado #${window.widgetFrameRenderCount} en`, new Date().toISOString());
  const searchParams = new URLSearchParams(window.location.search);
  const botId = parseInt(searchParams.get("bot"), 10);
  const tokenParam = searchParams.get("token");
  const userId = parseInt(searchParams.get("user"), 10) || null; // Para widgets, userId puede ser null

  // HOOKS SIEMPRE AL INICIO
  const [styleConfig, setStyleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realToken, setRealToken] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false); // Desactivar auto-refresh por defecto
  // Estado de visibilidad del chat
  const [isOpen, setIsOpen] = useState(false);

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
        tokenParam: tokenParam?.substring(0, 20) + '...' 
      });
      
      let finalToken = tokenParam;
      
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
      
      // Intentar obtener configuración
      try {
        botConfig = await getBotDataWithToken(botId, finalToken);
        console.log("✅ Configuración obtenida:", botConfig);
      } catch (configError) {
        console.warn("⚠️ Error obteniendo configuración:", configError);
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
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
      }
      
      /* Root div transparente sin centrado forzado */
      #root {
        background: transparent !important;
        width: 100vw !important;
        height: 100vh !important;
        position: relative !important;
      }
      
      /* NO aplicar estilos de centrado - dejar que ChatWidget maneje su propia posición */
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
    tokenParam: tokenParam?.substring(0, 20) + '...', 
    realToken: realToken?.substring(0, 20) + '...',
    finalTokenToUse: (realToken || tokenParam)?.substring(0, 20) + '...',
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
        height: '100vh',
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

  return (
    <ChatWidget
      key={"main-widget"}
      botId={botId}
      userId={userId}
      style={styleToPass}
      isDemo={false} // Siempre false para widgets - no usar modo demo
      isWidget={true}
      widgetToken={realToken || tokenParam}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    />
  );
}

export default WidgetFrame;