import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SoftButton from "components/SoftButton";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import BotPreview from "./preview";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import MyBotCard from "./components/MyBotCard";
import BotCreate from "./create"; // ✅ si estás en src/layouts/bot/index.js

function BotsDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [userBot, setUserBot] = useState(null); // en el futuro, aquí puedes usar useEffect para cargarlo

  const handleShowCreate = () => setShowCreate(true);
  const handleCancelCreate = () => setShowCreate(false);

  const templates = [
    {
      id: 1,
      name: "Modelo Asistente",
      description: "Bot para atención al cliente vía chat.",
      ia_provider_name: "OpenAI",
      default_model_name: "gpt-4",
    },
    {
      id: 2,
      name: "Bot Comercial",
      description: "Asistente para ventas automatizadas.",
      ia_provider_name: "Google",
      default_model_name: "PaLM 2",
    },
    {
      id: 3,
      name: "Bot Soporte Técnico",
      description: "Automatiza respuestas frecuentes de soporte.",
      ia_provider_name: "Anthropic",
      default_model_name: "Claude 3",
    },
  ];
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Modelos de Bots
        </SoftTypography>
        <Grid item xs={12}>
          <BotPreview
            templates={templates}
            onSelectTemplate={(template) => {
              setShowCreate(true);
              // Puedes pasar el template seleccionado a BotCreate si es necesario
              console.log("Seleccionado:", template);
            }}
          />
        </Grid>


      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotsDashboard;
