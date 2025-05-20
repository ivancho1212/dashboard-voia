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

function BotsDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const [userBot, setUserBot] = useState(null); // en el futuro, aquí puedes usar useEffect para cargarlo

  const handleShowCreate = () => setShowCreate(true);
  const handleCancelCreate = () => setShowCreate(false);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Mis Bots
        </SoftTypography>

        <Grid container spacing={3}>
          {showCreate ? (
            <Grid item xs={12} md={6} lg={4}>
              <BotCreate onCancel={handleCancelCreate} />
            </Grid>

          ) : (
            <>
              {userBot ? (
                <Grid item xs={12} md={6} lg={4}>
                  <MyBotCard bot={userBot} />
                </Grid>
              ) : (
                <Grid item xs={12}>
                  <SoftTypography variant="h6" color="text" mb={2}>
                    Mi Bot Asociado
                  </SoftTypography>
                  <SoftTypography variant="body2" color="textSecondary">
                    No tienes ningún bot asociado.
                  </SoftTypography>
                </Grid>
              )}

              <Grid item xs={12} md={6} lg={4}>
                <SoftBox
                  onClick={handleShowCreate}
                  sx={{
                    cursor: "pointer",
                    height: "100%",
                    borderRadius: 2,
                    background: "linear-gradient(135deg, #F0F8FF, #D1ECFF)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px dashed #87CEFA",
                    padding: 4,
                    "&:hover": {
                      background: "linear-gradient(135deg, #e6f7ff, #cfeefe)",
                    },
                  }}
                >
                  <Icon sx={{ fontSize: 50, color: "#0077b6" }}>add_circle_outline</Icon>
                  <SoftTypography variant="h6" mt={2} color="#0077b6">
                    Crear Nuevo Bot
                  </SoftTypography>
                </SoftBox>
              </Grid>
            </>
          )}
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotsDashboard;
