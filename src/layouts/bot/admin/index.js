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

import { getBotTemplates, deleteBotTemplate } from "services/botTemplateService";

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
      console.log("Bots cargados de API:", data);
      setBots(data);
    } catch (error) {
      console.error("Error cargando bots:", error);
    }
  };

  // Ver detalle
  const onViewBot = (bot) => {
    setSelectedBot(bot);
    setViewMode("view");
    setActiveTab(0);
  };

  // Editar bot
  const onEditBot = (bot) => {
    setSelectedBot(bot);
    setViewMode("edit");
    setActiveTab(0);
  };

  // Eliminar bot (local)

const onDeleteBot = async (botToDelete) => {
  try {
    await deleteBotTemplate(botToDelete.id);
    setBots((prev) => prev.filter((b) => b.id !== botToDelete.id));
  } catch (error) {
    console.error("Error al eliminar bot:", error);
    alert("No se pudo eliminar la plantilla. Intenta de nuevo.");
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
