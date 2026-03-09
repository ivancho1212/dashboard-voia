import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import { getBotStylesByUser, getBotStyleById, createBotStyle } from "services/botStylesService";
import { getBotsByUserId, updateBotStyle } from "services/botService";
import { getBotDataCaptureFields } from "services/botDataCaptureService";


import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import StyleEditor from "./components/StyleEditor";
import StylePreview from "./components/StylePreview";
import StyleList from "./components/StyleList";

import Loader from "components/Loader";
import { useAuth } from "contexts/AuthContext";
import usePlanFeatures from "hooks/usePlanFeatures";
import { hasRole } from "services/authService";

const BASE_STYLES = [
  {
    id: "base-light",
    name: "Claro",
    theme: "light",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    font_family: "Arial",
    avatar_url: "",
    position: "bottom-right",
    custom_css: "",
    title: "",
    allow_image_upload: true,
    allow_file_upload: true,
    header_background_color: "#ffffff",
    isBase: true,
  },
  {
    id: "base-dark",
    name: "Oscuro",
    theme: "dark",
    primary_color: "#ffffff",
    secondary_color: "#1a1a1a",
    font_family: "Arial",
    avatar_url: "",
    position: "bottom-right",
    custom_css: "",
    title: "",
    allow_image_upload: true,
    allow_file_upload: true,
    header_background_color: "#1a1a1a",
    isBase: true,
  },
];

