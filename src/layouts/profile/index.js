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
import { deleteBot, getBotPhases as fetchBotPhases } from "services/botService";
import { getMyProfile, updateMyProfile } from "services/authService";
import { getBotById } from "services/botService";
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
  const [phasesByBot, setPhasesByBot] = useState({});

  // shared button style for consistent look; text color set to info.main
  const commonBtnSx = { borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120, color: 'info.main' };

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const data = await getMyProfile();
        // If bots are present, attempt to enrich each bot by fetching full bot details from the API
        if (data?.bots && Array.isArray(data.bots) && data.bots.length > 0) {
          const enriched = [];
          for (const b of data.bots) {
            try {
              const full = await getBotById(b.id);
              enriched.push({ ...b, ...full });
            } catch (err) {
              // If fetch fails for any bot, fall back to the original minimal bot object
              console.warn('[profile] could not fetch full bot info for', b.id, err?.message || err);
              enriched.push(b);
            }
          }
          data.bots = enriched;
        }
        setUser(data);
        setEditedUser(data);
        const planData = await getMyPlan();
        setPlan(planData);
        // If there are bots, try to fetch authoritative phases first.
        // Only if fetching phases fails for a bot do we call getBotDataCaptureFields to fallback to heuristics.
        if (data?.bots?.length) {
          const fieldsByBot = {};
          const phasesMap = {};
          for (const bot of data.bots) {
            let gotPhases = false;
            try {
              const res = await fetchBotPhases(bot.id);
              const p = (res && res.phases) || {};
              phasesMap[bot.id] = {
                training: !!(p.training && p.training.completed),
                dataCapture: !!(p.data_capture && p.data_capture.completed) || !!(p.dataCapture && p.dataCapture.completed),
                styles: !!(p.styles && p.styles.completed),
                integration: !!(p.integration && p.integration.completed),
                finished: !!(p.finished && p.finished.completed),
              };
              gotPhases = true;
            } catch (err) {
              // will fallback to heuristic below
            }

            if (!gotPhases) {
              // only call the potentially heavy fields API when we don't have server phases
              try {
                fieldsByBot[bot.id] = await getBotDataCaptureFields(bot.id);
              } catch (err) {
                // ignore field fetch failures
              }
            }
          }
          setBotFields(fieldsByBot);
          if (Object.keys(phasesMap).length) setPhasesByBot(phasesMap);
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

  // Listen for updates from other pages (training/upload) to refresh phases
  useEffect(() => {
    const handler = async (ev) => {
      try {
        const botId = ev?.detail?.botId;
        if (!botId) return;
        const res = await fetchBotPhases(botId);
        const p = (res && res.phases) || {};
        setPhasesByBot((prev) => ({ ...prev, [botId]: {
          training: !!(p.training && p.training.completed),
          dataCapture: !!(p.data_capture && p.data_capture.completed) || !!(p.dataCapture && p.dataCapture.completed),
          styles: !!(p.styles && p.styles.completed),
          integration: !!(p.integration && p.integration.completed),
          finished: !!(p.finished && p.finished.completed),
        } }));
      } catch (e) { console.warn('Error refreshing bot phases', e); }
    };

    const storageHandler = (ev) => {
      try {
        if (!ev.key) return;
        const m = ev.key.match(/^bot_phases_refresh_(\d+)$/);
        if (m) {
          const botId = Number(m[1]);
          window.dispatchEvent(new CustomEvent('botPhasesUpdated', { detail: { botId } }));
        }
      } catch (e) { }
    };

    window.addEventListener('botPhasesUpdated', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener('botPhasesUpdated', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

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

  // Lógica para determinar fases completadas (úsese solo indicadores explícitos)
  const getBotPhases = (bot) => {
    // Prefer authoritative server-side phases when available
    if (phasesByBot && phasesByBot[bot.id]) return phasesByBot[bot.id];
    // Detect styles robustly (varios caminos que podría devolver la API)
    const styleIdCandidates = [bot.styleId, bot.style_id, bot.StyleId, bot.botStyleId];
    const hasNumericStyleId = styleIdCandidates.some((v) => {
      if (v === undefined || v === null) return false;
      const n = Number(v);
      return !Number.isNaN(n) && n > 0;
    });

    const hasNestedStyle = !!(bot.style && ((bot.style.id && Number(bot.style.id) > 0) || Object.keys(bot.style).length > 0)) || !!(bot.Style && ((bot.Style.id && Number(bot.Style.id) > 0) || Object.keys(bot.Style).length > 0));

    const hasStyle = hasNumericStyleId || hasNestedStyle || !!bot.hasStyle || (Array.isArray(bot.styles) && bot.styles.length > 0);

    // detect data capture fields (explicit)
    const hasDataCapture = !!(botFields[bot.id] && Array.isArray(botFields[bot.id]) && botFields[bot.id].length > 0) || !!bot.hasDataCapture || !!bot.dataCapture || !!bot.data_capture;

    // detect integration explicitly
    const hasIntegration = (() => {
      try {
        if (bot.hasIntegration || bot.isReady) return true;
        if (bot.integration) return true;
        if (Array.isArray(bot.integrations) && bot.integrations.length > 0) return true;
        if (Array.isArray(bot.botIntegrations) && bot.botIntegrations.length > 0) return true;
        if (Array.isArray(bot.bot_integrations) && bot.bot_integrations.length > 0) return true;
        if (bot.botIntegration || bot.BotIntegration) return true;
        if (bot.api_token_hash || bot.apiTokenHash || bot.apiToken) return true;
        const settings = bot.settings_json || bot.settings || (bot.integrations && bot.integrations[0] && bot.integrations[0].settings_json);
        if (settings) {
          if (typeof settings === 'string') {
            try {
              const parsed = JSON.parse(settings);
              if (parsed && Object.keys(parsed).length > 0) return true;
            } catch (e) {
              return true;
            }
          } else if (typeof settings === 'object' && Object.keys(settings).length > 0) {
            return true;
          }
        }
      } catch (e) {
        // ignore
      }
      return false;
    })();

    const finished = !!bot.isReady || !!bot.finished || !!bot.is_ready;

    // Use explicit flags only (do not infer earlier phases from later ones)
    const training = !!(bot.hasTraining || bot.trainingConfigured || bot.training || bot.trainingCompleted || bot.training_done);
    const dataCapture = hasDataCapture;
    const stylesPhase = hasStyle;
    const integrationPhase = hasIntegration;

    const phases = {
      training,
      dataCapture,
      styles: stylesPhase,
      integration: integrationPhase,
      finished,
    };

    // debug info
    try {
      console.debug('[profile] bot phase detection', bot.id, { phases, bot });
    } catch (e) {}

    return phases;
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
        // single "style" route (matches pages that use `/bots/style/:id`)
        navigate(`/bots/style/${bot.id}`, { state: { botId: bot.id } });
        break;
      case 'integration':
  navigate(`/bots/integration`, { state: { botId: bot.id } });
        break;
      default:
        break;
    }
  };

  // Decide the next incomplete phase and navigate there
  const handleContinue = (bot) => {
    const phases = getBotPhases(bot);
    // If all phases complete, do nothing
    if (phases.training && phases.dataCapture && phases.styles && phases.integration) return;
    if (!phases.training) {
      navigate(`/bots/training/${bot.id}`, { state: { botId: bot.id } });
      return;
    }
    if (!phases.dataCapture) {
      navigate(`/bots/captured-data/${bot.id}`, { state: { botId: bot.id } });
      return;
    }
    if (!phases.styles) {
      navigate(`/bots/style/${bot.id}`, { state: { botId: bot.id } });
      return;
    }
    if (!phases.integration) {
  navigate(`/bots/integration`, { state: { botId: bot.id } });
      return;
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
                      variant="outlined"
                      color="info"
                      size="small"
                      onClick={() => {
                        setEditedUser(user); // Siempre refresca los datos a editar
                        setEditMode(true);
                      }}
                      startIcon={<EditIcon sx={{ color: 'info.main' }} />}
                      sx={{ ...commonBtnSx, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#fff', color: 'info.main' }}
                    >
                      Editar perfil
                    </Button>
                  )}
                </SoftBox>
              </Grid>
              {/* Columna derecha: plan actual */}
              <Grid item xs={12} md={6}>
                {/* Split the plan area: main plan details (left) and vertical tokens card (right) */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <SoftTypography variant="subtitle1" fontWeight="bold" mb={2} sx={{ fontSize: 18 }}>Mi plan actual</SoftTypography>
                    <Divider sx={{ mb: 2 }} />
                    {plan && plan.isActive ? (
                      <>
                        <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Nombre:</b> {plan.name}</SoftBox>
                        <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Precio:</b> ${plan.price}</SoftBox>
                        <SoftBox mt={2}>
                          <Link to="/plans" style={{ textDecoration: 'none' }}>
                            <Button
                              variant="outlined"
                              color="info"
                              size="small"
                              sx={{
                                ...commonBtnSx,
                                boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                                border: '1px solid rgba(0,0,0,0.08)',
                                backgroundColor: '#fff',
                                color: 'info.main'
                              }}
                            >
                              Detalles
                            </Button>
                          </Link>
                          <Button
                            variant="outlined"
                            color="info"
                            size="small"
                            sx={{ ml: 1, ...commonBtnSx, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#fff', color: 'info.main' }}
                            onClick={() => window.confirm('¿Seguro que deseas cancelar tu plan?') && window.location.reload()}
                          >
                            Cancelar plan
                          </Button>
                        </SoftBox>

                        {/* Replaced tokens area: show Datos captados title + button linking to data resources */}
                        <SoftBox mt={3}>
                          <SoftTypography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>Datos captados</SoftTypography>
                          <Link to="/data/resources" style={{ textDecoration: 'none' }}>
                            <Button variant="outlined" color="info" size="small" sx={{ ...commonBtnSx, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#fff', color: 'info.main' }}>Datos captados</Button>
                          </Link>
                        </SoftBox>
                      </>
                    ) : (
                      <SoftTypography color="text" sx={{ fontSize: 15 }}>No tienes un plan activo.</SoftTypography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    {/* Vertical tokens card placed to the right */}
                    {(() => {
                      const limit = plan?.tokensLimit ?? plan?.tokenLimit ?? plan?.limit ?? plan?.token_limit ?? plan?.maxTokens ?? 0;
                      const used = plan?.tokensUsed ?? plan?.tokenUsed ?? plan?.used ?? plan?.token_used ?? 0;
                      if (limit > 0) {
                        const percent = Math.min(100, (used / limit) * 100);
                        return (
                          <Card sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <SoftTypography variant="caption" sx={{ mb: 1, fontWeight: 700 }}>Tokens consumidos</SoftTypography>
                            <SoftTypography variant="h6" sx={{ mb: 1 }}>{used.toLocaleString()} / {limit.toLocaleString()}</SoftTypography>
                            <Box sx={{ width: 24, height: 160, background: '#f1f1f1', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                              <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${percent}%`, background: 'linear-gradient(180deg, var(--mui-palette-info-main, #00897b), rgba(0,0,0,0.05))', transition: 'height 0.4s' }} />
                            </Box>
                            <SoftTypography variant="caption" sx={{ mt: 1 }}>{Math.round(percent)}%</SoftTypography>
                          </Card>
                        );
                      }
                      return null;
                    })()}
                  </Grid>
                </Grid>
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
                  <Card sx={{ height: 340, minHeight: 400, maxHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', cursor: 'pointer', '&:hover': { borderColor: '#1976d2' } }}>
                    <SoftBox p={2} textAlign="center">
                      <AddIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                      <SoftTypography variant="h6" color="info" sx={{ fontSize: 16 }}>Crear Nuevo Bot</SoftTypography>
                    </SoftBox>
                  </Card>
                </Link>
              </Grid>
              {/* Si hay bots, mostrar las cards, si no, no mostrar nada más */}
              {user.bots && Array.isArray(user.bots) && user.bots.length > 0 && user.bots.map((bot) => {
                // Debug: log style-related fields so we can detect what the API returns
                try {
                  console.debug('[profile] bot fields', bot.id, {
                    styleId: bot.styleId,
                    style_id: bot.style_id,
                    botStyleId: bot.botStyleId,
                    hasStyle: bot.hasStyle,
                    styleObj: bot.style,
                    stylesArr: bot.styles,
                  });
                } catch (err) {
                  console.debug('[profile] bot debug error', err);
                }

                const phases = getBotPhases(bot);
                return (
                  
                  <Grid item xs={12} sm={6} md={3} lg={3} xl={3} key={bot.id}>
                    <Card sx={{ height: 400, minHeight: 400, maxHeight: 400, display: 'flex', flexDirection: 'column' }}>
                      {/* Top-right delete stays absolute */}
                      <SoftBox position="absolute" top={10} right={10} zIndex={2} display="flex" gap={1}>
                        <Tooltip title="Eliminar bot">
                          <IconButton
                            size="small"
                            sx={{ color: '#888', transition: 'color 0.2s', '&:hover': { color: '#e53935' } }}
                            onClick={() => handleDeleteBot(bot)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </SoftBox>

                      {/* Row 1: Title (moved down a bit) */}
                      <SoftBox sx={{ height: { xs: 60, md: 64 }, overflow: 'hidden', px: 2, pt: 2, pr: 6 }} textAlign="left">
                        <SoftTypography variant="h6" fontWeight="bold" mb={1} sx={{ textAlign: 'left', color: 'info.main', fontSize: { xs: 13, md: 15 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bot.name}</SoftTypography>
                      </SoftBox>

                      {/* Row 2: Description (más espacio, menos clamp) */}
                      <SoftBox sx={{ height: { xs: 110, md: 130 }, overflow: 'auto', px: 2, mb: 0.5 }} textAlign="left">
                        <SoftTypography
                          variant="body2"
                          color="text"
                          sx={{
                            textAlign: 'justify',
                            fontSize: { xs: 12, md: 13 },
                            display: '-webkit-box',
                            WebkitLineClamp: 6,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            lineHeight: 1.35,
                          }}
                        >
                          {bot.description || 'Sin descripción'}
                        </SoftTypography>
                      </SoftBox>

                      {/* separator between description and phases */}
                      <Divider sx={{ my: 1, mx: 2 }} />


                      {/* Row 3: vertical button list for bot phases (más compacto) */}
                      <SoftBox sx={{ px: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {/* Entrenamiento */}
                        <Button
                          variant={phases.training ? 'contained' : 'outlined'}
                          color={phases.training ? 'info' : 'inherit'}
                          startIcon={<SchoolIcon sx={{ color: 'info.main', fontSize: 18 }} />}
                          endIcon={!phases.finished && phases.training ? (
                            <Tooltip title="Configurar Entrenamiento">
                              <SettingsIcon sx={{ fontSize: 16, color: 'info.main' }} />
                            </Tooltip>
                          ) : null}
                          sx={{ justifyContent: 'space-between', borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 13, minHeight: 32, mb: 0.5, opacity: phases.training ? 1 : 0.5, color: 'info.main', '&:hover': { color: 'info.dark' }, py: 0.5 }}
                          onClick={() => phases.training && handlePhaseClick(bot, 'training')}
                          disabled={!Boolean(phases.training)}
                        >
                          <span style={{ color: 'var(--mui-palette-info-main)' }}>Entrenamiento</span>
                        </Button>
                        {/* Datos */}
                        <Button
                          variant={phases.dataCapture ? 'contained' : 'outlined'}
                          color={phases.dataCapture ? 'info' : 'inherit'}
                          startIcon={<StorageIcon sx={{ color: 'info.main', fontSize: 18 }} />}
                          endIcon={!phases.finished && phases.dataCapture ? (
                            <Tooltip title="Configurar Datos">
                              <SettingsIcon sx={{ fontSize: 16, color: 'info.main' }} />
                            </Tooltip>
                          ) : null}
                          sx={{ justifyContent: 'space-between', borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 13, minHeight: 32, mb: 0.5, opacity: phases.dataCapture ? 1 : 0.5, color: 'info.main', '&:hover': { color: 'info.dark' }, py: 0.5 }}
                          onClick={() => phases.dataCapture && handlePhaseClick(bot, 'dataCapture')}
                          disabled={!Boolean(phases.dataCapture)}
                        >
                          <span style={{ color: 'var(--mui-palette-info-main)' }}>Datos</span>
                        </Button>
                        {/* Estilos */}
                        <Button
                          variant={phases.styles ? 'contained' : 'outlined'}
                          color={phases.styles ? 'info' : 'inherit'}
                          startIcon={<PaletteIcon sx={{ color: 'info.main', fontSize: 18 }} />}
                          endIcon={!phases.finished && phases.styles ? (
                            <Tooltip title="Configurar Estilos">
                              <SettingsIcon sx={{ fontSize: 16, color: 'info.main' }} />
                            </Tooltip>
                          ) : null}
                          sx={{ justifyContent: 'space-between', borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 13, minHeight: 32, mb: 0.5, opacity: phases.styles ? 1 : 0.5, color: 'info.main', '&:hover': { color: 'info.dark' }, py: 0.5 }}
                          onClick={() => phases.styles && handlePhaseClick(bot, 'styles')}
                          disabled={!Boolean(phases.styles)}
                        >
                          <span style={{ color: 'var(--mui-palette-info-main)' }}>Estilos</span>
                        </Button>
                        {/* Integración */}
                        <Button
                          variant={phases.integration ? 'contained' : 'outlined'}
                          color={phases.integration ? 'info' : 'inherit'}
                          startIcon={<IntegrationInstructionsIcon sx={{ color: 'info.main', fontSize: 18 }} />}
                          endIcon={!phases.finished && phases.integration ? (
                            <Tooltip title="Configurar Integración">
                              <SettingsIcon sx={{ fontSize: 16, color: 'info.main' }} />
                            </Tooltip>
                          ) : null}
                          sx={{ justifyContent: 'space-between', borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 13, minHeight: 32, mb: 0.5, opacity: phases.integration ? 1 : 0.5, color: 'info.main', '&:hover': { color: 'info.dark' }, py: 0.5 }}
                          onClick={() => phases.integration && handlePhaseClick(bot, 'integration')}
                          disabled={!Boolean(phases.integration)}
                        >
                          <span style={{ color: 'var(--mui-palette-info-main)' }}>Integración</span>
                        </Button>
                      </SoftBox>

                      {/* divider between phases and bottom row */}
                      <Divider sx={{ my: 1.5, mx: 2 }} />

                      {/* Spacer: flexible area to push Estado actual and button toward bottom (increased so bottom row sits lower) */}
                      <SoftBox sx={{ flex: 2.4 }} />

                      {/* Row 4: Estado actual (left) + action button (right) */}
                      <SoftBox sx={{ height: { xs: 80, md: 104 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 160, maxWidth: 160 }}>
                          <SoftTypography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 12, mb: 0.5 }}>Estado actual</SoftTypography>
                          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, alignItems: 'center', width: '100%', justifyContent: 'flex-start', overflow: 'hidden' }}>
                            <Tooltip title="Entrenamiento" arrow>
                                <span>
                                  <SchoolIcon sx={{ fontSize: { xs: '18px !important', md: '20px !important' }, color: phases.training ? 'info.main' : '#bdbdbd' }} />
                                </span>
                              </Tooltip>
                              <Tooltip title="Datos" arrow>
                                <span>
                                  <StorageIcon sx={{ fontSize: { xs: '18px !important', md: '20px !important' }, color: phases.dataCapture ? 'info.main' : '#bdbdbd' }} />
                                </span>
                              </Tooltip>
                              <Tooltip title="Estilos" arrow>
                                <span>
                                  <PaletteIcon sx={{ fontSize: { xs: '18px !important', md: '20px !important' }, color: phases.styles ? 'info.main' : '#bdbdbd' }} />
                                </span>
                              </Tooltip>
                              <Tooltip title="Integración" arrow>
                                <span>
                                  <IntegrationInstructionsIcon sx={{ fontSize: { xs: '18px !important', md: '20px !important' }, color: phases.integration ? 'info.main' : '#bdbdbd' }} />
                                </span>
                              </Tooltip>
                          </Box>
                        </Box>
                        <Box>
                          {bot.isReady ? (
                            <Link to={`/bots/captured-data/${bot.id}`} state={{ botId: bot.id }} style={{ textDecoration: 'none' }}>
                              <Button
                                variant="contained"
                                color="info"
                                size="small"
                                startIcon={<VisibilityOutlinedIcon />}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: { xs: 12, md: 14 } }}
                              >
                                Ver Bot
                              </Button>
                            </Link>
                          ) : (
                              <>
                                {(() => {
                                  const p = getBotPhases(bot);
                                  const allDone = p.training && p.dataCapture && p.styles && p.integration;
                                  if (allDone) return null;
                                  return (
                                    <Tooltip title="Continuar configuración">
                                      <span>
                                        <IconButton
                                          color="info"
                                          onClick={() => handleContinue(bot)}
                                          sx={{
                                            backgroundColor: 'info.main',
                                            color: '#fff',
                                            width: { xs: 38, md: 48 },
                                            height: { xs: 38, md: 48 },
                                            transition: 'transform 0.2s',
                                            '&:hover': {
                                              backgroundColor: 'info.dark',
                                              transform: 'translateX(8px) scale(1.06)',
                                            },
                                          }}
                                        >
                                          <ArrowForwardIcon sx={{ fontSize: { xs: 16, md: 24 } }} />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  );
                                })()}
                              </>
                          )}
                        </Box>
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
