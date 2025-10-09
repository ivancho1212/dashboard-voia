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

  <Grid container spacing={2} justifyContent="center" alignItems="stretch">
          {plans.map((plan, idx) => {
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
            // Resaltar el plan destacado: Premium o el primero
            const isPro = plan.name && plan.name.toLowerCase().includes("pro");
            const isFeatured = isPro;
            // Mostrar proveedor IA como texto plano
            let aiProvidersText = "-";
            if (Array.isArray(plan.aiProviders)) {
              aiProvidersText = plan.aiProviders.filter(Boolean).join(', ');
            } else if (typeof plan.aiProviders === 'string') {
              aiProvidersText = plan.aiProviders;
            }
            // Si es el plan actual, header blanco y texto info
            const headerBg = isCurrentPlan
              ? (theme) => theme.palette.common.white
              : (theme) => `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`;
            const headerTextColor = isCurrentPlan
              ? (theme) => theme.palette.info.main
              : '#fff';
            return (
              <Grid
                item
                key={plan.id}
                xs={12}
                sm={6}
                md={3}
                lg={3}
                sx={{
                  display: 'flex',
                  px: { xs: 0.5, sm: 1, md: 1.5, lg: 1.5 },
                  mb: { xs: 2, md: 2 },
                  width: '100%',
                  boxSizing: 'border-box',
                  zIndex: isFeatured ? 2 : 1,
                }}
              >
                <Card
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: isFeatured ? 540 : 480,
                    minWidth: 220,
                    maxWidth: 350,
                    width: '100%',
                    mx: 'auto',
                    boxShadow: isFeatured ? 12 : 3,
                    borderRadius: 4,
                    border: isFeatured ? '2.5px solid #d4af37' : '1px solid',
                    borderColor: isFeatured ? '#d4af37' : 'grey.200',
                    p: 0,
                    background: isFeatured
                      ? 'linear-gradient(145deg, #fffbe6 0%, #fff 100%)'
                      : '#fff',
                    position: 'relative',
                    transition: 'box-shadow 0.2s, border 0.2s',
                    '&:hover': { boxShadow: 16 },
                  }}
                >
                  {/* Precio fijo arriba */}
                  <SoftBox sx={{
                    width: '100%',
                    pt: 4,
                    pb: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: headerBg,
                    borderTopLeftRadius: 16,
                    borderTopRightRadius: 16,
                  }}>
                    <SoftTypography variant="h2" fontWeight="bold" sx={{ fontSize: 38, mb: 0, color: headerTextColor, textShadow: isCurrentPlan ? 'none' : '0 2px 8px rgba(0,0,0,0.18)' }}>
                      ${plan.price}
                    </SoftTypography>
                    <SoftTypography variant="button" sx={{ fontSize: 18, color: headerTextColor, opacity: 1, letterSpacing: 1, mb: 0.5, textShadow: isCurrentPlan ? 'none' : '0 2px 8px rgba(0,0,0,0.18)' }}>
                      {plan.name}
                    </SoftTypography>
                  </SoftBox>
                  {/* Contenido debajo del precio */}
                  <SoftBox sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', px: 3, py: 2 }}>
                    <SoftTypography variant="body2" color="text.primary" mb={2} sx={{ fontSize: 14, textAlign: 'left' }}>
                      {plan.description || "Este plan ofrece características útiles."}
                    </SoftTypography>
                    <ul style={{ paddingLeft: 0, margin: 0, marginBottom: 18, listStyle: 'none', width: '100%' }}>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Máx Tokens:</b> {plan.maxTokens}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Límite de Bots:</b> {plan.botsLimit ?? "Ilimitado"}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Tamaño máx. archivo (MB):</b> {plan.fileUploadLimit ?? "-"}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Campos de captura de datos:</b> {plan.dataCaptureLimit ?? "-"}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Proveedores IA:</b> {aiProvidersText}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Custom Styles:</b> {plan.customStyles ? "Sí" : "No"}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Analytics:</b> {plan.analyticsDashboard ? "Sí" : "No"}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Priority Support:</b> {plan.prioritySupport ? "Sí" : "No"}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>API Ext:</b> {plan.integrationApi ? "Sí" : "No"}</li>
                      <li style={{ fontSize: 14, color: '#444', marginBottom: 6, textAlign: 'left' }}><b>Activo:</b> {plan.isActive ? "Sí" : "No"}</li>
                    </ul>
                  </SoftBox>
                  {/* Botón siempre abajo */}
                  <SoftBox sx={{ width: '100%', display: 'flex', justifyContent: 'center', pb: 3, px: 3 }}>
                    <Button
                      variant="contained"
                      onClick={onClickAction}
                      disabled={isDisabled || subscribing}
                      sx={{
                        background: (theme) => `linear-gradient(90deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                        color: '#fff',
                        borderRadius: 6,
                        px: 3,
                        py: 0.5,
                        minWidth: 120,
                        minHeight: 36,
                        fontSize: 15,
                        fontWeight: 'bold',
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                        border: 'none',
                        mt: 1,
                        transition: 'background 0.2s',
                        '&:hover': {
                          background: (theme) => `linear-gradient(90deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`,
                        },
                      }}
                    >
                      {subscribing && !isDisabled ? 'Procesando...' : buttonLabel}
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
