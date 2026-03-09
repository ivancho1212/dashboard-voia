import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
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
import { createBotIntegration, getBotIntegrationByBotId, deleteBotIntegrationByBotId, getBotsWithScript, checkDomainAvailability } from "services/botIntegrationService";
import { getBotDataCaptureFields } from "services/botDataCaptureService";
import { useAuth } from "contexts/AuthContext";
import widgetAuthService from "services/widgetAuthService";

function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// Función para resaltar sintaxis HTML
function formatScriptWithSyntaxHighlight(script) {
  if (!script) return '';
  // escape HTML entities first
  const escapeHtml = (str) =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const s = escapeHtml(script);

  return s
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color: #6ee787;">$1</span>')
    .replace(/(&lt;\/?)([a-zA-Z][a-zA-Z0-9]*)/g, '$1<span style="color: #79c0ff;">$2</span>')
    .replace(/(data-[a-zA-Z-]+|src|async)/g, '<span style="color: #f9e2af;">$1</span>')
    .replace(/=("[^"]*"|&quot;[^&]*&quot;)/g, '=<span style="color: #a5d6ff;">$1</span>')
    .replace(/(https?:\/\/[^\s"&]+)/g, '<span style="color: #56d4dd;">$1</span>');
}

function BotAdminDashboard() {
  const { user } = useAuth();
  const [bots, setBots] = useState([]);
  const [eligibleBots, setEligibleBots] = useState([]);
  const [scripts, setScripts] = useState({});
  const [showFullScript, setShowFullScript] = useState({});
  const [allowedUrls, setAllowedUrls] = useState({});
  const [editingUrl, setEditingUrl] = useState({});
  const [tempUrls, setTempUrls] = useState({});
  const [integrationIds, setIntegrationIds] = useState({}); // Para almacenar IDs de integraciones
  const [selectedFrameworks, setSelectedFrameworks] = useState({});
  const [clientSecrets, setClientSecrets] = useState({}); // Para almacenar los client secrets de cada bot
  // small modal alert
  const [modalAlert, setModalAlert] = useState({ visible: false, message: '', color: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, botId: null });
  const location = useLocation();
  const navigate = useNavigate();

  // Precompute per-bot UI metadata (URL presence, framework selection)
  const botsWithMeta = (eligibleBots || []).map((b) => ({
    ...b,
    hasUrl: Boolean(tempUrls[b.id] || allowedUrls[b.id]),
    fwSelected: Boolean(selectedFrameworks[b.id]),
    genDisabled: !(Boolean(tempUrls[b.id] || allowedUrls[b.id]) && Boolean(selectedFrameworks[b.id])),
  }));

  // Determine eligible bots for integration (top-level helper so it can be reused)
  const determineEligibleBotsAndLoadIntegrations = async (botsList) => {
    const eligible = [];
    for (const b of botsList) {
      const sid = Number(b.styleId ?? b.style_id ?? b.StyleId ?? 0);
      if (Number.isNaN(sid) || sid <= 0) continue; // no style assigned -> not eligible

      if (b.hasCapture === true || b.isReady === true) {
        eligible.push(b);
        continue;
      }

      try {
        const fields = await getBotDataCaptureFields(b.id);
        if (Array.isArray(fields) && fields.length > 0) eligible.push(b);
      } catch (err) {
        console.warn('No se pudo comprobar campos de captura para bot', b.id, err);
      }
    }

    setEligibleBots(eligible);
    await loadIntegrationsForBots(eligible);
  };

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
        .then(async (res) => {
          setBots(res);
          // If the route was opened from the sidebar (no specific bot in state), prefer showing only bots that already have scripts
          if (!location.state?.botId) {
            try {
              const botsWithScript = await getBotsWithScript();
              // Map returned bots (only those with script) into the eligible list if they also meet style/capture checks
              const idsWithScript = (Array.isArray(botsWithScript) ? botsWithScript.map(b => b.botId) : []);
              const filtered = res.filter(b => idsWithScript.includes(b.id));
              // determine eligiblity using same helper
              determineEligibleBotsAndLoadIntegrations(filtered.length ? filtered : res);
            } catch (err) {
              console.warn('Could not fetch bots with script, falling back to full list', err);
              determineEligibleBotsAndLoadIntegrations(res);
            }
          } else {
            // If opened for a specific bot, determine eligibility for full list
            determineEligibleBotsAndLoadIntegrations(res);
          }
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

  // Cargar integraciones para los bots elegibles
  const loadIntegrationsForBots = async (botsList) => {
    const existingScripts = {};
    const existingUrls = {};
    const existingIds = {};

    for (const bot of botsList) {
      try {
        const integration = await getBotIntegrationByBotId(bot.id);
        if (integration) {
          const allowedDomain = integration.allowedDomain || '';

          // Generate framework-aware scripts using saved integration config
          const fw = (integration.framework || 'html').toLowerCase();
          const scriptPair = getScriptByFramework(bot.id, fw, integration);

          existingScripts[bot.id] = {
            compact: scriptPair.compact,
            full: scriptPair.full,
            stats: {
              compactSize: scriptPair.compact.length,
              fullSize: scriptPair.full.length,
              reduction: Math.round((1 - scriptPair.compact.length / scriptPair.full.length) * 100)
            }
          };

          existingUrls[bot.id] = allowedDomain;
          existingIds[bot.id] = integration.botId || bot.id; // Usamos lo que venga
          // Keep the selected framework in UI state so copy/generation prefer it
          setSelectedFrameworks(prev => ({ ...prev, [bot.id]: (integration.framework || 'html').toLowerCase() }));
        } else {
        }
      } catch (error) {
        console.log(`ℹ️ No hay integración existente para bot ${bot.id} (error capturado)`);
      }
    }

    setScripts(existingScripts);
    setAllowedUrls(existingUrls);
    setIntegrationIds(existingIds);

    // Cargar client secrets para todos los bots
    await loadBotApiSettings(botsList);

  };

  const showModal = (message, color = 'info', timeout = 3500) => {
    setModalAlert({ visible: true, message, color });
    setTimeout(() => setModalAlert(prev => ({ ...prev, visible: false })), timeout);
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
      showModal("Por favor ingresa una URL permitida antes de generar el script", "warning");
      return;
    }

    const baseUrl = getApiBaseUrl();
    const widgetUrl = getWidgetFrameUrl();
    
      try {
      // Validar que la URL no esté en uso (mismo usuario otro bot, o diferente usuario)
      try {
        const domainCheck = await checkDomainAvailability(allowedUrl, botId);
        if (domainCheck?.taken) {
          const msg = domainCheck.sameUser
            ? `Esta URL ya está integrada en tu bot "${domainCheck.botName || 'otro bot'}". Elimina esa integración primero si deseas reutilizarla.`
            : `Esta URL ya está asociada al usuario "${domainCheck.ownerName || 'otro usuario'}". Si crees que es un error comunícate a soporte@voia.ai`;
          showModal(msg, 'error', 8000);
          setLoading && setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('No se pudo verificar disponibilidad del dominio (non-blocking)', err);
      }

      // Attempt to create integration; some backends return the created integration object
      let created = null;
      try {
        created = await createBotIntegration({ botId, allowedDomain: allowedUrl, framework: selectedFrameworks[botId] || 'html' });
      } catch (err) {
        console.warn('Warning creating integration, will try to fetch existing one', err);
      }

      // If create didn't return a config, try fetching it
      let integrationConfig = null;
      if (created && typeof created === 'object') {
        integrationConfig = created;
      } else {
        try {
          integrationConfig = await getBotIntegrationByBotId(botId);
        } catch (err) {
          console.warn('No integration fetched after create for bot', botId, err);
        }
      }

      // Default to minimal config if none available
      const fw = (selectedFrameworks[botId] || (integrationConfig && integrationConfig.framework) || 'html').toLowerCase();
      const scriptPair = getScriptByFramework(botId, fw, {
        apiBase: integrationConfig?.apiBase || integrationConfig?.api_base || getApiBaseUrl(),
        theme: integrationConfig?.theme || integrationConfig?.dataTheme || 'auto',
        position: integrationConfig?.position || integrationConfig?.dataPosition || 'bottom-right',
        language: integrationConfig?.language || integrationConfig?.dataLanguage || 'es',
        allowedDomain: allowedUrl
      });

      setScripts(prev => ({
        ...prev,
        [botId]: {
          compact: scriptPair.compact,
          full: scriptPair.full,
          stats: {
            compactSize: scriptPair.compact.length,
            fullSize: scriptPair.full.length,
            reduction: Math.round((1 - scriptPair.compact.length / scriptPair.full.length) * 100)
          }
        }
      }));

      setAllowedUrls(prev => ({ ...prev, [botId]: allowedUrl }));
      setIntegrationIds(prev => ({ ...prev, [botId]: botId }));
      showModal('✅ Script generado correctamente', 'success');
      // Also call the token-generation endpoint to persist token and mark phases server-side
      try {
        await widgetAuthService.getWidgetToken(botId);
        // Emit a local event so other views (profile) refresh their authoritative phases
        try { localStorage.setItem('botPhasesLastUpdate', new Date().toISOString()); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('botPhasesUpdated', { detail: { botId } })); } catch (e) {}
      } catch (err) {
        console.warn('Warning: token generation/persist failed (non-blocking)', err);
      }
    } catch (error) {
      console.error('❌ Error al guardar/inferencia de integración:', error);
      showModal('Hubo un error al generar la integración. Revisa la consola.', 'error');
    }
  };

  const confirmDeleteScript = (botId) => {
    setConfirmDialog({ open: true, botId });
  };

  const handleConfirmDelete = async (confirmed) => {
    const botId = confirmDialog.botId;
    setConfirmDialog({ open: false, botId: null });
    if (!confirmed || !botId) return;

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
      // cleanup related UI state
      setSelectedFrameworks(prev => { const n={...prev}; delete n[botId]; return n; });
      setTempUrls(prev => { const n={...prev}; delete n[botId]; return n; });
      setEditingUrl(prev => { const n={...prev}; delete n[botId]; return n; });
      setShowFullScript(prev => { const n={...prev}; delete n[botId]; return n; });
      setClientSecrets(prev => { const n={...prev}; delete n[botId]; return n; });
      
      showModal("✅ Integración eliminada correctamente", "success");
      
      // Re-sync integrations to ensure UI reflects backend state (hide previews)
      try {
        await loadIntegrationsForBots(eligibleBots);
      } catch (err) {
        console.warn('Error reloading integrations after delete', err);
      }
    } catch (error) {
      console.error("❌ Error al eliminar integración:", error);
      showModal("Hubo un error al eliminar la integración. Revisa la consola.", "error");
    }
  };

  const startEditUrl = (botId) => {
    setTempUrls(prev => ({ ...prev, [botId]: allowedUrls[botId] || '' }));
    setEditingUrl(prev => ({ ...prev, [botId]: true }));
  };

  const saveUrl = async (botId) => {
    const newUrl = tempUrls[botId];
    if (!newUrl) {
      showModal("La URL no puede estar vacía", "warning");
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
      showModal("✅ Script copiado al portapapeles", "success");
    });
  };

  const toggleScriptView = (botId) => {
    setShowFullScript(prev => ({
      ...prev,
      [botId]: !prev[botId]
    }));
  };

  const loadBotApiSettings = async (botsList) => {
    const secrets = {};
    for (const bot of botsList) {
      try {
        const response = await fetch(`http://localhost:5006/api/bots/${bot.id}/api-settings`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });
        if (response.ok) {
          const data = await response.json();
          secrets[bot.id] = data.clientSecret;
        } else {
          console.warn(`No se pudo obtener client secret para bot ${bot.id}`);
        }
      } catch (error) {
        console.warn(`Error cargando client secret para bot ${bot.id}:`, error);
      }
    }
    setClientSecrets(secrets);
    return secrets;
  };

  const getScriptByFramework = (botId, framework, config = {}) => {
    const base = getWidgetFrameUrl();
    const fw = (framework || 'html').toLowerCase();

    const apiBase = config?.apiBase || config?.api_base || getApiBaseUrl();
    const theme = config?.theme || config?.dataTheme || 'auto';
    const position = config?.position || config?.dataPosition || 'bottom-right';
    const language = config?.language || config?.dataLanguage || 'es';
    const allowedDomain = config?.allowedDomain || config?.allowed_domain || '';
    const clientSecret = clientSecrets[botId] || ''; // Get the client secret from state

    const dataAttrs = `data-user-id="${user.id}" data-bot-id="${botId}" data-bot="${botId}" data-api-base="${apiBase}" data-theme="${theme}" data-position="${position}" data-language="${language}" data-allowed-domain="${allowedDomain}" data-client-secret="${clientSecret}"`;

    // compact: prefer a guarded inline loader when allowedDomain exists
    const compact = allowedDomain
      ? `<script>(function(){try{const allowed='${allowedDomain}';const allowedHost=(new URL(allowed)).host;if(window.location.host!==allowedHost) return;var s=document.createElement('script');s.async=true;s.src='${base}';s.setAttribute('data-user-id','${user.id}');s.setAttribute('data-bot-id','${botId}');s.setAttribute('data-bot','${botId}');s.setAttribute('data-api-base','${apiBase}');s.setAttribute('data-theme','${theme}');s.setAttribute('data-position','${position}');s.setAttribute('data-language','${language}');s.setAttribute('data-allowed-domain','${allowedDomain}');s.setAttribute('data-client-secret','${clientSecret}');document.body.appendChild(s);}catch(e){} })();</script>`
      : `<script async src="${base}" ${dataAttrs}></script>`;

    // full: framework-specific, ready-to-paste snippets
    switch (fw) {
      case 'react':
        return {
          compact,
          full: `// Or in a component (e.g. LandingPage)\nuseEffect(() => {\n  try{ const allowed = '${allowedDomain}'; if (allowed){ const allowedHost = (new URL(allowed)).host; if (window.location.host !== allowedHost) return; } } catch(e) {}\n  if (document.getElementById('voia-widget-js')) return;\n  const js = document.createElement('script'); js.id = 'voia-widget-js'; js.async = true; js.src = '${base}'; js.setAttribute('data-user-id', '${user.id}'); js.setAttribute('data-bot-id', '${botId}'); js.setAttribute('data-bot', '${botId}'); js.setAttribute('data-api-base', '${apiBase}'); js.setAttribute('data-theme', '${theme}'); js.setAttribute('data-position', '${position}'); js.setAttribute('data-language', '${language}'); js.setAttribute('data-allowed-domain', '${allowedDomain}'); js.setAttribute('data-client-secret', '${clientSecret}'); document.body.appendChild(js);\n}, []);`
        };
      case 'angular':
        return {
          compact,
          full: `<!-- Angular: paste in src/index.html before </body> OR use component snippet -->\n<script>(function(){try{const allowed='${allowedDomain}';if(allowed){const allowedHost=(new URL(allowed)).host;if(window.location.host!==allowedHost) return;}}catch(e){}var s=document.createElement('script');s.id='voia-widget-js';s.async=true;s.src='${base}';s.setAttribute('data-user-id','${user.id}');s.setAttribute('data-bot-id','${botId}');s.setAttribute('data-bot','${botId}');s.setAttribute('data-api-base','${apiBase}');s.setAttribute('data-theme','${theme}');s.setAttribute('data-position','${position}');s.setAttribute('data-language','${language}');s.setAttribute('data-allowed-domain','${allowedDomain}');s.setAttribute('data-client-secret','${clientSecret}');document.body.appendChild(s);})();</script>\n\n// Component (app.component.ts)\nimport { Component, AfterViewInit } from '@angular/core';\n@Component({ selector: 'app-root', templateUrl: './app.component.html' })\nexport class AppComponent implements AfterViewInit {\n  ngAfterViewInit() {\n    try{ const allowed = '${allowedDomain}'; if (allowed){ const allowedHost = (new URL(allowed)).host; if (window.location.host !== allowedHost) return; } } catch(e) {}\n    if (document.getElementById('voia-widget-js')) return;\n    const s = document.createElement('script'); s.id='voia-widget-js'; s.async=true; s.src='${base}'; s.setAttribute('data-user-id','${user.id}'); s.setAttribute('data-bot-id','${botId}'); s.setAttribute('data-bot','${botId}'); s.setAttribute('data-api-base','${apiBase}'); s.setAttribute('data-theme','${theme}'); s.setAttribute('data-position','${position}'); s.setAttribute('data-language','${language}'); s.setAttribute('data-allowed-domain','${allowedDomain}'); s.setAttribute('data-client-secret','${clientSecret}'); document.body.appendChild(s);\n  }\n}`
        };
      case 'vue':
        return {
          compact,
          full: `<!-- Vue: paste in public/index.html before </body> OR use component snippet -->\n<script>(function(){try{const allowed='${allowedDomain}';if(allowed){const allowedHost=(new URL(allowed)).host;if(window.location.host!==allowedHost) return;}}catch(e){}var s=document.createElement('script');s.id='voia-widget-js';s.async=true;s.src='${base}';s.setAttribute('data-user-id','${user.id}');s.setAttribute('data-bot-id','${botId}');s.setAttribute('data-bot','${botId}');s.setAttribute('data-api-base','${apiBase}');s.setAttribute('data-theme','${theme}');s.setAttribute('data-position','${position}');s.setAttribute('data-language','${language}');s.setAttribute('data-allowed-domain','${allowedDomain}');s.setAttribute('data-client-secret','${clientSecret}');document.body.appendChild(s);})();</script>\n\n// Vue component (Options API)\nexport default {\n  name: 'VoiaWidgetLoader',\n  mounted() {\n    try{ const allowed = '${allowedDomain}'; if (allowed){ const allowedHost = (new URL(allowed)).host; if (window.location.host !== allowedHost) return; } } catch(e) {}\n    if (document.getElementById('voia-widget-js')) return;\n    const s = document.createElement('script'); s.id = 'voia-widget-js'; s.async = true; s.src = '${base}'; s.setAttribute('data-user-id','${user.id}'); s.setAttribute('data-bot-id','${botId}'); s.setAttribute('data-bot','${botId}'); s.setAttribute('data-api-base','${apiBase}'); s.setAttribute('data-theme','${theme}'); s.setAttribute('data-position','${position}'); s.setAttribute('data-language','${language}'); s.setAttribute('data-allowed-domain','${allowedDomain}'); s.setAttribute('data-client-secret','${clientSecret}'); document.body.appendChild(s);\n  }\n}`
        };
      default:
        return {
          compact,
          full: `<!-- Voia AI Assistant -->\n<!-- Pega este código antes del cierre </body> -->\n<script>\n  (function(d,s,id){\n    try{ const allowed='${allowedDomain}'; if (allowed){ const allowedHost=(new URL(allowed)).host; if (window.location.host !== allowedHost) return; } } catch(e) {}\n    var js, voiajs = d.getElementsByTagName(s)[0];\n    if (d.getElementById(id)) {return;}\n    js = d.createElement(s); js.id = id; js.async = true;\n    js.src = "${base}";\n    js.setAttribute('data-user-id', '${user.id}');\n    js.setAttribute('data-bot-id', '${botId}');\n    js.setAttribute('data-bot', '${botId}');\n    js.setAttribute('data-api-base', '${apiBase}');\n    js.setAttribute('data-theme', '${theme}');\n    js.setAttribute('data-position', '${position}');\n    js.setAttribute('data-language', '${language}');\n    js.setAttribute('data-allowed-domain', '${allowedDomain}');\n    js.setAttribute('data-client-secret', '${clientSecret}');\n    voiajs.parentNode.insertBefore(js, voiajs);\n  }(document, 'script', 'voia-widget-js'));\n</script>\n<!-- Fin Voia AI Assistant -->`
        };
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <Card sx={{ p: 3 }}>
          <SoftTypography variant="h5" gutterBottom>
            Integración de Widget IA
          </SoftTypography>
          <SoftTypography variant="body2" color="text" sx={{ mb: 3 }}>
            Configura y genera el código para integrar tu widget de chat IA
          </SoftTypography>
          {modalAlert.visible && (
            <Box sx={{ position: 'fixed', left: '50%', top: 120, transform: 'translateX(-50%)', zIndex: 1400 }}>
              <Box sx={{ minWidth: 280, maxWidth: 520, bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, px: 2, py: 1.25, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: modalAlert.color === 'success' ? 'success.main' : modalAlert.color === 'error' ? 'error.main' : 'info.main' }} />
                <Box sx={{ fontSize: '0.9rem', color: 'text.primary' }}>{modalAlert.message}</Box>
              </Box>
            </Box>
          )}
          {confirmDialog.open && (
            <Box sx={{ position: 'fixed', left: '50%', top: 160, transform: 'translateX(-50%)', zIndex: 1401 }}>
              <Box sx={{ minWidth: 300, bgcolor: 'background.paper', boxShadow: 24, borderRadius: 2, px: 2, py: 1.5 }}>
                <Box sx={{ mb: 1, fontWeight: 600 }}>¿Eliminar integración?</Box>
                <Box sx={{ mb: 1, color: 'text.secondary' }}>Esta acción eliminará el script generado para este bot. ¿Deseas continuar?</Box>
                <Box display="flex" justifyContent="flex-end" gap={1}>
                  <Box component="button" onClick={() => handleConfirmDelete(false)} style={{ background: 'transparent', border: 'none', padding: '6px 10px', cursor: 'pointer' }}>Cancelar</Box>
                  <Box component="button" onClick={() => handleConfirmDelete(true)} sx={{ backgroundColor: 'error.main', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 1, cursor: 'pointer' }}>Eliminar</Box>
                </Box>
              </Box>
            </Box>
          )}
          
          <Divider sx={{ mb: 3 }} />

          {/* SECCIÓN DE BOTS */}
          <Grid container spacing={3}>
            {eligibleBots.length === 0 ? (
              <Grid item xs={12}>
                  <SoftTypography color="warning">
                    No hay bots elegibles para integración. Asegúrate de que tus bots tengan un estilo asignado y hayan completado la etapa de captura de datos.
                  </SoftTypography>
              </Grid>
      ) : (
        botsWithMeta.map((bot) => (
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
                          {/* Si no existe integración, mostrar input habilitado para primera vez (sin lápiz) */}
                          {scripts[bot.id] ? (
                            <>
                              <TextField
                                fullWidth
                                size="small"
                                placeholder="https://tusitio.com"
                                value={allowedUrls[bot.id] || ''}
                                disabled
                                sx={{ fontSize: '0.8rem' }}
                              />
                              <IconButton onClick={() => startEditUrl(bot.id)} color="info" size="small">
                                <EditIcon />
                              </IconButton>
                              <IconButton onClick={() => confirmDeleteScript(bot.id)} color="error" size="small">
                                <DeleteIcon />
                              </IconButton>
                            </>
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="https://tusitio.com"
                              value={tempUrls[bot.id] || ''}
                              onChange={(e) => setTempUrls(prev => ({ ...prev, [bot.id]: e.target.value }))}
                              sx={{ fontSize: '0.8rem' }}
                            />
                          )}
                        </SoftBox>
                      )}

                      {/* Framework selector: colocarlo justo debajo del input de URL */}
                      <Box mt={1}>
                        <SoftTypography variant="caption" color="text" sx={{ mb: 1, display: 'block' }}>
                          Plataforma / Framework:
                        </SoftTypography>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          {['html', 'react', 'angular', 'vue'].map((fw) => {
                            const emoji = fw === 'react' ? '⚛️' : fw === 'angular' ? '🅰️' : fw === 'vue' ? '🟩' : '🌐';
                            const labelMap = { html: 'HTML', react: 'React', angular: 'Angular', vue: 'Vue' };
                            const isSelected = selectedFrameworks[bot.id] === fw;
                            const isLocked = Boolean(scripts[bot.id]) && !editingUrl[bot.id];

                            return (
                              <Chip
                                key={fw}
                                label={`${emoji} ${labelMap[fw] || fw}`}
                                clickable={!isLocked}
                                size="small"
                                onClick={() => {
                                  // If integration already generated and not in edit mode, prevent changes
                                  if (isLocked) {
                                    showModal('Para cambiar el framework primero pulsa el ícono de editar y guarda los cambios.', 'info');
                                    return;
                                  }

                                  // Toggle selection: deselect if already selected
                                  setSelectedFrameworks(prev => {
                                    const next = { ...prev };
                                    if (next[bot.id] === fw) {
                                      delete next[bot.id];
                                    } else {
                                      next[bot.id] = fw;
                                    }
                                    return next;
                                  });
                                }}
                                sx={(theme) => ({
                                  backgroundColor: isSelected ? theme.palette.info.main : theme.palette.grey[200],
                                  // Force white text when selected for visibility
                                  color: isSelected ? '#ffffff' : 'inherit',
                                  border: isSelected ? `1px solid ${theme.palette.info.dark}` : '1px solid rgba(0,0,0,0.06)',
                                  boxShadow: isSelected ? `0 6px 18px ${theme.palette.info.dark}33` : 'none',
                                  cursor: isLocked ? 'not-allowed' : 'pointer',
                                  '&:hover': {
                                    backgroundColor: isLocked ? (isSelected ? theme.palette.info.main : theme.palette.grey[200]) : (isSelected ? theme.palette.info.dark : theme.palette.grey[300])
                                  }
                                })}
                              />
                            );
                          })}
                        </Box>
                      </Box>

                    </SoftBox>

                    {/* Script Generator */}
                      <SoftBox mb={2}>
                        <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <SoftTypography variant="caption" color="text">
                            Script de Integración:
                          </SoftTypography>
                          {/* Show view toggle ONLY if a generated script exists (after clicking Generar) */}
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
                        
                        <SoftBox display="flex" alignItems="center" sx={{ position: 'relative' }}>
                          {/* Mostrar botón + siempre en creación o edición; oculto cuando ya existe script */}
                          {(!scripts[bot.id] || editingUrl[bot.id]) && (
                            <Box sx={{ width: 44, height: 44, mr: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {/* Visual wrapper: inline circular button so it stays inside card flow and is visible */}
                              <Box
                                role="button"
                                title="Generar script"
                                aria-disabled={!((editingUrl[bot.id] ? Boolean(tempUrls[bot.id]) : Boolean(tempUrls[bot.id] || allowedUrls[bot.id])) && Boolean(selectedFrameworks[bot.id]))}
                                onClick={async () => {
                                  const currentUrl = editingUrl[bot.id] ? tempUrls[bot.id] : (tempUrls[bot.id] || '');
                                  const fw = selectedFrameworks[bot.id];
                                  const enabled = Boolean(currentUrl) && Boolean(fw);
                                  if (!enabled) {
                                    showModal('Debes ingresar una URL válida y seleccionar un framework antes de generar el script.', 'warning');
                                    return;
                                  }

                                  // Validar formato de URL
                                  try {
                                    const parsed = new URL(currentUrl);
                                    if (!['http:', 'https:'].includes(parsed.protocol)) {
                                      showModal('La URL debe usar http:// o https://', 'warning');
                                      return;
                                    }
                                  } catch (err) {
                                    showModal('La URL ingresada no es válida. Ejemplo: https://tusitio.com', 'warning');
                                    return;
                                  }

                                  await generateScript(bot.id, currentUrl);
                                  if (editingUrl[bot.id]) setEditingUrl(prev => ({ ...prev, [bot.id]: false }));
                                }}
                                sx={(theme) => ({
                                  width: 44,
                                  height: 44,
                                  borderRadius: '50%',
                                  backgroundColor: ((editingUrl[bot.id] ? Boolean(tempUrls[bot.id]) : Boolean(tempUrls[bot.id] || allowedUrls[bot.id])) && selectedFrameworks[bot.id]) ? theme.palette.info.main : theme.palette.grey[300],
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  cursor: ((editingUrl[bot.id] ? Boolean(tempUrls[bot.id]) : Boolean(tempUrls[bot.id] || allowedUrls[bot.id])) && selectedFrameworks[bot.id]) ? 'pointer' : 'default',
                                  zIndex: 3,
                                  boxShadow: ((editingUrl[bot.id] ? Boolean(tempUrls[bot.id]) : Boolean(tempUrls[bot.id] || allowedUrls[bot.id])) && selectedFrameworks[bot.id]) ? `0 8px 22px ${theme.palette.info.dark}33` : 'none',
                                  border: '1px solid rgba(0,0,0,0.06)'
                                })}
                              >
                                <AddIcon sx={{ fontSize: '1.35rem' }} />
                              </Box>
                            </Box>
                          )}

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
                                  onClick={() => {
                                    copyToClipboard(showFullScript[bot.id] ? scripts[bot.id].full : scripts[bot.id].compact);
                                  }}
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
                                // Si no hay script generado, NO mostrar preview aunque exista URL+framework
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
                                  Configura la URL y pulsa + para generar tu script
                                </Box>
                              )}
                            </Box>
                          </Box>

                          {/* preview copy handled by header copy icon */}

                        </SoftBox>

                        {/* Nota: el selector de framework ya está arriba, aquí mostramos la vista de script / preview */}
                      </SoftBox>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* INSTRUCCIONES DINÁMICAS */}
          {(() => {
            const activeFramework = Object.values(selectedFrameworks)[0] || 'html';
            const fwDocs = {
              html: {
                step3: 'Copia el script y pégalo antes del cierre del tag </body> en tu archivo HTML',
                step3detail: 'Funciona en cualquier sitio estático, WordPress, Webflow, etc.',
                where: 'Pega el script antes del cierre del tag </body> en tu HTML',
                code: `<!-- Tu HTML -->\n<body>\n  ...\n\n  <!-- Pega aquí el script de VOIA -->\n</body>`,
              },
              react: {
                step3: 'Pega el código dentro de un useEffect en tu componente principal (App.jsx o LandingPage.jsx)',
                step3detail: 'El widget se carga una sola vez al montar el componente raíz.',
                where: 'Pega el código en el useEffect de tu componente principal',
                code: `import { useEffect } from 'react';\n\nexport default function App() {\n  useEffect(() => {\n    // Pega aquí el snippet de VOIA\n  }, []);\n  return <div>...</div>;\n}`,
              },
              angular: {
                step3: 'Pega el código en el método ngAfterViewInit() de tu AppComponent (app.component.ts)',
                step3detail: 'El widget se inicializa después de que Angular renderiza la vista.',
                where: 'Pega el código en ngAfterViewInit() de tu AppComponent',
                code: `import { AfterViewInit } from '@angular/core';\n\nexport class AppComponent implements AfterViewInit {\n  ngAfterViewInit() {\n    // Pega aquí el snippet de VOIA\n  }\n}`,
              },
              vue: {
                step3: 'Pega el código en el hook mounted() de tu componente raíz (Options API) o en onMounted() (Composition API)',
                step3detail: 'El widget se carga cuando el componente termina de montarse.',
                where: 'Pega el código en mounted() o onMounted() de tu componente raíz',
                code: `export default {\n  mounted() {\n    // Pega aquí el snippet de VOIA (Options API)\n  }\n}\n\n// Composition API:\nonMounted(() => {\n  // Pega aquí el snippet de VOIA\n});`,
              },
            };
            const doc = fwDocs[activeFramework] || fwDocs.html;

            return (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <SoftTypography variant="h6" gutterBottom>
                    📋 Cómo Integrar Tu Widget
                  </SoftTypography>
                  <SoftBox mb={3}>
                    <SoftBox p={2} sx={{ backgroundColor: '#f8fafc', borderRadius: '8px', mb: 2, border: '1px solid #e2e8f0' }}>
                      <SoftTypography variant="body2" fontWeight="bold" color="info" sx={{ mb: 1 }}>1️⃣ Configura la URL permitida</SoftTypography>
                      <SoftTypography variant="caption" color="text">Ingresa la URL exacta donde quieres usar el widget (ej: https://tusitio.com)</SoftTypography>
                    </SoftBox>
                    <SoftBox p={2} sx={{ backgroundColor: '#f0f9ff', borderRadius: '8px', mb: 2, border: '1px solid #bae6fd' }}>
                      <SoftTypography variant="body2" fontWeight="bold" color="info" sx={{ mb: 1 }}>2️⃣ Selecciona tu framework y genera el script</SoftTypography>
                      <SoftTypography variant="caption" color="text">Elige <strong>{activeFramework.toUpperCase()}</strong> y haz clic en el botón + para generar tu código personalizado</SoftTypography>
                    </SoftBox>
                    <SoftBox p={2} sx={{ backgroundColor: '#f0fff0', borderRadius: '8px', mb: 2, border: '1px solid #bbf7d0' }}>
                      <SoftTypography variant="body2" fontWeight="bold" color="success" sx={{ mb: 1 }}>3️⃣ Copia e integra</SoftTypography>
                      <SoftTypography variant="caption" color="text">{doc.step3}</SoftTypography>
                      <SoftTypography variant="caption" color="text" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>{doc.step3detail}</SoftTypography>
                    </SoftBox>
                    <SoftBox p={2} sx={{ backgroundColor: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                      <SoftTypography variant="body2" fontWeight="bold" color="warning" sx={{ mb: 1 }}>⚠️ Importante</SoftTypography>
                      <SoftTypography variant="caption" color="text">El widget solo funcionará en la URL que hayas configurado por seguridad</SoftTypography>
                    </SoftBox>
                  </SoftBox>
                </Grid>

                <Grid item xs={12} md={6}>
                  <SoftTypography variant="h6" gutterBottom>
                    📍 Dónde Pegar el Código
                    <SoftTypography component="span" variant="caption" color="info" ml={1}>({activeFramework.toUpperCase()})</SoftTypography>
                  </SoftTypography>
                  {activeFramework === 'html' ? (
                    <>
                      <img src={integracionWidgetImg} alt="Dónde pegar el script" style={{ width: "100%", borderRadius: "8px", border: "2px solid #e5e7eb" }} />
                      <SoftTypography variant="caption" color="text" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>{doc.where}</SoftTypography>
                    </>
                  ) : (
                    <Box sx={{ backgroundColor: '#1f2937', borderRadius: '8px', p: 2, border: '2px solid #374151' }}>
                      <Box component="pre" sx={{ color: '#e5e7eb', fontFamily: "'Fira Code', monospace", fontSize: '0.78rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {doc.code}
                      </Box>
                      <SoftTypography variant="caption" sx={{ color: '#9ca3af', mt: 1, display: 'block' }}>{doc.where}</SoftTypography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            );
          })()}
          <SoftBox mt={4} display="flex" justifyContent="flex-end" gap={2}>
            <SoftButton variant="outlined" color="error" sx={{ fontWeight: "bold", px: 3 }} onClick={() => navigate('/profile')}>
              Cancelar
            </SoftButton>
            <SoftButton variant="gradient" color="info" sx={{ fontWeight: "bold", px: 3 }} onClick={() => navigate('/profile')}>
              Finalizar
            </SoftButton>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotAdminDashboard;