(function () {
  const scriptTag = document.currentScript;
  const botId = scriptTag.getAttribute("data-bot");

  if (!botId) {
    console.error("❌ El atributo data-bot es requerido para el widget.");
    return;
  }

  // Crear iframe
  const iframe = document.createElement("iframe");
  iframe.src = `http://localhost:3000/widget-frame?bot=${botId}`; // LOCALHOST para desarrollo
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.right = "20px";
  iframe.style.width = "400px";
  iframe.style.height = "600px";
  iframe.style.border = "none";
  iframe.style.zIndex = "9999";
  iframe.style.borderRadius = "16px";
  iframe.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";

  document.body.appendChild(iframe);
})();
