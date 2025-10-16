import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { useAuth } from "contexts/AuthContext";
import { useEffect, useState } from "react";
import { getBotStylesByUser } from "services/botStylesService";
import { Button, Card, Grid } from "@mui/material";

function BotStylesDashboard() {
  const { user } = useAuth();
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStyles() {
      setLoading(true);
      try {
        if (user?.id) {
          const result = await getBotStylesByUser(user.id);
          setStyles(result);
        }
      } catch (e) {
        setStyles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStyles();
  }, [user]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Mis Estilos de Bot
        </SoftTypography>
        {loading ? (
          <SoftTypography>Cargando estilos...</SoftTypography>
        ) : styles.length === 0 ? (
          <SoftTypography>No tienes estilos personalizados aún.</SoftTypography>
        ) : (
          <Grid container spacing={2}>
            {styles.map((style) => (
              <Grid item xs={12} md={4} key={style.id}>
                <Card sx={{ p: 2 }}>
                  <SoftTypography variant="h6">{style.name || `Estilo #${style.id}`}</SoftTypography>
                  <SoftTypography variant="body2" color="text">
                    {style.theme} | {style.primary_color}
                  </SoftTypography>
                  {/* Aquí puedes agregar más detalles y acciones */}
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        {/* Botón para crear nuevo estilo, puedes condicionar por plan aquí */}
        <Button variant="contained" color="info" sx={{ mt: 3 }}>
          Crear nuevo estilo
        </Button>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotStylesDashboard;
