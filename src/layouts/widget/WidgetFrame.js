import React, { useEffect, useState } from "react";
import ChatWidget from "layouts/bot/style/components/ChatWidget";
import { getBotDataWithToken } from "services/botService";
import widgetAuthService from "services/widgetAuthService";

function WidgetFrame() {
  const searchParams = new URLSearchParams(window.location.search);
  const botId = parseInt(searchParams.get("bot"), 10);
  const tokenParam = searchParams.get("token");
  const userId = parseInt(searchParams.get("user"), 10) || null; // Para widgets, userId puede ser null

  const [styleConfig, setStyleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [realToken, setRealToken] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

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
      
      setStyleConfig(botConfig);
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
      // Cleanup al desmontar
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    if (!botId || isNaN(botId) || botId <= 0) {
      setError("No se proporcionó un botId válido en la URL (?bot=ID). Ejemplo: ?bot=2");
      setLoading(false);
      return;
    }

    // Cargar configuración inicial
    loadBotConfiguration();

    // � Auto-refresh para recargar estilos cada 30 segundos (opcional)
    const refreshInterval = setInterval(() => {
      if (autoRefresh) {
        console.log("🔄 Auto-refresh: Recargando configuración del bot...");
        loadBotConfiguration();
      }
    }, 30000); // 30 segundos

    // Cleanup
    return () => {
      clearInterval(refreshInterval);
    };
  }, [botId, tokenParam, autoRefresh]);

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

  // Preparar estilos para pasar al ChatWidget
  const styleToPass = styleConfig?.styles || styleConfig?.style || {};
  
  // Mapear nombres de propiedades del backend al frontend
  if (styleConfig?.styles) {
    const styles = styleConfig.styles;
    Object.assign(styleToPass, {
      title: styles.title || styles.Title || "Asistente Virtual",
      theme: styles.theme || styles.Theme || "light",
      primaryColor: styles.launcherBackground || styles.LauncherBackground || "#000000",
      secondaryColor: styles.userMessageBackground || styles.UserMessageBackground || "#ffffff",
      headerBackgroundColor: styles.headerBackgroundColor || styles.HeaderBackgroundColor || styles.headerBackground || styles.HeaderBackground || "#000000",
      fontFamily: styles.fontFamily || styles.FontFamily || "Arial",
      avatarUrl: styles.avatarUrl || styles.AvatarUrl || "",
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
      botId={botId}
      userId={userId}
      style={styleToPass}
      isDemo={false} // Siempre false para widgets - no usar modo demo
      isWidget={true}
      widgetToken={realToken || tokenParam}
    />
  );
}

export default WidgetFrame;