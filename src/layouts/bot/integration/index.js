import { useState, useEffect } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MemoryIcon from "@mui/icons-material/Memory";
import CloudIcon from "@mui/icons-material/Cloud";
import AddIcon from "@mui/icons-material/Add";
import InputBase from "@mui/material/InputBase";

import { getBotsByUserId } from "services/botService";
import integracionWidgetImg from "assets/images/integracion-widget.png";
import { createBotIntegration } from "services/botIntegrationService";

const userId = 2;

function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function BotAdminDashboard() {
  const [bots, setBots] = useState([]);
  const [scripts, setScripts] = useState({});

  useEffect(() => {
    localStorage.setItem("token", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
    getBotsByUserId(userId)
      .then((res) => setBots(res))
      .catch((err) => console.error("❌ Error al traer bots:", err));
  }, []);

  const generateScript = async (botId) => {
    if (scripts[botId]) return; // Ya existe

    const code = `<script src="https://tudominio.com/widget.js" data-user="${userId}" data-bot="${botId}"></script>`;
    try {
      await createBotIntegration({
        botId,
        integrationType: "widget",
        allowedDomain: "tudominio.com",
        apiToken: "",
      });
      setScripts((prev) => ({ ...prev, [botId]: code }));
    } catch (error) {
      console.error("❌ Error al guardar integración:", error);
      alert("Hubo un error al guardar la integración. Revisa la consola.");
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert("✅ Script copiado al portapapeles");
    });
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <Card sx={{ p: 3 }}>
          <SoftTypography variant="h5" gutterBottom>
            Integración Del Widget Del Bot
          </SoftTypography>

          <SoftTypography variant="body2" color="text" sx={{ mb: 3 }}>
            Selecciona el bot que deseas integrar y genera su script personalizado para tu sitio web.
          </SoftTypography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {bots.length === 0 ? (
                <SoftTypography color="warning">
                  No Se Encontraron Bots Para Este Usuario.
                </SoftTypography>
              ) : (
                bots.map((bot) => (
                  <Card
                    key={bot.id}
                    sx={{
                      backgroundColor: "#fff",
                      borderRadius: "20px",
                      padding: 3,
                      boxShadow: "0px 10px 30px rgba(0,0,0,0.05)",
                      mb: 3,
                    }}
                  >
                    <Grid container spacing={1} alignItems="center">
                      <Grid item xs={6}>
                        <SoftTypography variant="h6" fontWeight="bold" color="info">
                          {capitalizar(bot.name)}
                        </SoftTypography>
                      </Grid>
                      <Grid item xs={6}>
                        <SoftBox textAlign="right">
                          <SoftBox display="flex" alignItems="center" justifyContent="flex-end">
                            <CloudIcon sx={{ fontSize: "1rem", mr: 0.5, color: "#888" }} />
                            <SoftTypography variant="caption" color="text">
                              {capitalizar(bot.iaProvider?.name || "N/A")}
                            </SoftTypography>
                          </SoftBox>
                          <SoftBox display="flex" alignItems="center" justifyContent="flex-end">
                            <MemoryIcon sx={{ fontSize: "1rem", mr: 0.5, color: "#888" }} />
                            <SoftTypography variant="caption" color="text">
                              {capitalizar(bot.aiModelConfig?.name || "N/A")}
                            </SoftTypography>
                          </SoftBox>
                        </SoftBox>
                      </Grid>
                    </Grid>

                    <SoftBox mt={2}>
                      <SoftTypography
                        variant="caption"
                        color="text"
                        sx={{ display: "block", mb: 1 }}
                      >
                        Script Generado:
                      </SoftTypography>
                      <SoftBox display="flex" alignItems="center">
                        <IconButton
                          onClick={() => generateScript(bot.id)}
                          disabled={!!scripts[bot.id]}
                          sx={{
                            backgroundColor: "info.main",
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 0,
                            mr: 1,
                            "&:hover": {
                              backgroundColor: "info.dark",
                              boxShadow: "0 0 10px rgba(0,0,0,0.4)",
                            },
                          }}
                        >
                          <AddIcon sx={{ fontSize: "1.5rem", color: "#fff" }} />
                        </IconButton>
                        <SoftBox
                          sx={{
                            flexGrow: 1,
                            border: "1px solid #ccc",
                            borderRadius: "10px",
                            backgroundColor: "#f3f4f6",
                            position: "relative",
                          }}
                        >
                          <InputBase
                            multiline
                            value={scripts[bot.id] || ""}
                            readOnly
                            fullWidth
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                              padding: "10px",
                              height: "90px",
                              color: "#000",
                            }}
                          />
                          <IconButton
                            onClick={() => copyToClipboard(scripts[bot.id])}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              backgroundColor: "#ffffffcc",
                              borderRadius: "6px",
                              padding: "4px",
                              zIndex: 2,
                              "&:hover": {
                                backgroundColor: "#e5e7eb",
                              },
                            }}
                            size="small"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </SoftBox>
                      </SoftBox>
                    </SoftBox>
                  </Card>
                ))
              )}
            </Grid>

            <Grid item xs={12} md={5} mt={5} ml={2}>
              <img
                src={integracionWidgetImg}
                alt="Instrucciones para integrar el script"
                style={{ width: "100%", borderRadius: "8px" }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <SoftTypography variant="h6">2. Verifica El Funcionamiento</SoftTypography>
          <SoftTypography variant="body2" sx={{ mt: 1 }}>
            Una vez pegado el script en tu página, abre tu sitio y verifica que el widget aparece correctamente.
          </SoftTypography>
          <SoftTypography variant="body2" color="primary" sx={{ mt: 2 }}>
            Nota: El script solo funcionará si el bot está activo y tu cuenta ha sido validada.
          </SoftTypography>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotAdminDashboard;
