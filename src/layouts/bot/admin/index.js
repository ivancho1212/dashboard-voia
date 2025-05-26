import { useState } from "react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import BotCreate from "./create";
import BotList from "./components/BotList";
import BotView from "./view";
import BotEdit from "./edit";

function BotAdminDashboard() {
  const [activeTab, setActiveTab] = useState(0); // 0 = Lista, 1 = Crear
  const [viewMode, setViewMode] = useState("list"); // "list", "view", "edit"
  const [selectedBot, setSelectedBot] = useState(null);

  // 🔧 ESTADO NUEVO para almacenar los bots
  const [bots, setBots] = useState([
    { id: 1, name: "Bot Prueba 1", description: "Descripción 1" },
    { id: 2, name: "Bot Prueba 2", description: "Descripción 2" },
  ]);

  // Seleccionar para ver detalle
  function onViewBot(bot) {
    setSelectedBot(bot);
    setViewMode("view");
  }

  // Seleccionar para editar
  function onEditBot(bot) {
    setSelectedBot(bot);
    setViewMode("edit");
  }

  // Volver a la lista
  function onBackToList() {
    setSelectedBot(null);
    setViewMode("list");
  }

  // Crear nuevo bot
  function onCreateBot() {
    setSelectedBot(null);
    setViewMode("create");
    setActiveTab(1); // cambia a pestaña Crear
  }

  // Cuando cambias tabs (Lista <-> Crear)
  function onTabChange(_, newVal) {
    setActiveTab(newVal);
    if (newVal === 0) {
      setViewMode("list");
      setSelectedBot(null);
    } else if (newVal === 1) {
      setViewMode("create");
      setSelectedBot(null);
    }
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Panel de Administración de Bots
        </SoftTypography>

        <Tabs value={activeTab} onChange={onTabChange}>
          <Tab label="Bots de la Plataforma" />
          <Tab label="Crear Bot" />
        </Tabs>

        <SoftBox mt={3}>
          {activeTab === 0 && (
            <>
              {viewMode === "list" && (
                <BotList
                  bots={bots} // ✅ SE PASA AQUÍ EL PROP NECESARIO
                  onViewBot={onViewBot}
                  onEditBot={onEditBot}
                  onCreateBot={onCreateBot}
                />
              )}
              {viewMode === "view" && (
                <BotView bot={selectedBot} onBack={onBackToList} onEdit={onEditBot} />
              )}
              {viewMode === "edit" && (
                <BotEdit bot={selectedBot} onBack={onBackToList} />
              )}
            </>
          )}
          {activeTab === 1 && <BotCreate />}
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotAdminDashboard;
