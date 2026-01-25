import React, { useState, useEffect } from "react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import BotList from "./components/BotList";
import BotCreate from "./create"; // o ./create/index.js
import BotView from "./view";
import BotEdit from "./edit";

import {
  getBotTemplates,
  getBotTemplateById,
  deleteBotTemplate,
} from "services/botTemplateService";

function BotTemplatesContainer() {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("list"); // list, view, edit, create
  const [selectedBot, setSelectedBot] = useState(null);
  const [bots, setBots] = useState([]);

  useEffect(() => {
    loadBots();
  }, []);

  const loadBots = async () => {
    try {
      const data = await getBotTemplates();
      setBots(data);
    } catch (error) {
      console.error("Error cargando bots:", error);
    }
  };

  // Ver detalle
  const onViewBot = async (bot) => {
    try {
      const fullBot = await getBotTemplateById(bot.id); // Llama al endpoint con prompts
      setSelectedBot(fullBot);
      setViewMode("view");
      setActiveTab(0);
    } catch (error) {
      console.error("Error cargando plantilla completa:", error);
      alert("No se pudo cargar la plantilla. Intenta nuevamente.");
    }
  };

  // Editar bot
  const onEditBot = async (bot) => {
    try {
      const fullBot = await getBotTemplateById(bot.id); // Debe incluir prompts
      setSelectedBot(fullBot);
      setViewMode("edit");
      setActiveTab(0);
    } catch (error) {
      console.error("Error cargando plantilla completa:", error);
      alert("No se pudo cargar la plantilla. Intenta nuevamente.");
    }
  };

  // Eliminar bot (local)

  const onDeleteBot = async (botToDelete) => {
    try {
      await deleteBotTemplate(botToDelete.id);
      setBots((prev) => prev.filter((b) => b.id !== botToDelete.id));
      alert("✅ Plantilla eliminada correctamente.");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "No se pudo eliminar la plantilla. Intenta de nuevo.";
      console.error("Error al eliminar bot:", errorMessage);
      alert(errorMessage);
    }
  };

  // Volver a la lista
  const onBackToList = () => {
    setSelectedBot(null);
    setViewMode("list");
    setActiveTab(0);
    loadBots(); // recarga para mantener sincronía
  };

  // Crear nuevo bot
  const onCreateBot = () => {
    setSelectedBot(null);
    setViewMode("create");
    setActiveTab(1);
  };

  // Cambio pestañas
  const onTabChange = (_, newVal) => {
    setActiveTab(newVal);
    if (newVal === 0) {
      setViewMode("list");
      setSelectedBot(null);
      loadBots();
    } else if (newVal === 1) {
      setViewMode("create");
      setSelectedBot(null);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Panel de Administración de plantillas
        </SoftTypography>

        <Tabs value={activeTab} onChange={onTabChange}>
          <Tab label="Plantillas de modelos" />
          <Tab label="Crear plantilla" />
        </Tabs>

        <SoftBox mt={3}>
          {activeTab === 0 && (
            <>
              {viewMode === "list" && (
                <BotList
                  bots={bots}
                  onViewBot={onViewBot}
                  onEditBot={onEditBot}
                  onDeleteBot={onDeleteBot}
                  onCreateBot={onCreateBot}
                />
              )}

              {viewMode === "view" && selectedBot && (
                <BotView bot={selectedBot} onBack={onBackToList} onEdit={onEditBot} />
              )}

              {viewMode === "edit" && selectedBot && (
                <BotEdit bot={selectedBot} onBack={onBackToList} />
              )}
            </>
          )}

          {activeTab === 1 && viewMode === "create" && <BotCreate onBack={onBackToList} />}
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotTemplatesContainer;
