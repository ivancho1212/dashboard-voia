import React, { useEffect, useState } from "react";
import BotList from "./BotList";
import ModelConfigEditForm from "./ModelConfigEditForm"; // Ajusta según tu estructura
import {
  getBotTemplates,
  createBotTemplate,
  updateBotTemplate,
  deleteBotTemplate,
} from "services/botTemplateService";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

function BotTemplatesContainer() {
  const [bots, setBots] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // list, view, edit, create
  const [selectedBot, setSelectedBot] = useState(null);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      const data = await getBotTemplates();
      console.log("Datos recibidos de API:", data);
      setBots(data);
    } catch (error) {
      console.error("Error cargando plantillas:", error);
    }
  };

  const handleViewBot = (bot) => {
    setSelectedBot(bot);
    setViewMode("view");
  };

  const handleEditBot = (bot) => {
    setSelectedBot(bot);
    setViewMode("edit");
  };

  const onDeleteBot = async (botToDelete) => {
    try {
      await deleteBotTemplate(botToDelete.id);
      setBots((prev) => prev.filter((b) => b.id !== botToDelete.id));
    } catch (error) {
      console.error("Error al eliminar bot:", error);
      alert("No se pudo eliminar la plantilla. Intenta de nuevo.");
    }
  };

  const handleCreateBot = () => {
    setSelectedBot(null);
    setViewMode("create");
  };

  const handleBack = () => {
    setSelectedBot(null);
    setViewMode("list");
  };

  const handleSave = async (botData) => {
    try {
      if (botData.id) {
        await updateBotTemplate(botData.id, botData);
      } else {
        await createBotTemplate(botData);
      }
      await loadBots();
      setViewMode("list");
      setSelectedBot(null);
    } catch (error) {
      console.error("Error guardando plantilla:", error);
    }
  };

  return (
    <SoftBox p={3}>
      <SoftTypography variant="h4" mb={3}>
        Plantillas de Bots
      </SoftTypography>

      {viewMode === "list" && (
        <>
          <SoftButton variant="contained" color="primary" onClick={handleCreateBot} sx={{ mb: 2 }}>
            Crear nueva plantilla
          </SoftButton>

          <BotList
            bots={bots}
            onViewBot={handleViewBot}
            onEditBot={handleEditBot}
            onDeleteBot={onDeleteBot}
            onCreateBot={handleCreateBot}
          />
        </>
      )}

      {(viewMode === "view" || viewMode === "edit" || viewMode === "create") && (
        <ModelConfigEditForm
          bot={selectedBot}
          mode={viewMode}
          onBack={handleBack}
          onSave={handleSave}
        />
      )}
    </SoftBox>
  );
}

export default BotTemplatesContainer;
