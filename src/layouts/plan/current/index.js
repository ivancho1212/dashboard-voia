import React, { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import Header from "layouts/profile/components/Header";
import { getMyProfile } from "services/authService";
import { getMyPlan } from "services/planService"; // <<-- nuevo servicio
import Button from "@mui/material/Button";
import SoftButton from "components/SoftButton";

const Plans = () => {
  const [user, setUser] = useState(null);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const [userData, planData] = await Promise.all([getMyProfile(), getMyPlan()]);
      setUser(userData);
      setPlan(planData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError(error.response?.data?.message || "Hubo un error al obtener los datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading)
    return (
      <DashboardLayout>
        <Header user={user} />
        <SoftBox display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </SoftBox>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <Header user={user} />
      <SoftBox py={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Mi Plan Actual
        </SoftTypography>

        {error && (
          <SoftTypography color="error" variant="body2" mb={2}>
            {error}
          </SoftTypography>
        )}

        {plan ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={4}>
              <Card sx={{ p: 3, borderRadius: 3 }}>
                <SoftTypography variant="h5" fontWeight="bold" gutterBottom>
                  {plan.name}
                </SoftTypography>
                <SoftTypography variant="body2">{plan.description}</SoftTypography>
                <SoftTypography variant="h6" color="primary" mt={2}>
                  Precio: ${plan.price}
                </SoftTypography>
                <SoftTypography variant="body2">
                  <strong>Máx Tokens:</strong> {plan.maxTokens}
                </SoftTypography>
                <SoftTypography variant="body2">
                  <strong>Límite de Bots:</strong> {plan.botsLimit ?? "Ilimitado"}
                </SoftTypography>
                <SoftTypography variant="body2">
                  <strong>Activo:</strong> {plan.isActive ? "Sí" : "No"}
                </SoftTypography>
                <SoftTypography variant="body2">
                  <strong>Inicio:</strong> {new Date(plan.startedAt).toLocaleDateString()}
                </SoftTypography>
                <SoftTypography variant="body2">
                  <strong>Vence:</strong> {new Date(plan.expiresAt).toLocaleDateString()}
                </SoftTypography>

                <SoftBox mt={3} textAlign="center">
                  <SoftButton
                    variant="contained"
                    onClick={async () => {
                      if (!plan) {
                        await createSubscription(plan.id);
                        fetchCurrentPlan(); // actualizar después de suscribirse
                      } else {
                        // Si el plan actual es distinto, cambiarlo
                        await updateSubscription(plan.id);
                        fetchCurrentPlan(); // actualizar después de cambiar
                      }
                    }}
                    disabled={plan && plan.isActive}
                    sx={{
                      background:
                        plan && plan.isActive
                          ? "#aaa"
                          : "linear-gradient(145deg, #d3d3d3, #000000)",
                      color: "#fff",
                      borderRadius: 2,
                      px: 4,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      textTransform: "none",
                      fontWeight: "bold",
                      "&:hover": {
                        background:
                          plan && plan.isActive
                            ? "#aaa"
                            : "linear-gradient(145deg, #e0e0e0, #111111)",
                      },
                    }}
                  >
                    {plan && plan.isActive ? "Plan actual" : "Suscribirme"}
                  </SoftButton>
                </SoftBox>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <SoftTypography variant="body2">No tienes un plan activo.</SoftTypography>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

export default Plans;
