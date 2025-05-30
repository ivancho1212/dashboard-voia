import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import Grid from "@mui/material/Grid";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function AdminUserPanel() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Panel Administrativo de Usuario
        </SoftTypography>

        <Grid container spacing={3}>
          {/* Información del Usuario */}
          <Grid item xs={12} md={6} lg={4}>
            <SoftBox
              p={2}
              shadow="md"
              borderRadius="lg"
              bgColor="white"
              sx={{ cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: 6 } }}
              onClick={() => navigate("/admin/users/info")}
            >
              <SoftTypography variant="h6" fontWeight="medium">
                Información del Usuario
              </SoftTypography>
              <SoftTypography variant="body2" color="text" mt={1}>
                Gestion los usuarios registrados.
              </SoftTypography>
            </SoftBox>
          </Grid>

          {/* Bots Asociados */}
          <Grid item xs={12} md={6} lg={4}>
            <SoftBox
              p={2}
              shadow="md"
              borderRadius="lg"
              bgColor="white"
              sx={{ cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: 6 } }}
              onClick={() => navigate("/admin/users/bots")}
            >
              <SoftTypography variant="h6" fontWeight="medium">
                Bots Asociados
              </SoftTypography>
              <SoftTypography variant="body2" color="text" mt={1}>
                Gestion los bots asociados a cada usuario.
              </SoftTypography>
            </SoftBox>
          </Grid>

          {/* Plan y suscripción */}
          <Grid item xs={12} md={6} lg={4}>
            <SoftBox
              p={2}
              shadow="md"
              borderRadius="lg"
              bgColor="white"
              sx={{ cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: 6 } }}
              onClick={() => navigate("/admin/users/planSuscripcion")}
            >
              <SoftTypography variant="h6" fontWeight="medium">
                Suscripción{" "}
              </SoftTypography>
              <SoftTypography variant="body2" color="text" mt={1}>
                Gestion suscripción asociada a cada usuario.
              </SoftTypography>
            </SoftBox>
          </Grid>

          {/* Tokens consumidos */}
          <Grid item xs={12} md={6} lg={4}>
            <SoftBox
              p={2}
              shadow="md"
              borderRadius="lg"
              bgColor="white"
              sx={{ cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: 6 } }}
              onClick={() => navigate("/admin/users/tokens")}
            >
              <SoftTypography variant="h6" fontWeight="medium">
                Tokens Consumidos{" "}
              </SoftTypography>
              <SoftTypography variant="body2" color="text" mt={1}>
                Gestion los tokens consumidos.
              </SoftTypography>
            </SoftBox>
          </Grid>

          {/* Pagos Registrados */}
          <Grid item xs={12} md={6} lg={4}>
            <SoftBox
              p={2}
              shadow="md"
              borderRadius="lg"
              bgColor="white"
              sx={{ cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: 6 } }}
              onClick={() => navigate("/admin/users/pagos")}
            >
              <SoftTypography variant="h6" fontWeight="medium">
                Pagos Registrados{" "}
              </SoftTypography>
              <SoftTypography variant="body2" color="text" mt={1}>
                Gestion pagos resgistrados.
              </SoftTypography>
            </SoftBox>
          </Grid>

          {/* Modelos Activos */}
          <Grid item xs={12} md={6} lg={4}>
            <SoftBox p={2} shadow="md" borderRadius="lg" bgColor="white">
              <SoftTypography variant="h6" fontWeight="medium">
                Modelos Activos
              </SoftTypography>
            </SoftBox>
          </Grid>
        </Grid>
      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
}

export default AdminUserPanel;
