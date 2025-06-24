import { useState, useEffect } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { getBotsByUserId } from "services/botService";
import integracionWidgetImg from "assets/images/integracion-widget.png";
import { createBotIntegration } from "services/botIntegrationService";

const userId = 45; // 🔥 Usuario quemado

function BotAdminDashboard() {
  const [bots, setBots] = useState([]);
  const [scripts, setScripts] = useState({});

  useEffect(() => {
    // ✅ Token quemado solo para desarrollo
    localStorage.setItem(
      "token",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // ⬅️ Aquí tu JWT
    );

    getBotsByUserId(userId)
      .then((res) => setBots(res))
      .catch((err) => console.error("❌ Error al traer bots:", err));
  }, []);

  const generateScript = async (botId) => {
    const code = `<script src="https://tudominio.com/widget.js" data-user="${userId}" data-bot="${botId}"></script>`;

    try {
      // 1. Guardar integración en backend
      await createBotIntegration({
        botId,
        integrationType: "widget",
        allowedDomain: "tudominio.com", // 👈 Modifica esto según el dominio que uses
        apiToken: "", // Opcional, si tienes un token que usar
      });

      // 2. Actualizar UI con el script generado
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
            Integración del Widget del Bot
          </SoftTypography>

          <SoftTypography variant="body2" color="text" sx={{ mb: 3 }}>
            Selecciona el bot que deseas integrar y genera su script personalizado para tu sitio
            web.
          </SoftTypography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              {bots.length === 0 ? (
                <SoftTypography color="warning">
                  No se encontraron bots para este usuario.
                </SoftTypography>
              ) : (
                bots.map((bot) => (
                  <SoftBox
                    key={bot.id}
                    mb={2}
                    p={2}
                    border="1px solid #ddd"
                    borderRadius="6px"
                    backgroundColor="#f8f9fa"
                  >
                    {/* ▶️ Nombre, modelo y proveedor en una fila */}
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <SoftTypography variant="subtitle2" fontWeight="bold">
                          {bot.name}
                        </SoftTypography>
                      </Grid>
                      <Grid item xs={4}>
                        <SoftTypography variant="caption" color="text.secondary">
                          Modelo: {bot.aiModelConfig?.name || "N/A"}
                        </SoftTypography>
                      </Grid>
                      <Grid item xs={4}>
                        <SoftTypography variant="caption" color="text.secondary">
                          Proveedor: {bot.iaProvider?.name || "N/A"}
                        </SoftTypography>
                      </Grid>
                    </Grid>

                    <SoftButton
                      color="info"
                      size="small"
                      sx={{ mt: 2 }}
                      onClick={() => generateScript(bot.id)}
                    >
                      Generar Script
                    </SoftButton>

                    {scripts[bot.id] && (
                      <SoftBox mt={2} position="relative">
                        <SoftInput
                          multiline
                          value={scripts[bot.id]}
                          readOnly
                          sx={{
                            backgroundColor: "#f3f4f6",
                            borderRadius: "6px",
                            fontFamily: "monospace",
                            height: "90px",
                            pr: 4,
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
                    )}
                  </SoftBox>
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

          <SoftTypography variant="h6">2. Verifica el Funcionamiento</SoftTypography>
          <SoftTypography variant="body2" sx={{ mt: 1 }}>
            Una vez pegado el script en tu página, abre tu sitio y verifica que el widget aparece
            correctamente.
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
