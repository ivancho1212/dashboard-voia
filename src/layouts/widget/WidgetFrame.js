// dashboard-voia\src\layouts\widget\WidgetFrame.js
import React, { useEffect, useState } from "react";
import ChatWidget from "layouts/bot/style/components/ChatWidget";
import { getBotStylesByUser } from "services/botStylesService";

function WidgetFrame() {
  const searchParams = new URLSearchParams(window.location.search);
  const botId = parseInt(searchParams.get("bot"), 10) || 1;

  const [styleConfig, setStyleConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBotStylesByUser(botId)
      .then((res) => {
        console.log("✅ Estilos recibidos del backend:", res);

        // Selecciona el último estilo o el que prefieras
        const selectedStyle = res.length > 0 ? res[res.length - 1] : null;

        if (selectedStyle) {
          console.log("🎨 Estilo seleccionado:", selectedStyle);
          setStyleConfig(selectedStyle);
        } else {
          console.warn("⚠️ Este bot no tiene estilos definidos, se usará demo.");
          setStyleConfig(null);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error al cargar estilos del bot:", err);
        setStyleConfig(null);
        setLoading(false);
      });
  }, [botId]);

  if (loading) return <div>Cargando widget...</div>;

  return (
    <div style={{ height: "100vh", margin: 0 }}>
      <ChatWidget
        botId={botId}
        userId={styleConfig ? styleConfig.userId : 0} // fallback userId
        style={styleConfig || {}}                      // 🔹 Pasamos todo el objeto style
        isDemo={!styleConfig}                          // 🔹 Si no hay estilos, cae en demo
      />
    </div>
  );
}

export default WidgetFrame;
