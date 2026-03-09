import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { getBotsByUserId } from "services/botService";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function BotStylesDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    getBotsByUserId(user.id)
      .then((bots) => {
        if (bots?.length > 0) {
          navigate(`/bots/style/${bots[0].id}`, { replace: true, state: { botId: bots[0].id } });
        }
      })
      .catch(() => {});
  }, [user]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography>Cargando estilos...</SoftTypography>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotStylesDashboard;