function BotStylePage() {
  const { id: botId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const { features: planFeatures } = usePlanFeatures();
  const isSuperAdmin = hasRole("Super Admin");

  // Protección: solo acceso por flujo guiado
  useEffect(() => {
    // Si no hay contexto válido (ejemplo: location.state.botId), redirige
    if (!location.state?.botId) {
      navigate("/bots", { replace: true });
    }
  }, [location, navigate]);

  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("list");
  const [selectedStyle, setSelectedStyle] = useState(null);

  const [styles, setStyles] = useState([]);
  const [ownStyles, setOwnStyles] = useState([]);
  const [botStyleId, setBotStyleId] = useState(null);
  const [styleEditing, setStyleEditing] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando estilos...");
  const [showBotSelectModal, setShowBotSelectModal] = useState(false);
  const [selectedBotForStyle, setSelectedBotForStyle] = useState(null);
  const [userBots, setUserBots] = useState([]);

  // Generar nuevo estilo dinámicamente
  const defaultNewStyle = (userId) => ({
    user_id: userId,
    theme: "light",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    font_family: "Arial",
    avatar_url: "",
    position: "bottom-right",
    custom_css: "",
    name: "",
    title: "",
    allow_image_upload: true,
    allow_file_upload: true,
    header_background_color: "#f5f5f5",
  });

  const fetchBotAndStyles = async () => {
    if (!user?.id) return;
    setLoading(true);
    setLoadingMessage("Cargando estilos...");
    try {

      const botRes = await axios.get(`http://localhost:5006/api/Bots/${botId}`);
      const botData = botRes.data;

      const botStyleId = botData.styleId ?? botData.style_id;
      setBotStyleId(botStyleId);

      // Obtener todos los bots del usuario
      const bots = await getBotsByUserId(user.id);

      setUserBots(bots);

      const userStyles = await getBotStylesByUser(user.id);

      let currentBotStyle = null;
      if (botStyleId && !userStyles.find((s) => s.id === botStyleId)) {
        currentBotStyle = await getBotStyleById(botStyleId);
      }

      const combined = [...(currentBotStyle ? [currentBotStyle] : []), ...userStyles];
      const uniqueStyles = Array.from(new Map(combined.map((s) => [s.id, s])).values());

      setOwnStyles(uniqueStyles);
      setStyles([...BASE_STYLES, ...uniqueStyles]);

    } catch (error) {
      console.error("❌ Error al cargar estilos o datos del bot:", error);
    } finally {
      setLoading(false);
    }
  };


  const normalizeStyle = (style) => ({
    id: style.id,
    user_id: style.userId ?? style.user_id,
    theme: style.theme,
    primary_color: style.primaryColor ?? style.primary_color,
    secondary_color: style.secondaryColor ?? style.secondary_color,
    font_family: style.fontFamily ?? style.font_family,
    avatar_url: style.avatarUrl ?? style.avatar_url ?? "",
    position: style.position,
    custom_css: style.customCss ?? style.custom_css ?? "",
    name: style.name ?? "",
    title: style.title ?? "",
    allow_image_upload: style.allowImageUpload ?? style.allow_image_upload ?? true,
    allow_file_upload: style.allowFileUpload ?? style.allow_file_upload ?? true,
    header_background_color:
      style.headerBackgroundColor ?? style.header_background_color ?? "#f5f5f5",
  });

  useEffect(() => {
    fetchBotAndStyles();
  }, [botId, user]);

  const onTabChange = (_, newVal) => {
    setActiveTab(newVal);
    if (newVal === 0) {
      setViewMode("list");
      setSelectedStyle(null);
      setStyleEditing(null);
    } else if (newVal === 1) {
      setViewMode("create");
      setSelectedStyle(null);
      setStyleEditing(user ? { ...defaultNewStyle(user.id) } : null);
    }
  };

  const onViewStyle = (style) => {
    setSelectedStyle(style);
    setViewMode("view");
    setActiveTab(0);
  };

  const onBackToList = async () => {
    setLoading(true);
    setLoadingMessage("Actualizando lista de estilos...");
    setSelectedStyle(null);
    setStyleEditing(null);
    setViewMode("list");
    setActiveTab(0);
    await fetchBotAndStyles();
    setLoading(false);
  };

  const onSaveNewStyle = async (newStyle) => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setLoadingMessage(viewMode === "edit" ? "Actualizando estilo..." : "Creando nuevo estilo...");

      if (viewMode === "edit") {
        await axios.put(`http://localhost:5006/api/BotStyles/${newStyle.id}`, newStyle);
        alert("Estilo actualizado con éxito.");
      } else {
        const created = await createBotStyle(newStyle);

        await axios.patch(`http://localhost:5006/api/Bots/${botId}/style`, {
          styleId: created.id,
        });

        setBotStyleId(created.id);
        alert("Nuevo estilo creado y aplicado.");
      }

      await fetchBotAndStyles();
      onBackToList();
    } catch (error) {
      console.error("Error al guardar estilo:", error);
    } finally {
      setLoading(false);
    }
  };

  const onApplyStyle = async (styleId) => {
    if (!user?.id) return;

    // Estilo base: crear copia en BD y aplicar directo al bot actual
    if (typeof styleId === "string" && styleId.startsWith("base-")) {
      const baseStyle = BASE_STYLES.find((s) => s.id === styleId);
      if (!baseStyle) return;
      try {
        setLoading(true);
        setLoadingMessage("Aplicando estilo base...");
        const created = await createBotStyle({
          userId: user.id,
          name: baseStyle.name,
          theme: baseStyle.theme,
          primaryColor: baseStyle.primary_color,
          secondaryColor: baseStyle.secondary_color,
          fontFamily: baseStyle.font_family,
          avatarUrl: baseStyle.avatar_url || "",
          position: baseStyle.position,
          customCss: baseStyle.custom_css || "",
          headerBackgroundColor: baseStyle.header_background_color,
          title: baseStyle.title || "",
          allowImageUpload: allowCustomTheme ? (baseStyle.allow_image_upload ?? true) : false,
          allowFileUpload: allowCustomTheme ? (baseStyle.allow_file_upload ?? true) : false,
        });
        await axios.patch(`http://localhost:5006/api/Bots/${botId}/style`, { styleId: created.id });
        setBotStyleId(created.id);
        await fetchBotAndStyles();
        // For free plan: open editor so user can set widget name and avatar
        if (!allowCustomTheme) {
          const normalized = normalizeStyle(created);
          setStyleEditing(normalized);
          setViewMode("edit");
          setActiveTab(1);
        } else {
          alert("Estilo base aplicado. Puedes personalizarlo desde Editar.");
        }
      } catch (err) {
        console.error("Error aplicando estilo base:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Preparando selección de bot...");

      // Obtener todos los bots del usuario
      let bots = await getBotsByUserId(user.id);

      // Traer también el bot actual por ID
      const currentBot = await axios.get(`http://localhost:5006/api/Bots/${botId}`).then(res => res.data);

      // Mergear y eliminar duplicados por ID
      const mergedBots = Array.from(new Map([...bots, currentBot].map(b => [b.id, b])).values());

      // Filtrar bots elegibles: usar primero la info que ya viene con los bots
      // para evitar N llamadas. Solo hacemos la comprobación por id si no hay datos.
      const eligible = [];
      const ineligible = [];
      for (const b of mergedBots) {
        // Condiciones rápidas de elegibilidad (si alguno aplica, considerarlo elegible):
        // - ya tiene styleId (ya fue asignado)
        // - tiene un flag explícito hasCapture === true
        // - está marcado como isReady (completó flujo)
        const sid = Number(b.styleId ?? b.style_id ?? b.StyleId ?? 0);
        if (!Number.isNaN(sid) && sid > 0) {
          eligible.push(b);
          continue;
        }
        if (b.hasCapture === true) {
          eligible.push(b);
          continue;
        }
        if (b.isReady === true) {
          eligible.push(b);
          continue;
        }

        // Fallback: si no tenemos indicios en el objeto del bot, consultar campos de captura
        try {
          const fields = await getBotDataCaptureFields(b.id);
          if (Array.isArray(fields) && fields.length > 0) eligible.push(b);
          else ineligible.push(b);
        } catch (err) {
          console.warn('No se pudo comprobar campos de captura para bot', b.id, err);
          ineligible.push(b);
        }
      }

      if (eligible.length === 0) {
        alert("Ninguno de tus bots ha completado la etapa de captura de datos. No es posible asignar este estilo todavía.");
        return;
      }

      // Mostrar modal para que el usuario confirme la asignación.
      // Mostrar solo los bots elegibles en el modal (el usuario debe confirmar).
      setSelectedBotForStyle({ styleId, userBots: eligible, selectedBotId: eligible[0].id, eligibleIds: eligible.map(b => b.id) });
      setShowBotSelectModal(true);
    } catch (err) {
      console.error("❌ Error al preparar la aplicación de estilo:", err);
    } finally {
      setLoading(false);
    }
  };


  const onEditStyle = (style) => {
    const normalizedStyle = normalizeStyle(style);
    setStyleEditing(normalizedStyle);
    setViewMode("edit");
    setActiveTab(1);
  };

  const onDeleteStyle = async (style) => {
    const confirmDelete = window.confirm(
      `¿Seguro que deseas eliminar el estilo "${style.name || `#${style.id}`}"?`
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setLoadingMessage("Eliminando estilo...");

      // If this style is currently applied to the bot, dissociate first (avoid FK constraint)
      if (style.id === botStyleId) {
        await axios.patch(`http://localhost:5006/api/Bots/${botId}/style`, { styleId: null });
        setBotStyleId(null);
      }

      await axios.delete(`http://localhost:5006/api/BotStyles/${style.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      await fetchBotAndStyles();
      alert("Estilo eliminado exitosamente.");
    } catch (error) {
      console.error("Error al eliminar estilo:", error);
    } finally {
      setLoading(false);
    }
  };

  const styleToPreview =
    viewMode === "edit" || viewMode === "create"
      ? styleEditing
      : selectedStyle
        ? normalizeStyle(selectedStyle)
        : null;

  const handleContinue = () => {
    navigate("/bots/integration");
  };

  // Plan FREE: only show Claro/Oscuro base themes — no custom styles visible
  const allowCustomTheme = isSuperAdmin || planFeatures.allowCustomTheme;
  const atStyleLimit = !allowCustomTheme && ownStyles.length >= 1;
  // Free plan: if a style is applied show only that style; otherwise show base themes (Claro/Oscuro)
  const appliedOwnStyle = botStyleId ? ownStyles.filter(s => s.id === botStyleId) : [];
  const displayedStyles = !allowCustomTheme
    ? (appliedOwnStyle.length > 0 ? appliedOwnStyle : BASE_STYLES)
    : styles;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        {loading ? (
          <Loader message={loadingMessage} />
        ) : (
          <>
            <Tabs value={activeTab} onChange={onTabChange}>
              <Tab label="Lista de Estilos" />
              <Tab
                label={viewMode === "edit" ? "Editar Estilo" : "Crear Estilo"}
                disabled={atStyleLimit && viewMode !== "edit"}
              />
            </Tabs>

            <SoftBox mt={3}>
              {activeTab === 0 && (
                <>
                  {activeTab === 0 && viewMode === "list" && atStyleLimit && allowCustomTheme && (
                    <SoftBox mb={2} p={1.5} sx={{ border: "1.5px dashed #f0a500", borderRadius: 2, backgroundColor: "#fffbf0", display: "flex", alignItems: "center", gap: 1 }}>
                      <span>🔒</span>
                      <SoftTypography variant="caption" color="warning" fontWeight="bold">
                        Has alcanzado el límite de 1 estilo de tu plan. Actualiza tu plan para crear más estilos.
                      </SoftTypography>
                    </SoftBox>
                  )}
                  {activeTab === 0 && viewMode === "list" && (
                    <StyleList
                      styles={displayedStyles}
                      botStyleId={botStyleId}
                      userBots={userBots}
                      allowCustomTheme={allowCustomTheme}
                      onViewStyle={onViewStyle}
                      onApplyStyle={onApplyStyle}
                      onEditStyle={onEditStyle}
                      onDeleteStyle={onDeleteStyle}
                    />
                  )}

                  {viewMode === "view" && selectedStyle && (
                    <>
                      <SoftTypography variant="h6" gutterBottom>
                        Vista previa del estilo: <strong>{selectedStyle.name}</strong>
                      </SoftTypography>

                      <SoftTypography variant="body2" color="text" mb={2}>
                        Este es el widget con los estilos aplicados. Puedes verlo flotando en la
                        pantalla según su posición configurada.
                      </SoftTypography>

                      <StylePreview style={styleToPreview} previewMode={true} />

                      <SoftBox mt={2}>
                        <SoftButton
                          onClick={onBackToList}
                          color="info"
                          variant="outlined"
                          size="small"
                        >
                          Volver a la lista
                        </SoftButton>
                      </SoftBox>
                    </>
                  )}
                </>
              )}

              {activeTab === 1 && (
                <>
                  <SoftTypography variant="h6" gutterBottom>
                    {viewMode === "edit" ? "Editar estilo" : "Crear nuevo estilo personalizado"}
                  </SoftTypography>

                  {styleEditing ? (
                    <StyleEditor
                      style={styleEditing}
                      setStyle={setStyleEditing}
                      setShowPreviewWidget={() => { }}
                      botId={botId}
                      userId={user?.id}
                      onCancel={onBackToList}
                      setLoading={setLoading}
                      setLoadingMessage={setLoadingMessage}
                      allowCustomTheme={allowCustomTheme}
                      allowWidgetUploads={allowCustomTheme}
                    />
                  ) : (
                    <SoftTypography variant="body2" color="text">
                      Cargando estilo...
                    </SoftTypography>
                  )}
                </>
              )}
            </SoftBox>

            {styleToPreview && (viewMode === "edit" || viewMode === "create") && (
              <SoftBox mt={4} display="flex" gap={4} flexWrap="wrap" alignItems="flex-start">
                <SoftBox flex="1 1 40%" minWidth="300px">
                  <StylePreview style={styleToPreview} previewMode={true} />
                </SoftBox>
                <SoftBox flex="1 1 40%" minWidth="300px"></SoftBox>
              </SoftBox>
            )}
          </>
        )}
        {activeTab === 0 && viewMode === "list" && (
          <SoftBox mt={4} display="flex" gap={2} justifyContent="flex-end">
            <SoftButton variant="outlined" color="error" sx={{ fontWeight: "bold", px: 3 }} onClick={() => navigate("/profile")}>
              Cancelar
            </SoftButton>
            <SoftButton variant="gradient" color="info" sx={{ fontWeight: "bold", px: 3 }} onClick={handleContinue}>
              Continuar al siguiente paso
            </SoftButton>
          </SoftBox>
        )}
      </SoftBox>

      {showBotSelectModal && selectedBotForStyle && (
        <SoftBox
          position="fixed"
          top={0}
          left={0}
          width="100%"
          height="100%"
          bgcolor="rgba(0, 0, 0, 0.26) !important" // fondo más oscuro para que se vea sólido
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={1500} // asegurarse que esté por encima de todo
        >
          <SoftBox
            bgcolor="white !important" // contenido del modal sólido
            borderRadius="12px"
            p={4}
            minWidth="300px"
            maxWidth="400px"
            boxShadow={6} // sombra más profunda para destacarlo
          >
            <SoftTypography variant="h6" mb={2}>
              Selecciona el bot para aplicar el estilo
            </SoftTypography>

              <select
                style={{ width: "100%", padding: "10px", marginBottom: "16px" }}
                onChange={(e) =>
                  setSelectedBotForStyle((prev) => ({ ...prev, selectedBotId: e.target.value }))
                }
                value={selectedBotForStyle.selectedBotId || ""}
              >
                <option value="" disabled>
                  -- Selecciona un bot --
                </option>
                {selectedBotForStyle.userBots.map((b) => {
                  const disabled = selectedBotForStyle.eligibleIds ? !selectedBotForStyle.eligibleIds.includes(b.id) : false;
                  return (
                    <option key={b.id} value={b.id} disabled={disabled} title={disabled ? 'Este bot no ha completado la etapa de captura de datos' : ''}>
                      {b.name}{disabled ? ' (no elegible aún)' : ''}
                    </option>
                  );
                })}
              </select>

              {selectedBotForStyle.userBots.some(b => !selectedBotForStyle.eligibleIds?.includes(b.id)) && (
                <SoftTypography variant="caption" color="text" sx={{ display: 'block', mb: 1 }}>
                  Algunos bots están deshabilitados porque no han completado la etapa de captación de datos.
                </SoftTypography>
              )}

            <SoftBox display="flex" justifyContent="flex-end" gap={1}>
              <SoftButton
                variant="gradient"
                color="info"
                onClick={async () => {
                  if (!selectedBotForStyle.selectedBotId) return;
                  setLoading(true);
                  setLoadingMessage("Aplicando estilo...");
                  await updateBotStyle(
                    Number(selectedBotForStyle.selectedBotId),
                    selectedBotForStyle.styleId
                  );
                  setShowBotSelectModal(false);
                  setSelectedBotForStyle(null);
                  await fetchBotAndStyles();
                  setLoading(false);
                  alert("Estilo aplicado correctamente.");
                }}
              >
                Aplicar
              </SoftButton>

              <SoftButton
                variant="outlined"
                color="secondary"
                onClick={() => {
                  setShowBotSelectModal(false);
                  setSelectedBotForStyle(null);
                }}
              >
                Cancelar
              </SoftButton>
            </SoftBox>
          </SoftBox>
        </SoftBox>
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default BotStylePage;
