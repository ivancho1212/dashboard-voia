import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Card from "@mui/material/Card";

import BotPreview from "./preview";
import { getAvailableBotTemplates } from "services/botTemplateService";
import { getMyPlan } from "services/planService";
import { hasRole } from "services/authService";


function BotsDashboard() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const navigate = useNavigate();
  const isSuperAdmin = hasRole("Super Admin");

  useEffect(() => {
    const load = async () => {
      try {
        const [data, planData] = await Promise.all([
          getAvailableBotTemplates(),
          getMyPlan().catch(() => null),
        ]);
        setTemplates(data);
        setPlan(planData);
      } catch (err) {
        console.error("Error al cargar plantillas:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasPlan = isSuperAdmin || (plan && plan.isActive);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={1}>
          Modelos de Bots
        </SoftTypography>

        {/* Banner si no tiene plan activo */}
        {!loading && !hasPlan && (
          <Card sx={{ p: 2, mb: 3, backgroundColor: "#fff8e1", border: "1px solid #f0a500", borderRadius: 2 }}>
            <SoftBox display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
              <SoftBox>
                <SoftTypography variant="button" fontWeight="bold" color="warning">
                  🔒 Necesitas un plan activo para crear bots
                </SoftTypography>
                <SoftTypography variant="caption" color="text" display="block">
                  Adquiere un plan para desbloquear la creación de bots y todas sus funciones.
                </SoftTypography>
              </SoftBox>
              <SoftButton component={Link} to="/plans" variant="gradient" color="warning" size="small">
                Ver planes
              </SoftButton>
            </SoftBox>
          </Card>
        )}

        {/* Guía de selección cuando tiene plan y hay plantillas */}
        {!loading && hasPlan && templates.length > 0 && (
          <SoftBox mb={2} p={2} sx={{ backgroundColor: "#e8f5e9", borderRadius: 2, border: "1px solid #a5d6a7" }}>
            <SoftTypography variant="button" fontWeight="bold">
              👇 Selecciona una plantilla para comenzar a configurar tu bot
            </SoftTypography>
            <SoftTypography variant="caption" color="text" display="block">
              Cada plantilla incluye una configuración inicial. Puedes personalizarla completamente después.
            </SoftTypography>
          </SoftBox>
        )}

        <SoftTypography variant="h5" fontWeight="bold" mt={2} mb={2}>
          Plantillas disponibles
        </SoftTypography>

        {loading ? (
          <SoftTypography>Cargando plantillas...</SoftTypography>
        ) : templates.length === 0 ? (
          <SoftBox textAlign="center" py={6}>
            <SoftTypography variant="h6" color="text">No hay plantillas disponibles aún.</SoftTypography>
            <SoftTypography variant="caption" color="text" display="block" mt={1}>
              El administrador debe crear al menos una plantilla de bot.
            </SoftTypography>
          </SoftBox>
        ) : (
          <BotPreview
            templates={templates}
            onSelectTemplate={hasPlan
              ? (template) => navigate(`/bots/training/${template.id}`, { state: { template } })
              : null
            }
            locked={!hasPlan}
          />
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotsDashboard;
