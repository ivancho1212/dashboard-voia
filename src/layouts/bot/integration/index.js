import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import CloudIcon from "@mui/icons-material/Cloud";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

import { getBotsByUserId } from "services/botService";
import integracionWidgetImg from "assets/images/integracion-widget.png";
import { createBotIntegration, getBotIntegrationByBotId, deleteBotIntegrationByBotId } from "services/botIntegrationService";
import { useAuth } from "contexts/AuthContext";

function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Función para resaltar sintaxis HTML
function formatScriptWithSyntaxHighlight(script) {
  return script
    .replace(/(<!--[\s\S]*?-->)/g, '<span style="color: #6ee787;">$1</span>')
    .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '$1<span style="color: #79c0ff;">$2</span>')
    .replace(/(data-[a-zA-Z-]+|src|async)/g, '<span style="color: #f9e2af;">$1</span>')
    .replace(/=(&quot;[^&]*&quot;|"[^"]*")/g, '=<span style="color: #a5d6ff;">$1</span>')
    .replace(/(https?:\/\/[^\s"&]+)/g, '<span style="color: #56d4dd;">$1</span>')
    .replace(/([&<>])/g, '<span style="color: #8b949e;">$1</span>');
}

function BotAdminDashboard() {
  const { user } = useAuth();
  const [bots, setBots] = useState([]);
  const [scripts, setScripts] = useState({});
  const [showFullScript, setShowFullScript] = useState({});
  const [allowedUrls, setAllowedUrls] = useState({});
  const [editingUrl, setEditingUrl] = useState({});
  const [tempUrls, setTempUrls] = useState({});
  const [integrationIds, setIntegrationIds] = useState({}); // Para almacenar IDs de integraciones
  const location = useLocation();
  const navigate = useNavigate();

  // Protección: solo acceso por flujo guiado (solo si realmente lo necesitas)
  // Si quieres permitir acceso libre desde el sidebar, puedes eliminar este efecto
  // Si quieres proteger solo cuando se navega con estado, descomenta lo siguiente:
  // useEffect(() => {
  //   if (!location.state?.botId) {
  //     navigate("/bots", { replace: true });
  //   }
  // }, [location, navigate]);

  useEffect(() => {
    if (user && user.id) {
      // Cargar bots y sus integraciones
      getBotsByUserId(user.id)
        .then((res) => {
          setBots(res);
          // Cargar integraciones para cada bot
          loadIntegrationsForBots(res);
        })
        .catch((err) => {
          // Solo loguear, no mostrar alert si no hay bots
          if (err?.response?.data?.message?.includes("No se encontraron bots")) {
            console.info("No se encontraron bots para el usuario (OK si es primer bot)");
          } else {
            console.error("❌ Error al traer bots:", err);
          }
        });
    }
  }, [user]);

  const loadIntegrationsForBots = async (bots) => {
    const existingScripts = {};
    const existingUrls = {};
    const existingIds = {};

    for (const bot of bots) {
      try {
        const integration = await getBotIntegrationByBotId(bot.id);
        if (integration) {
          const allowedDomain = integration.allowedDomain || '';
          
          // Generar scripts basándose en los datos existentes
          const baseUrl = getApiBaseUrl();
          const widgetUrl = getWidgetFrameUrl();
          
          const compactScript = `<script async src="${widgetUrl}" data-u="${user.id}" data-b="${bot.id}"></script>`;
          
          const fullScript = `<!-- Voia AI Assistant -->
<!-- Pega este código antes del cierre </body> -->
<script>
  (function(d,s,id){
    var js, voiajs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id; js.async = true;
    js.src = "${widgetUrl}";
    js.setAttribute('data-user-id', '${user.id}');
    js.setAttribute('data-bot-id', '${bot.id}');
    js.setAttribute('data-api-base', '${baseUrl}');
    js.setAttribute('data-theme', 'auto');
    js.setAttribute('data-position', 'bottom-right');
    js.setAttribute('data-language', 'es');
    voiajs.parentNode.insertBefore(js, voiajs);
  }(document, 'script', 'voia-widget-js'));
</script>
<!-- Fin Voia AI Assistant -->`;

          existingScripts[bot.id] = {
            compact: compactScript,
            full: fullScript,
            stats: {
              compactSize: compactScript.length,
              fullSize: fullScript.length,
              reduction: Math.round((1 - compactScript.length / fullScript.length) * 100)
            }
          };
          
          existingUrls[bot.id] = allowedDomain;
          existingIds[bot.id] = integration.botId; // Usamos botId como identificador
        }
      } catch (error) {
        console.log(`ℹ️ No hay integración existente para bot ${bot.id}`);
      }
    }

    setScripts(existingScripts);
    setAllowedUrls(existingUrls);
    setIntegrationIds(existingIds);
    
    console.log("✅ Integraciones cargadas para", Object.keys(existingScripts).length, "bots");
  };

  const getApiBaseUrl = () => {
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return `http://localhost:${currentPort || '3000'}`;
    }
    
    return `https://${currentHost}`;
  };

  const getWidgetFrameUrl = () => {
    return `${getApiBaseUrl()}/widget.js`;
  };

  const generateScript = async (botId, allowedUrl) => {
    if (!allowedUrl) {
      alert("Por favor ingresa una URL permitida antes de generar el script");
      return;
    }

    const baseUrl = getApiBaseUrl();
    const widgetUrl = getWidgetFrameUrl();
    
    const compactScript = `<script async src="${widgetUrl}" data-bot="${botId}"></script>`;
    
    const fullScript = `<!-- Voia AI Assistant -->
<!-- Pega este código antes del cierre </body> -->
<script>
  (function(d,s,id){
    var js, voiajs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement(s); js.id = id; js.async = true;
    js.src = "${widgetUrl}";
    js.setAttribute('data-bot', '${botId}');
    voiajs.parentNode.insertBefore(js, voiajs);
  }(document, 'script', 'voia-widget-js'));
</script>
<!-- Fin Voia AI Assistant -->`;

    try {
      const result = await createBotIntegration({
        botId,
        allowedDomain: allowedUrl
      });
      
      setScripts((prev) => ({ 
        ...prev, 
        [botId]: {
          compact: compactScript,
          full: fullScript,
          stats: {
            compactSize: compactScript.length,
            fullSize: fullScript.length,
            reduction: Math.round((1 - compactScript.length / fullScript.length) * 100)
          }
        }
      }));

      setAllowedUrls(prev => ({ ...prev, [botId]: allowedUrl }));
      setIntegrationIds(prev => ({ ...prev, [botId]: botId })); // Usamos botId como identificador
      alert("✅ Script generado correctamente");
    } catch (error) {
      console.error("❌ Error al guardar integración:", error);
      alert("Hubo un error al guardar la integración. Revisa la consola.");
    }
  };

  const deleteScript = async (botId) => {
    if (confirm("¿Estás seguro de eliminar este script de integración?")) {
      try {
        await deleteBotIntegrationByBotId(botId);
        
        setScripts(prev => {
          const newScripts = { ...prev };
          delete newScripts[botId];
          return newScripts;
        });
        setAllowedUrls(prev => {
          const newUrls = { ...prev };
          delete newUrls[botId];
          return newUrls;
        });
        setIntegrationIds(prev => {
          const newIds = { ...prev };
          delete newIds[botId];
          return newIds;
        });
        
        alert("✅ Integración eliminada correctamente");
      } catch (error) {
        console.error("❌ Error al eliminar integración:", error);
        alert("Hubo un error al eliminar la integración. Revisa la consola.");
      }
    }
  };

  const startEditUrl = (botId) => {
    setTempUrls(prev => ({ ...prev, [botId]: allowedUrls[botId] || '' }));
    setEditingUrl(prev => ({ ...prev, [botId]: true }));
  };

  const saveUrl = async (botId) => {
    const newUrl = tempUrls[botId];
    if (!newUrl) {
      alert("La URL no puede estar vacía");
      return;
    }
    
    await generateScript(botId, newUrl);
    setEditingUrl(prev => ({ ...prev, [botId]: false }));
  };

  const cancelEditUrl = (botId) => {
    setEditingUrl(prev => ({ ...prev, [botId]: false }));
    setTempUrls(prev => {
      const newTempUrls = { ...prev };
      delete newTempUrls[botId];
      return newTempUrls;
    });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      alert("✅ Script copiado al portapapeles");
    });
  };

  const toggleScriptView = (botId) => {
    setShowFullScript(prev => ({
      ...prev,
      [botId]: !prev[botId]
    }));
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <Card sx={{ p: 3 }}>
          <SoftTypography variant="h5" gutterBottom>
            🚀 Integración de Widget IA
          </SoftTypography>
          <SoftTypography variant="body2" color="text" sx={{ mb: 3 }}>
            Configura y genera el código para integrar tu widget de chat IA
          </SoftTypography>
          
          <Divider sx={{ mb: 3 }} />

          {/* SECCIÓN DE BOTS */}
          <Grid container spacing={3}>
            {bots.length === 0 ? (
              <Grid item xs={12}>
                <SoftTypography color="warning">
                  No Se Encontraron Bots Para Este Usuario.
                </SoftTypography>
              </Grid>
            ) : (
              bots.map((bot) => (
                <Grid item xs={12} md={6} key={bot.id}>
                  <Card
                    sx={{
                      backgroundColor: "#fff",
                      borderRadius: "16px",
                      padding: 3,
                      boxShadow: "0px 10px 30px rgba(0,0,0,0.05)",
                      border: scripts[bot.id] ? "2px solid #10b981" : "2px solid #e5e7eb",
                    }}
                  >
                    {/* Header del Bot */}
                    <Grid container spacing={1} alignItems="center" mb={2}>
                      <Grid item xs={8}>
                        <SoftTypography variant="h6" fontWeight="bold" color="info">
                          {capitalizar(bot.name)}
                        </SoftTypography>
                      </Grid>
                    </Grid>

                    {/* Input URL Permitida */}
                    <SoftBox mb={2}>
                      <SoftTypography variant="caption" color="text" sx={{ mb: 1, display: 'block' }}>
                        URL Permitida para integración:
                      </SoftTypography>
                      {editingUrl[bot.id] ? (
                        <SoftBox display="flex" alignItems="center" gap={1}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="https://tusitio.com"
                            value={tempUrls[bot.id] || ''}
                            onChange={(e) => setTempUrls(prev => ({ ...prev, [bot.id]: e.target.value }))}
                            sx={{ fontSize: '0.8rem' }}
                          />
                          <IconButton onClick={() => saveUrl(bot.id)} color="success" size="small">
                            <SaveIcon />
                          </IconButton>
                          <IconButton onClick={() => cancelEditUrl(bot.id)} color="error" size="small">
                            <CancelIcon />
                          </IconButton>
                        </SoftBox>
                      ) : (
                        <SoftBox display="flex" alignItems="center" gap={1}>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="https://tusitio.com"
                            value={allowedUrls[bot.id] || ''}
                            disabled
                            sx={{ fontSize: '0.8rem' }}
                          />
                          {scripts[bot.id] ? (
                            <>
                              <IconButton onClick={() => startEditUrl(bot.id)} color="primary" size="small">
                                <EditIcon />
                              </IconButton>
                              <IconButton onClick={() => deleteScript(bot.id)} color="error" size="small">
                                <DeleteIcon />
                              </IconButton>
                            </>
                          ) : (
                            <IconButton 
                              onClick={() => startEditUrl(bot.id)} 
                              color="primary" 
                              size="small"
                              title="Configurar URL"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                        </SoftBox>
                      )}
                    </SoftBox>

                    {/* Script Generator */}
                    {!editingUrl[bot.id] && (
                      <SoftBox mb={2}>
                        <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <SoftTypography variant="caption" color="text">
                            Script de Integración:
                          </SoftTypography>
                          {scripts[bot.id] && (
                            <SoftBox display="flex" alignItems="center" gap={1}>
                              <IconButton
                                onClick={() => toggleScriptView(bot.id)}
                                size="small"
                                title={showFullScript[bot.id] ? "Ver versión compacta" : "Ver versión completa"}
                              >
                                {showFullScript[bot.id] ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </SoftBox>
                          )}
                        </SoftBox>
                        
                        <SoftBox display="flex" alignItems="center">
                          <IconButton
                            onClick={() => generateScript(bot.id, allowedUrls[bot.id])}
                            disabled={!allowedUrls[bot.id]}
                            sx={{
                              backgroundColor: scripts[bot.id] ? "success.main" : "info.main",
                              width: 40,
                              height: 40,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              mr: 1,
                              "&:hover": {
                                backgroundColor: scripts[bot.id] ? "success.dark" : "info.dark",
                                boxShadow: "0 0 10px rgba(0,0,0,0.4)",
                              },
                            }}
                            title={scripts[bot.id] ? "Script generado" : "Generar script"}
                          >
                            <AddIcon sx={{ fontSize: "1.5rem", color: "#fff" }} />
                          </IconButton>
                          
                          <Box
                            sx={{
                              flexGrow: 1,
                              border: "2px solid #e1e5e9",
                              borderRadius: "12px",
                              backgroundColor: "#f8fafc",
                              position: "relative",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                              "&:hover": {
                                borderColor: "#3b82f6",
                                boxShadow: "0 4px 12px rgba(59,130,246,0.15)",
                              },
                              transition: "all 0.3s ease",
                            }}
                          >
                            {/* Terminal Header */}
                            <Box
                              sx={{
                                backgroundColor: "#374151",
                                borderRadius: "10px 10px 0 0",
                                padding: "8px 12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ef4444" }} />
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                                <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981" }} />
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#9ca3af",
                                    fontFamily: "monospace",
                                    ml: 1,
                                    fontSize: "0.7rem",
                                  }}
                                >
                                  {showFullScript[bot.id] ? "advanced.html" : "quick.html"}
                                </Typography>
                              </Box>
                              {scripts[bot.id] && (
                                <IconButton
                                  onClick={() => copyToClipboard(
                                    showFullScript[bot.id] ? scripts[bot.id].full : scripts[bot.id].compact
                                  )}
                                  sx={{
                                    color: "#9ca3af",
                                    padding: "4px",
                                    "&:hover": {
                                      color: "#ffffff",
                                      backgroundColor: "rgba(255,255,255,0.1)",
                                    },
                                  }}
                                  size="small"
                                  title="Copiar al portapapeles"
                                >
                                  <ContentCopyIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>

                            {/* Code Display */}
                            <Box
                              sx={{
                                padding: "16px",
                                backgroundColor: "#1f2937",
                                borderRadius: "0 0 10px 10px",
                                minHeight: showFullScript[bot.id] ? "120px" : "80px",
                                transition: "min-height 0.3s ease",
                              }}
                            >
                              {scripts[bot.id] ? (
                                <Box
                                  component="pre"
                                  sx={{
                                    fontFamily: "'Fira Code', 'Consolas', monospace",
                                    fontSize: "0.8rem",
                                    margin: 0,
                                    padding: 0,
                                    color: "#e5e7eb",
                                    lineHeight: 1.6,
                                    overflow: "auto",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-all",
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: formatScriptWithSyntaxHighlight(
                                      showFullScript[bot.id] ? scripts[bot.id].full : scripts[bot.id].compact
                                    )
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "48px",
                                    color: "#6b7280",
                                    fontStyle: "italic",
                                  }}
                                >
                                  Configura la URL y genera tu script
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </SoftBox>

                        {/* Botón de Copiar Prominente */}
                        {scripts[bot.id] && (
                          <SoftBox mt={2} display="flex" justifyContent="center">
                            <IconButton
                              onClick={() => copyToClipboard(
                                showFullScript[bot.id] ? scripts[bot.id].full : scripts[bot.id].compact
                              )}
                              color="info"
                              sx={{
                                color: "white",
                                borderRadius: "12px",
                                padding: "12px 24px",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                                "&:hover": {
                                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                                },
                                transition: "all 0.3s ease",
                              }}
                              title="Copiar script al portapapeles"
                            >
                              <ContentCopyIcon sx={{ mr: 1 }} />
                              Copiar Script
                            </IconButton>
                          </SoftBox>
                        )}
                      </SoftBox>
                    )}
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* INSTRUCCIONES */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SoftTypography variant="h6" gutterBottom>
                📋 Cómo Integrar Tu Widget
              </SoftTypography>
              
              <SoftBox mb={3}>
                <SoftBox p={2} sx={{ backgroundColor: '#f8fafc', borderRadius: '8px', mb: 2, border: '1px solid #e2e8f0' }}>
                  <SoftTypography variant="body2" fontWeight="bold" color="info" sx={{ mb: 1 }}>
                    1️⃣ Configura la URL permitida
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text">
                    Ingresa la URL exacta donde quieres usar el widget (ej: https://tusitio.com)
                  </SoftTypography>
                </SoftBox>

                <SoftBox p={2} sx={{ backgroundColor: '#f0f9ff', borderRadius: '8px', mb: 2, border: '1px solid #bae6fd' }}>
                  <SoftTypography variant="body2" fontWeight="bold" color="info" sx={{ mb: 1 }}>
                    2️⃣ Genera el script
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text">
                    Haz clic en el botón + para generar tu código de integración personalizado
                  </SoftTypography>
                </SoftBox>

                <SoftBox p={2} sx={{ backgroundColor: '#f0fff0', borderRadius: '8px', mb: 2, border: '1px solid #bbf7d0' }}>
                  <SoftTypography variant="body2" fontWeight="bold" color="success" sx={{ mb: 1 }}>
                    3️⃣ Copia e integra
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text">
                    Copia el script y pégalo antes del cierre del tag &lt;/body&gt; en tu HTML
                  </SoftTypography>
                </SoftBox>

                <SoftBox p={2} sx={{ backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                  <SoftTypography variant="body2" fontWeight="bold" color="warning" sx={{ mb: 1 }}>
                    ⚠️ Importante
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text">
                    El widget solo funcionará en la URL que hayas configurado por seguridad
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftTypography variant="h6" gutterBottom>
                📍 Dónde Pegar el Código
              </SoftTypography>
              <img
                src={integracionWidgetImg}
                alt="Dónde pegar el script antes del cierre del body"
                style={{ width: "100%", borderRadius: "8px", border: "2px solid #e5e7eb" }}
              />
              <SoftTypography variant="caption" color="text" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Pega el script antes del cierre del tag &lt;/body&gt; en tu HTML
              </SoftTypography>
            </Grid>
          </Grid>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotAdminDashboard;