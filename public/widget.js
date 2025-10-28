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

  // Create iframe that will host the widget
  const iframe = document.createElement("iframe");
  const baseUrl = `http://localhost:3000/widget-frame?bot=${botId}`;
  iframe.src = token ? `${baseUrl}&token=${token}` : baseUrl;

  // Minimal, non-invasive defaults. Let the host page control positioning if desired.
  // Iframe default styles — visible and positioned in the corner by default
  iframe.style.cssText = `
    display: block;
    width: 420px; /* initial fallback larger so child can measure its preferred layout */
    height: 720px; /* initial fallback larger so child can measure its preferred layout */
    border: none;
    background: transparent;
    z-index: 9999;
    pointer-events: auto; /* allow interactions by default */
    /* Default position: make widget visible by default without forcing full-screen */
    position: fixed;
    bottom: 20px;
    right: 20px;
  `;
  iframe.setAttribute('allowtransparency', 'true');

  // Handshake: validate messages only from the iframe's origin
  const childOrigin = (() => {
    try { return new URL(iframe.src).origin; } catch (e) { return null; }
  })();

  function handleMessage(event) {
    try {
      if (!event.data || typeof event.data !== 'object') return;
      if (childOrigin && event.origin !== childOrigin) return; // strict origin check

      const data = event.data;
      // Child announces readiness
      if (data.type === 'widget-ready') {
        console.log('[parent] received widget-ready from child', { origin: event.origin, data });
        // Parent can optionally request preferred size, but child will proactively send it.
        // Send a confirmation so child knows parent heard it.
        // If the child provided styling/position preferences, apply them to the iframe
        try {
          const cfg = data.config || {};
          const pos = (cfg.styles && cfg.styles.position) || cfg.position || null;
          if (pos) {
            // Reset positioning edges first
            iframe.style.top = '';
            iframe.style.bottom = '';
            iframe.style.left = '';
            iframe.style.right = '';
            iframe.style.transform = '';
            iframe.style.position = 'fixed';
            const margin = '20px';
            switch (String(pos)) {
              case 'bottom-left':
                iframe.style.bottom = margin; iframe.style.left = margin; break;
              case 'top-left':
                iframe.style.top = margin; iframe.style.left = margin; break;
              case 'top-right':
                iframe.style.top = margin; iframe.style.right = margin; break;
              case 'center-left':
                iframe.style.top = '50%'; iframe.style.left = margin; iframe.style.transform = 'translateY(-50%)'; break;
              case 'center-right':
                iframe.style.top = '50%'; iframe.style.right = margin; iframe.style.transform = 'translateY(-50%)'; break;
              case 'bottom-right':
              default:
                iframe.style.bottom = margin; iframe.style.right = margin; break;
            }
            console.log('[parent] applied position from child config:', pos);
          }
        } catch (e) {
          console.warn('[parent] error applying child position config', e);
        }

        event.source.postMessage({ type: 'parent-received-ready' }, event.origin);
        return;
      }

      // Child provides preferred size
      if (data.type === 'preferred-size' && data.width && data.height) {
        console.log('[parent] received preferred-size', data);
  // Apply size in pixels to the iframe
  iframe.style.width = `${Math.max(0, Number(data.width))}px`;
  iframe.style.height = `${Math.max(0, Number(data.height))}px`;

        // Inform child that parent applied the size
        const payload = { type: 'parent-applied-size', width: Number(data.width), height: Number(data.height) };
        try {
          iframe.contentWindow.postMessage(payload, event.origin);
          console.log('[parent] sent parent-applied-size to child', payload);
        } catch (err) {
          console.warn('[parent] could not postMessage to iframe.contentWindow', err);
        }
        return;
      }

      // Child ack after applying container size
      if (data.type === 'child-ack') {
        console.log('[parent] received child-ack (child acknowledged applied size)');
        return;
      }
    } catch (e) {
      console.error('[parent] message handler error', e);
    }
  }

  window.addEventListener('message', handleMessage);

  // Clean up on unload
  const cleanup = () => {
    window.removeEventListener('message', handleMessage);
  };
  window.addEventListener('beforeunload', cleanup);

  // append after wiring handlers
  document.body.appendChild(iframe);
  console.log('[parent] iframe appended', { src: iframe.src, initialWidth: iframe.style.width, initialHeight: iframe.style.height });
  try {
    const rect = iframe.getBoundingClientRect();
    console.log('[parent] iframe rect after append', rect);
  } catch (e) {
    console.warn('[parent] could not read iframe rect immediately', e);
  }
})();
