import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "contexts/AuthContext";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Footer from "examples/Footer";
import { TextField, Divider, Chip, CircularProgress, Button, LinearProgress, Tooltip, IconButton } from "@mui/material";
import Header from "layouts/profile/components/Header";
import { Link, useNavigate } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School'; // Entrenamiento
import StorageIcon from '@mui/icons-material/Storage'; // Captación de datos
import PaletteIcon from '@mui/icons-material/Palette'; // Estilos
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions'; // Integración
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import Avatar from '@mui/material/Avatar';
import SettingsIcon from '@mui/icons-material/Settings';
import Box from '@mui/material/Box';
import CheckIcon from '@mui/icons-material/Check';
import { deleteBot } from "services/botService";
import { getMyProfile, updateMyProfile } from "services/authService";
import { getMyPlan } from "services/planService";
import { getBotDataCaptureFields } from "services/botDataCaptureService";

function Overview() {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [botFields, setBotFields] = useState({});

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const data = await getMyProfile();
        setUser(data);
        setEditedUser(data);
        const planData = await getMyPlan();
        setPlan(planData);
        // Si hay bots, obtener campos de captura para cada uno
        if (data?.bots?.length) {
          const fieldsByBot = {};
          for (const bot of data.bots) {
            fieldsByBot[bot.id] = await getBotDataCaptureFields(bot.id);
          }
          setBotFields(fieldsByBot);
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          // Token inválido o expirado: logout y redirige
          logout();
        } else {
          console.error("Error al obtener el perfil o plan:", error);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [logout]);

  const handleChange = (field, value) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateMyProfile(editedUser);
      const updatedProfile = await getMyProfile();
      setUser(updatedProfile);
      setEditMode(false);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setEditMode(false);
  };

  // Eliminar bot con confirmación y actualización local
  const handleDeleteBot = async (bot) => {
    const confirm = window.confirm(`¿Seguro que deseas eliminar el bot "${bot.name}"? Esta acción es irreversible.`);
    if (confirm) {
      try {
        await deleteBot(bot.id);
        setUser((prev) => ({
          ...prev,
          bots: prev.bots.filter((b) => b.id !== bot.id),
        }));
        alert("Bot eliminado correctamente.");
      } catch (error) {
        alert("Error al eliminar el bot: " + (error.message || ""));
      }
    }
  };

  // Lógica para determinar fases completadas (simulada, reemplazar por lógica real si tienes flags en el bot)
  const getBotPhases = (bot) => {
    // Simulación: si el bot está listo, todas las fases están completas
    // Si no, solo entrenamiento está completo
    // Puedes reemplazar esto por flags reales: bot.hasTraining, bot.hasDataCapture, etc.
    // Se asume que si el bot está listo, pasó integración
    return {
      training: true,
      dataCapture: bot.isReady || (botFields[bot.id] && botFields[bot.id].length > 0),
      styles: bot.isReady, // Simulación: solo si está listo
      integration: bot.isReady, // Simulación: solo si está listo
      finished: bot.isReady // finished = pasó integración
    };
  };

  // Navegación por fase
  const handlePhaseClick = (bot, phase) => {
    switch (phase) {
      case 'training':
        navigate(`/bots/training/${bot.id}`, { state: { botId: bot.id } });
        break;
      case 'dataCapture':
        navigate(`/bots/captured-data/${bot.id}`, { state: { botId: bot.id } });
        break;
      case 'styles':
        navigate(`/bots/styles/${bot.id}`, { state: { botId: bot.id } });
        break;
      case 'integration':
        navigate(`/bots/integration/${bot.id}`, { state: { botId: bot.id } });
        break;
      default:
        break;
    }
  };
  return (
    <DashboardLayout>
      <Header user={user} />
      <SoftBox mt={2} mb={3}>
        <Card sx={{ p: 3, borderRadius: 4, boxShadow: 3, width: '100%', maxWidth: '100%', mx: 'auto' }}>
          {loading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </SoftBox>
          ) : (
            <Grid container spacing={4}>
              {/* Columna izquierda: datos de usuario */}
              <Grid item xs={12} md={6}>
                <SoftTypography variant="subtitle1" fontWeight="bold" mb={2} sx={{ fontSize: 18 }}>Datos del usuario</SoftTypography>
                <Divider sx={{ mb: 2 }} />
                {/* El nombre ya se muestra en el header, no se repite aquí */}
                {[
                  { label: "Correo:", key: "email" },
                  { label: "Teléfono:", key: "phone" },
                  { label: "Dirección:", key: "address" },
                  { label: "No. Documento:", key: "documentNumber" },
                  { label: "Cuenta verificada:", key: "isVerified" },
                ].map((item, idx) => {
                  if (editMode && item.key === "isVerified") return null;
                  return (
                    <SoftBox mb={1} display="flex" alignItems="center" key={item.label}>
                      <SoftTypography sx={{ minWidth: 170, pl: 1, fontWeight: 'bold', fontSize: 15 }}>{item.label}</SoftTypography>
                      {editMode && idx < 4 ? (
                        <TextField
                          value={editedUser[item.key] || ''}
                          onChange={e => handleChange(item.key, e.target.value)}
                          variant="standard"
                          fullWidth
                          InputProps={{ disableUnderline: false, sx: { fontSize: 15 } }}
                          sx={{ ml: 1 }}
                        />
                      ) : (
                        <SoftTypography sx={{ fontSize: 15, ml: 1 }}>
                          {item.key === "isVerified"
                            ? (user?.isVerified ? 'Sí' : 'No')
                            : (user?.[item.key] || (item.key === "phone" ? 'No registrado' : item.key === "address" ? 'No registrada' : 'No registrado'))}
                        </SoftTypography>
                      )}
                    </SoftBox>
                  );
                })}
                <SoftBox mt={2}>
                  {editMode ? (
                    <>
                      <Button variant="contained" color="success" size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120, mr: 1 }} onClick={handleSave}>Guardar</Button>
                      <Button variant="outlined" color="secondary" size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120 }} onClick={handleCancel}>Cancelar</Button>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      color="info"
                      size="small"
                      onClick={() => {
                        setEditedUser(user); // Siempre refresca los datos a editar
                        setEditMode(true);
                      }}
                      startIcon={<EditIcon />}
                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120 }}
                    >
                      Editar perfil
                    </Button>
                  )}
                </SoftBox>
              </Grid>
              {/* Columna derecha: plan actual */}
              <Grid item xs={12} md={6}>
                <SoftTypography variant="subtitle1" fontWeight="bold" mb={2} sx={{ fontSize: 18 }}>Mi plan actual</SoftTypography>
                <Divider sx={{ mb: 2 }} />
                {plan && plan.isActive ? (
                  <>
                    <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Nombre:</b> {plan.name}</SoftBox>
                    <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Precio:</b> ${plan.price}</SoftBox>
                    <SoftBox mt={2}>
                      <Link to="/plans" style={{ textDecoration: 'none' }}>
                        <Button variant="contained" color="info" size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120 }}>Detalles</Button>
                      </Link>
                      <Button variant="contained" color="error" size="small" sx={{ ml: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120 }} onClick={() => window.confirm('¿Seguro que deseas cancelar tu plan?') && window.location.reload()}>Cancelar plan</Button>
                    </SoftBox>
                    {/* Barra de consumo de tokens */}
                    {(() => {
                      // Buscar el primer valor válido de límite de tokens
                      const limit = plan?.tokensLimit ?? plan?.tokenLimit ?? plan?.limit ?? plan?.token_limit ?? plan?.maxTokens ?? 0;
                      const used = plan?.tokensUsed ?? plan?.tokenUsed ?? plan?.used ?? plan?.token_used ?? 0;
                      if (limit > 0) {
                        const percent = Math.min(100, (used / limit) * 100);
                        return (
                          <SoftBox mt={4} mb={1}>
                            <SoftTypography variant="subtitle2" fontWeight="bold" sx={{ fontSize: 15, mb: 1 }}>
                              Tokens consumidos: {used.toLocaleString()} / {limit.toLocaleString()} ({Math.round(percent)}%)
                            </SoftTypography>
                            <LinearProgress
                              variant="determinate"
                              value={percent}
                              sx={{
                                height: 10,
                                borderRadius: 5,
                                mt: 1,
                                background: '#bdbdbd',
                                '& .MuiLinearProgress-bar': used === 0
                                  ? { background: '#bdbdbd' }
                                  : {
                                      background: 'repeating-linear-gradient(135deg, #1976d2 0 20px, #2196f3 20px 40px)',
                                      animation: 'wave 2s linear infinite',
                                      transition: 'background-color 0.3s',
                                    },
                              }}
                            />
                            {/* Animación de onda para efecto líquido */}
                            <style>{`
                              @keyframes wave {
                                0% { background-position-x: 0; }
                                100% { background-position-x: 40px; }
                              }
                            `}</style>
                          </SoftBox>
                        );
                      }
                      return null;
                    })()}
                  </>
                ) : (
                  <SoftTypography color="text" sx={{ fontSize: 15 }}>No tienes un plan activo.</SoftTypography>
                )}
              </Grid>
            </Grid>
          )}
        </Card>
      </SoftBox>

      {/* Sección de Bots del Usuario */}
      {user && (
        <SoftBox mt={3} mb={3}>
          <Card sx={{ p: 3, borderRadius: 4, boxShadow: 2, width: '100%', maxWidth: '100%', mx: 'auto' }}>
            <SoftTypography variant="h5" fontWeight="bold" mb={2}>Mis Bots</SoftTypography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              {/* Mostrar siempre la card de crear nuevo bot */}
              <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
                <Link to="/bots" style={{ textDecoration: 'none' }}>
                  <Card sx={{ height: 340, minHeight: 340, maxHeight: 340, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', cursor: 'pointer', '&:hover': { borderColor: '#1976d2' } }}>
                    <SoftBox p={2} textAlign="center">
                      <AddIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                      <SoftTypography variant="h6" color="info" sx={{ fontSize: 16 }}>Crear Nuevo Bot</SoftTypography>
                    </SoftBox>
                  </Card>
                </Link>
              </Grid>
              {/* Si hay bots, mostrar las cards, si no, no mostrar nada más */}
              {user.bots && Array.isArray(user.bots) && user.bots.length > 0 && user.bots.map((bot) => {
                const phases = getBotPhases(bot);
                return (
                  <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={bot.id}>
                    <Card sx={{
                      height: 340,
                      minHeight: 340,
                      maxHeight: 340,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      p: 2,
                      borderRadius: 4,
                      boxShadow: 3,
                      position: 'relative',
                      transition: 'box-shadow 0.3s, transform 0.3s',
                      '&:hover': { boxShadow: 6, transform: 'translateY(-4px)' }
                    }}>
                      {/* Top right actions */}
                      <SoftBox position="absolute" top={10} right={10} zIndex={2} display="flex" gap={1}>
                        <Tooltip title="Eliminar bot">
                          <IconButton
                            size="small"
                            sx={{ color: '#888', transition: 'color 0.2s', '&:hover': { color: '#ff9800' } }}
                            onClick={() => handleDeleteBot(bot)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </SoftBox>
                      {/* Bot name and description */}
                      <SoftBox mt={2} mb={1} textAlign="left">
                        <SoftTypography variant="h6" fontWeight="bold" mb={1} sx={{ textAlign: 'left', color: 'info.main', fontSize: 18 }}>{bot.name}</SoftTypography>
                        <SoftTypography variant="body2" color="text" mb={2} sx={{ minHeight: 40, textAlign: 'left', fontSize: 13 }}>{bot.description || 'Sin descripción'}</SoftTypography>
                      </SoftBox>
                      {/* Fases del bot */}
                      <SoftBox mb={2} display="flex" flexDirection="row" alignItems="center" gap={2}>
                        {/* Fase actual: muestra el icono y nombre de la última fase completada */}
                        {(() => {
                          // Determinar la última fase completada
                          const phaseOrder = [
                            { key: 'training', icon: SchoolIcon, label: 'Entrenamiento' },
                            { key: 'dataCapture', icon: StorageIcon, label: 'Datos' },
                            { key: 'styles', icon: PaletteIcon, label: 'Estilos' },
                            { key: 'integration', icon: IntegrationInstructionsIcon, label: 'Integración' }
                          ];
                          let lastPhase = phaseOrder[0];
                          for (let i = 0; i < phaseOrder.length; i++) {
                            if (phases[phaseOrder[i].key]) {
                              lastPhase = phaseOrder[i];
                            } else {
                              break;
                            }
                          }
                          const PhaseIcon = lastPhase.icon;
                          // Handler para editar la fase actual: navega a la vista de edición de la fase
                          const handleEdit = () => {
                            switch (lastPhase.key) {
                              case 'training':
                                navigate(`/bots/training/${bot.id}`, { state: { botId: bot.id, edit: true } });
                                break;
                              case 'dataCapture':
                                navigate(`/bots/captured-data/${bot.id}`, { state: { botId: bot.id, edit: true } });
                                break;
                              case 'styles':
                                navigate(`/bots/style/${bot.id}`, { state: { botId: bot.id, edit: true } });
                                break;
                              case 'integration':
                                navigate(`/bots/integration/${bot.id}`, { state: { botId: bot.id, edit: true } });
                                break;
                              default:
                                break;
                            }
                          };
                          return (
                            <SoftBox display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                              <Box position="relative" width={70} height={70} display="flex" alignItems="center" justifyContent="center">
                                {/* Arco SVG más pequeño y gris */}
                                <svg width="70" height="70" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                                  <circle
                                    cx="35" cy="35" r="27"
                                    fill="none"
                                    stroke="#bdbdbd"
                                    strokeWidth="2.2"
                                    strokeDasharray="170 60"
                                    strokeLinecap="round"
                                  />
                                </svg>
                                {/* Icono de la fase actual */}
                                <PhaseIcon sx={{ fontSize: '35px !important', color: 'info.main', zIndex: 2 }} />
                                {/* Engranaje superpuesto, aún más pequeño y gris */}
                                {!phases.finished && (
                                  <Tooltip title={`Configurar ${lastPhase.label.toLowerCase()}`}>
                                    <IconButton
                                      onClick={handleEdit}
                                      sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 0,
                                        bgcolor: '#fff',
                                        p: 0,
                                        zIndex: 3,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #bdbdbd',
                                        boxShadow: 1,
                                        transition: 'box-shadow 0.2s',
                                        '&:hover .settings-gear': { color: 'info.main' },
                                        '&:hover': { bgcolor: '#f5f5f5' }
                                      }}
                                    >
                                      <SettingsIcon className="settings-gear" sx={{ fontSize: '18px !important', color: '#bdbdbd', transition: 'color 0.2s' }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                              {/* Palabra de la fase debajo del icono, centrada y visible */}
                              <SoftTypography variant="caption" sx={{ color: 'info.main', fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastPhase.label}</SoftTypography>
                            </SoftBox>
                          );
                        })()}
                       
                        {/* Integración */}
                        {phases.integration && !phases.finished && (
                          <Tooltip title="Integración completada">
                            <span>
                              <IconButton
                                onClick={() => handlePhaseClick(bot, 'integration')}
                                sx={{
                                  color: '#f57c00',
                                  transition: 'transform 0.5s',
                                  '&:hover': { transform: 'rotate(360deg)', background: '#fff3e0' },
                                }}
                              >
                                <IntegrationInstructionsIcon />
                                <AddCircleOutlineIcon sx={{ fontSize: 18, ml: -1, color: '#f57c00' }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        )}
                      </SoftBox>
                      {/* Estado actual de fases alineado a la izquierda, compacto, con tooltips */}
                      <SoftBox display="flex" flexDirection="column" alignItems="flex-center" ml={20}>
                        <SoftTypography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, mb: 0.5 }}>Estado actual</SoftTypography>
                        <Box display="flex" flexDirection="row" gap={1}>
                          <Tooltip title="Entrenamiento" arrow>
                            <span>
                              <SchoolIcon sx={{ fontSize: '15px !important', color: phases.training ? 'info.main' : '#bdbdbd', cursor: 'pointer' }} />
                            </span>
                          </Tooltip>
                          <Tooltip title="Datos" arrow>
                            <span>
                              <StorageIcon sx={{ fontSize: '15px !important', color: phases.dataCapture ? 'info.main' : '#bdbdbd', cursor: 'pointer' }} />
                            </span>
                          </Tooltip>
                          <Tooltip title="Estilos" arrow>
                            <span>
                              <PaletteIcon sx={{ fontSize: '15px !important', color: phases.styles ? 'info.main' : '#bdbdbd', cursor: 'pointer' }} />
                            </span>
                          </Tooltip>
                          <Tooltip title="Integración" arrow>
                            <span>
                              <IntegrationInstructionsIcon
                                sx={{
                                  fontSize: '15px !important',
                                  color: phases.integration ? 'info.main' : '#bdbdbd',
                                  cursor: 'pointer',
                                  transition: 'color 0.2s',
                                  '&:hover': phases.integration ? { color: 'info.dark' } : {},
                                }}
                              />
                            </span>
                          </Tooltip>
                        </Box>
                      </SoftBox>
                      {/* Acciones: Ver o Continuar configuración */}
                      <SoftBox position="absolute" bottom={16} right={16} zIndex={2}>
                        {bot.isReady ? (
                          <Link to={`/bots/captured-data/${bot.id}`} state={{ botId: bot.id }} style={{ textDecoration: 'none' }}>
                            <Button
                              variant="contained"
                              color="info"
                              size="small"
                              startIcon={<VisibilityOutlinedIcon />}
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14 }}
                            >
                              Ver Bot
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/bots/captured-data/${bot.id}`} state={{ botId: bot.id }} style={{ textDecoration: 'none' }}>
                            <Tooltip title="Continuar configuración">
                              <span>
                                <IconButton
                                  color="info"
                                  sx={{
                                    backgroundColor: 'info.main',
                                    color: '#fff',
                                    width: 56,
                                    height: 56,
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                      backgroundColor: 'info.dark',
                                      transform: 'translateX(8px) scale(1.08)',
                                    },
                                  }}
                                >
                                  <ArrowForwardIcon sx={{ fontSize: 32 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </Link>
                        )}
                      </SoftBox>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Card>
        </SoftBox>
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
