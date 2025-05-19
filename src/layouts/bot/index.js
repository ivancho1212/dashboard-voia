import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SoftButton from "components/SoftButton";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import MyBotCard from "./components/MyBotCard";
import BotCreate from "./create"; // ✅ si estás en src/layouts/bot/index.js
// import BotCreate from "../bot/create"; // ✅ si estás en otro subdirectorio

function BotsDashboard() {
  const [showCreate, setShowCreate] = useState(false);

  const handleShowCreate = () => setShowCreate(true);
  const handleCancelCreate = () => setShowCreate(false);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Mis Bots
        </SoftTypography>

        {!showCreate && (
          <Grid container spacing={3} mb={4} alignItems="center" justifyContent="space-between">
            <Grid item>
              <SoftBox
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                p={2}
                sx={{
                  background: "linear-gradient(135deg, #F0F8FF, #87CEFA)",
                  borderRadius: 2,
                }}
              >
                <Icon sx={{ fontSize: 40, color: "#003B73" }}>smart_toy</Icon>
                <SoftTypography variant="h6" ml={2} fontWeight="bold" color="#003B73">
                  Bots Activos
                </SoftTypography>
              </SoftBox>
            </Grid>

            <Grid item>
              <SoftButton
                variant="gradient"
                onClick={handleShowCreate}
                sx={{
                  background: "linear-gradient(135deg, #F0F8FF, #87CEFA)",
                  color: "#003B73",
                  fontWeight: "bold",
                  "&:hover": {
                    background: "linear-gradient(135deg, #e6f2fb, #7ec8f5)",
                  },
                }}
              >
                Crear Bot
              </SoftButton>
            </Grid>
          </Grid>
        )}

        {showCreate ? (
          <BotCreate onCancel={handleCancelCreate} />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <MyBotCard />
            </Grid>
            {/* Aquí puedes mapear más bots si lo deseas */}
          </Grid>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotsDashboard;
