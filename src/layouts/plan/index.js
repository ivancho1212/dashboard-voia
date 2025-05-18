import React, { useEffect, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { createSubscription, updateSubscription } from "services/planService";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5006/api";

const getPlanColor = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes("premium")) return "linear-gradient(145deg, #d4af37, #f5deb3, #fff8dc)";
  if (lower.includes("platino") || lower.includes("platinum"))
    return "linear-gradient(145deg, #dcdcdc, #f0f0f0)";
  return "#f5f5f5";
};

const Plans = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPlanFromState = location.state?.currentPlanId;

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPlanId, setUserPlanId] = useState(currentPlanFromState || null);
  const [error, setError] = useState(null);
  const [subscribing, setSubscribing] = useState(false);

  const token = localStorage.getItem("token");
  const isAuthenticated = !!token;

  // 👉 Redirigir a login si no hay token
  useEffect(() => {
    if (!token) {
      navigate("/authentication/sign-in");
    }
  }, [token, navigate]);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE}/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPlans(response.data);
    } catch (err) {
      console.error("Error al obtener planes:", err);
      setError(err.response?.data?.message || "Error al obtener los planes.");
    }
  };

  const fetchUserPlan = async () => {
    try {
      const response = await axios.get(`${API_BASE}/Users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userPlan = response.data.plan;
      setUserPlanId(userPlan ? userPlan.id : null);
    } catch (err) {
      console.error("Error al obtener el usuario:", err);
      setUserPlanId(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchPlans();
      if (token && !currentPlanFromState) {
        await fetchUserPlan();
      }
      setLoading(false);
    };

    init();
  }, [token, currentPlanFromState]);

  const handleSubscribe = async (planId) => {
    if (!token || subscribing) return;

    setSubscribing(true);
    try {
      await createSubscription(planId, token);
      setUserPlanId(planId);
    } catch (err) {
      console.error("Error al suscribirse:", err);
    } finally {
      setSubscribing(false);
    }
  };

  const handleChangePlan = async (planId) => {
    if (!token || subscribing) return;

    setSubscribing(true);
    try {
      await updateSubscription(planId, token);
      setUserPlanId(planId);
    } catch (err) {
      console.error("Error al cambiar de plan:", err);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </SoftBox>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={4} px={2}>
        <SoftBox mb={4} textAlign="center">
          <SoftTypography variant="h3" fontWeight="bold" mb={1}>
            Descubre nuestros planes
          </SoftTypography>
          <SoftTypography variant="body1" color="text" maxWidth="700px" mx="auto">
            Nuestros planes están diseñados para adaptarse a tus necesidades.
          </SoftTypography>
        </SoftBox>

        {error && (
          <SoftTypography color="error" variant="body2" mb={2}>
            {error}
          </SoftTypography>
        )}

        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => {
            const isCurrentPlan = userPlanId === plan.id;

            let buttonLabel = "Suscribirme";
            let isDisabled = false;
            let onClickAction = () => handleSubscribe(plan.id);

            if (isAuthenticated) {
              if (userPlanId) {
                if (isCurrentPlan) {
                  buttonLabel = "Plan actual";
                  isDisabled = true;
                  onClickAction = null;
                } else {
                  buttonLabel = "Cambiar plan";
                  onClickAction = () => handleChangePlan(plan.id);
                }
              }
            } else {
              buttonLabel = "Suscribirme";
              onClickAction = () => navigate("/register");
            }

            return (
              <Grid item xs={12} sm={10} md={6} lg={4} key={plan.id}>
                <Card
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    background: getPlanColor(plan.name),
                    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                    minHeight: "320px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.3s",
                    "&:hover": {
                      transform: "scale(1.03)",
                    },
                  }}
                >
                  <SoftBox>
                    <SoftTypography variant="h5" fontWeight="bold" gutterBottom>
                      {plan.name}
                    </SoftTypography>
                    <SoftTypography variant="body2" color="text.primary" mb={2}>
                      {plan.description || "Este plan ofrece características útiles."}
                    </SoftTypography>
                    <SoftTypography variant="h6" color="dark" mb={1}>
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
                  </SoftBox>

                  <SoftBox mt={3} textAlign="center">
                    <Button
                      variant="contained"
                      onClick={onClickAction}
                      disabled={isDisabled || subscribing}
                      sx={{
                        background: "linear-gradient(145deg, #d3d3d3, #000000)",
                        color: "#fff",
                        borderRadius: 2,
                        px: 4,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        textTransform: "none",
                        fontWeight: "bold",
                        border: "none",
                        "&:hover": {
                          background: "linear-gradient(145deg, #e0e0e0, #111111)",
                        },
                      }}
                    >
                      {subscribing && !isDisabled ? "Procesando..." : buttonLabel}
                    </Button>
                  </SoftBox>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
};

export default Plans;
