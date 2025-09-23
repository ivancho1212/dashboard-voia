// dashboard-voia\src\layouts\widget\WidgetFrame.js
import React, { useEffect, useState } from "react";
import ChatWidget from "layouts/bot/style/components/ChatWidget";
import Spinner from "components/Spinner";
import { getBotStylesByUser } from "services/botStylesService";
import { useAuth } from "contexts/AuthContext";

function WidgetFrame() {
  const { user } = useAuth();

  const searchParams = new URLSearchParams(window.location.search);
  const botId = parseInt(searchParams.get("bot"), 10);
  const userId = parseInt(searchParams.get("user"), 10) || user?.id;

  const [styleConfig, setStyleConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Validación de botId
    if (!botId || isNaN(botId) || botId <= 0) {
      setError("No se proporcionó un botId válido en la URL (?bot=ID). Ejemplo: ?bot=2");
      setLoading(false);
      return;
    }

    // Validación de userId
    if (!userId) {
      setError("No se pudo determinar el userId. Asegúrate de estar autenticado o pasar ?user=ID.");
      setLoading(false);
      return;
    }

    const fetchStyles = async () => {
      try {
        const res = await getBotStylesByUser(userId);
        console.log("✅ Estilos recibidos del backend:", res);

        // Selecciona el último estilo (puedes cambiar la lógica si quieres otro criterio)
        const selectedStyle = res.length > 0 ? res[res.length - 1] : null;
        if (selectedStyle) {
          console.log("🎨 Estilo seleccionado:", selectedStyle);
          setStyleConfig(selectedStyle);
        } else {
          console.warn("⚠️ Este usuario no tiene estilos definidos, se usará demo.");
          setStyleConfig(null);
        }
      } catch (err) {
        console.error("❌ Error al cargar estilos del usuario:", err);
        setStyleConfig(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, [botId, userId]);

  if (loading) return <Spinner size={60} color="#1976d2" />;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;

  return (
    <div style={{ height: "100vh", margin: 0 }}>
      <ChatWidget
        botId={botId}
        userId={userId}
        style={styleConfig || {}}   // Pasamos estilo seleccionado o vacío
        isDemo={!styleConfig}       // Si no hay estilo, mostramos demo
      />
    </div>
  );
}

export default WidgetFrame;
