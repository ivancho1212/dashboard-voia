(function () {
  const scriptTag = document.currentScript;
  const botId = scriptTag.getAttribute("data-bot");
  const token = scriptTag.getAttribute("data-token");
  const allowedDomain = scriptTag.getAttribute('data-allowed-domain') || scriptTag.getAttribute('data-allowedDomain') || '';

  if (!botId) {
    console.error("❌ El atributo data-bot es requerido para el widget.");
    return;
  }

  // If allowedDomain is present, validate host; if absent, refuse to load for safety
  if (!allowedDomain) {
    console.warn('⚠️ Widget not loaded: missing data-allowed-domain attribute. Regenerate the integration snippet including the allowed domain.');
    return;
  }

  try {
    const allowedHost = (new URL(allowedDomain)).host;
    if (window.location.host !== allowedHost) {
      // Not authorized on this host
      // Silent return to avoid breaking host page
      return;
    }
  } catch (e) {
    console.warn('⚠️ Invalid data-allowed-domain value for widget.');
    return;
  }

  // Crear iframe que permita al ChatWidget gestionar su propio layout
  const iframe = document.createElement("iframe");
  const baseUrl = `http://localhost:3000/widget-frame?bot=${botId}`;
  iframe.src = token ? `${baseUrl}&token=${token}` : baseUrl;
  iframe.style.cssText = `
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    z-index: 9999;
    background: transparent;
    pointer-events: none;
  `;
  iframe.setAttribute('allowtransparency', 'true');
  
  iframe.onload = function() {
    this.style.pointerEvents = "auto";
  };

  document.body.appendChild(iframe);
})();
