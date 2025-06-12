import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SoftButton from "components/SoftButton";
import Grid from "@mui/material/Grid";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import BotPreview from "./preview";
import { getAvailableBotTemplates } from "services/botTemplateService";

function BotsDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate(); // <--- esta línea es necesaria


  const handleShowCreate = () => setShowCreate(true);
  const handleCancelCreate = () => setShowCreate(false);

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

        {loading ? (
          <SoftTypography>Cargando plantillas...</SoftTypography>
        ) : (
          <Grid item xs={12}>
            <BotPreview
  templates={templates}
  onSelectTemplate={(template) => {
    navigate(`/bots/training/${template.id}`);
  }}
/>
          </Grid>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotsDashboard;
