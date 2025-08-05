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

        // Elige el último del array
        const selectedStyle = res[res.length - 1]; // o el que quieras

        console.log("🎨 Estilo seleccionado:", selectedStyle);
        setStyleConfig(selectedStyle);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error al cargar estilos del bot:", err);
        setLoading(false);
      });
  }, [botId]);

  if (loading) return <div>Cargando widget...</div>;
  if (!styleConfig) return <div>No se pudieron cargar los estilos del bot.</div>;

  return (
    <div style={{ height: "100vh", margin: 0 }}>
      <ChatWidget
        botId={botId}
        userId={styleConfig.userId}
        theme={styleConfig.theme}
        primaryColor={styleConfig.primaryColor}
        secondaryColor={styleConfig.secondaryColor}
        fontFamily={styleConfig.fontFamily}
        headerBackgroundColor={styleConfig.headerBackgroundColor}
        position={styleConfig.position}
        avatarUrl={styleConfig.avatarUrl}
        allowImageUpload={styleConfig.allowImageUpload}
        allowFileUpload={styleConfig.allowFileUpload}
        title={styleConfig.title}
        customCss={styleConfig.customCss}
        isDemo={true}
      />
    </div>
  );
}

export default WidgetFrame;
