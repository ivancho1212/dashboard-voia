import React, { useEffect, useState } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

import axios from "axios";

function Plans() {
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/plans") // Ajusta la URL según tu backend
      .then((response) => {
        setPlans(response.data);
      })
      .catch((error) => {
        console.error("Error al cargar planes:", error);
      });
  }, []);

  return (
    <DashboardLayout>
      <SoftBox py={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Planes Disponibles
        </SoftTypography>
        <Grid container spacing={2}>
          {plans.map((plan) => (
            <Grid item xs={12} md={6} lg={4} key={plan.id}>
              <Card sx={{ p: 2 }}>
                <SoftTypography variant="h6">{plan.name}</SoftTypography>
                <SoftTypography variant="body2" color="text">
                  {plan.description}
                </SoftTypography>
                <SoftTypography variant="subtitle2" mt={1}>
                  Precio: ${plan.price}
                </SoftTypography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Plans;
