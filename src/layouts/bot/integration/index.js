import { useState } from "react";
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

// ✅ Importa la imagen correctamente
import integracionWidgetImg from "assets/images/integracion-widget.png";

const userId = "usuario123";
const botId = "bot456";

function BotAdminDashboard() {
  const [scriptCode, setScriptCode] = useState("");

  const generateScript = () => {
    const code = `<script src="https://tudominio.com/widget.js" data-user="${userId}" data-bot="${botId}"></script>`;
    setScriptCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode).then(() => {
      alert("Script copiado al portapapeles");
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
            Para integrar el asistente virtual en tu sitio web, sigue los pasos a continuación.
          </SoftTypography>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <SoftTypography variant="h6">1. Copia el Script</SoftTypography>
              <SoftTypography variant="body2" sx={{ mt: 1 }}>
                Haz clic en el botón para generar tu script personalizado. Debes pegarlo justo antes
                del cierre de <code>{`</body>`}</code> en tu sitio web.
              </SoftTypography>
              <SoftButton color="info" variant="gradient" sx={{ mt: 2 }} onClick={generateScript}>
                Generar Script
              </SoftButton>

              {scriptCode && (
                <SoftBox mt={2}>
                  <SoftTypography variant="caption" sx={{ mb: 1 }}>
                    Script generado:
                  </SoftTypography>

                  <SoftBox position="relative">
                    <SoftInput
                      multiline
                      value={scriptCode}
                      readOnly
                      sx={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: "6px",
                        fontFamily: "monospace",
                        height: "100px",
                        pr: 4,
                      }}
                    />

                    <IconButton
                      onClick={copyToClipboard}
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
              )}
            </Grid>

            <Grid item xs={12} md={5} mt={11} ml={2}>
              {/* ✅ Usamos la imagen importada */}
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
            Una vez pegado el script en tu página, abre tu sitio y verifica que el widget aparezca
            en la ubicacion definida.
          </SoftTypography>

          <SoftTypography variant="body2" color="warning" sx={{ mt: 2 }}>
            Nota: El script solo funcionará si tu bot está activo y tu cuenta está verificada.
          </SoftTypography>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotAdminDashboard;
