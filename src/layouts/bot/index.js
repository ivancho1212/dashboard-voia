import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";


import BotPreview from "./preview";
import { getAvailableBotTemplates } from "services/botTemplateService";
import MyBotsList from "./components/MyBotsList";
import { useAuth } from "contexts/AuthContext";


function BotsDashboard() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await getAvailableBotTemplates();
        setTemplates(data);
      } catch (err) {
        console.error("Error al cargar plantillas:", err);
      } finally {
        setLoading(false);
      }
    };
    loadTemplates();
  }, []);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Modelos de Bots
        </SoftTypography>

        {/* Solo mostrar plantillas disponibles, sin sección de bots */}
        <SoftTypography variant="h5" fontWeight="bold" mt={4} mb={2}>
          Plantillas disponibles
        </SoftTypography>

        {loading ? (
          <SoftTypography>Cargando plantillas...</SoftTypography>
        ) : (
          <BotPreview
            templates={templates}
            onSelectTemplate={(template) => {
              navigate(`/bots/training/${template.id}`, { state: { template } });
            }}
          />
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotsDashboard;
