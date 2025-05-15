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

const getPlanColor = (name) => {
  const lower = name.toLowerCase();

  if (lower.includes("premium")) return "linear-gradient(145deg, #d4af37, #f5deb3, #fff8dc)"; // dorado metálico real

  if (lower.includes("platino") || lower.includes("platinum"))
    return "linear-gradient(145deg, #dcdcdc, #f0f0f0)"; // plateado suave

  return "#f5f5f5"; // fondo neutro
};

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5006/api/plans", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      setPlans(response.data);
    } catch (error) {
      console.error("Error al obtener planes:", error);
      setError(error.response?.data?.message || "Hubo un error al obtener los planes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  if (loading)
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" mt={10}>
          <CircularProgress />
        </SoftBox>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <SoftBox py={4} px={2}>
        <SoftBox mb={4} textAlign="center">
          <SoftTypography variant="h3" fontWeight="bold" mb={1}>
            Descubre nuestros planes
          </SoftTypography>
          <SoftTypography variant="body1" color="text" maxWidth="700px" mx="auto">
            Nuestros planes están diseñados para adaptarse a tus necesidades. Ya sea que estés
            comenzando o que necesites funcionalidades premium para impulsar tu negocio, tenemos una
            opción ideal para ti.
          </SoftTypography>
        </SoftBox>

        {error && (
          <SoftTypography color="error" variant="body2" mb={2}>
            {error}
          </SoftTypography>
        )}

        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => (
            <Grid item xs={12} sm={10} md={6} lg={4} key={plan.id}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 4,
                  background: getPlanColor(plan.name), // <-- IMPORTANTE: usa "background" no "backgroundColor"
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
                    {plan.description ||
                      "Este plan ofrece características útiles para mejorar tu experiencia."}
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
                    sx={{
                      background: "linear-gradient(145deg, #d3d3d3, #000000)", // gris claro a negro, en diagonal
                      color: "#fff",
                      borderRadius: 2,
                      px: 4,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                      textTransform: "none",
                      fontWeight: "bold",
                      border: "none", // sin contorno
                      "&:hover": {
                        background: "linear-gradient(145deg, #e0e0e0, #111111)", // degradado más suave en hover
                      },
                    }}
                  >
                    Suscribirme
                  </Button>
                </SoftBox>
              </Card>
            </Grid>
          ))}
        </Grid>
      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
};

export default Plans;
