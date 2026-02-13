// Marcar contexto widget para que axiosConfig no ejecute refresh/logout/alert (evita OOM y "sesión expirada" en landing)
if (typeof window !== 'undefined') window.__VIA_WIDGET__ = true;

import React from 'react';
import ReactDOM from 'react-dom/client';
import WidgetFrame from '../layouts/widget/WidgetFrame';

// 🔹 Shim para process en el navegador
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  window.process = { 
    env: { NODE_ENV: 'production' },
    browser: true
  };
}

// 🔹 Auto-inicialización del widget cuando se carga el script
(function() {
  // Esperar a que el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  function initWidget() {
    try {
      // Buscar el script tag que cargó este widget
      const scripts = document.getElementsByTagName('script');
      const widgetScript = Array.from(scripts).find(s => s.src && s.src.includes('widget.js'));
      
      if (!widgetScript) {
        console.error('VIA Widget: No se encontró el script tag');
        return;
      }

      // Obtener parámetros del script
      const botId = widgetScript.getAttribute('data-bot-id') || widgetScript.getAttribute('data-bot');
      const userId = widgetScript.getAttribute('data-user-id');
      const clientSecret = widgetScript.getAttribute('data-client-secret');

      if (!botId) {
        console.error('VIA Widget: Falta el atributo data-bot-id');
        return;
      }

      // Crear contenedor para el widget
      const container = document.createElement('div');
      container.id = 'via-widget-root';
      // Contenedor transparente - el ChatWidget con previewMode maneja su propia posición
      container.style.cssText = `
        position: fixed;
        z-index: 999999;
        pointer-events: none;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      `;
      document.body.appendChild(container);

      // Pasar parámetros directamente como props al WidgetFrame
      const widgetProps = {
        botId: botId,
        userId: (userId && String(userId).trim()) ? userId : 'anon',
        clientSecret: clientSecret || '',
        isMobile: false
      };

      // Renderizar el widget sin tocar la URL de la página host
      const root = ReactDOM.createRoot(container);
      root.render(
        React.createElement(React.StrictMode, null,
          React.createElement(WidgetFrame, widgetProps)
        )
      );

    } catch (error) {
      console.error('❌ Error inicializando VIA Widget:', error);
    }
  }
})();
