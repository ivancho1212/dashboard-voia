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
      // Estilos base para posicionamiento flotante (las coordenadas exactas se configuran desde el dashboard)
      container.style.cssText = `
        position: fixed;
        z-index: 999999;
        pointer-events: auto;
      `;
      document.body.appendChild(container);

      // Pasar parámetros directamente como props al WidgetFrame
      const widgetProps = {
        botId: botId,
        userId: userId || '',
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

      console.log('✅ VIA Widget inicializado correctamente', { botId, userId });
    } catch (error) {
      console.error('❌ Error inicializando VIA Widget:', error);
    }
  }
})();
