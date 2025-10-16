import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { getBotStylesByUser, getBotStyleById, createBotStyle } from "services/botStylesService";
import { getBotsByUserId, updateBotStyle } from "services/botService";


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

function BotStylePage() {
  const { id: botId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();

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
      console.log("🔹 fetchBotAndStyles: iniciando carga de datos para user:", user.id);

      const botRes = await axios.get(`http://localhost:5006/api/Bots/${botId}`);
      const botData = botRes.data;
      console.log("📌 Bot individual cargado:", botData);

      const botStyleId = botData.styleId ?? botData.style_id;
      setBotStyleId(botStyleId);

      // Obtener todos los bots del usuario
      const bots = await getBotsByUserId(user.id);
      console.log("📌 Bots obtenidos desde getBotsByUserId:", bots);

      setUserBots(bots);

      const userStyles = await getBotStylesByUser(user.id);
      console.log("📌 Estilos obtenidos:", userStyles);

      let currentBotStyle = null;
      if (botStyleId && !userStyles.find((s) => s.id === botStyleId)) {
        currentBotStyle = await getBotStyleById(botStyleId);
        console.log("📌 Estilo del bot actual cargado individualmente:", currentBotStyle);
      }

      const combined = [...(currentBotStyle ? [currentBotStyle] : []), ...userStyles];
      const uniqueStyles = Array.from(new Map(combined.map((s) => [s.id, s])).values());

      setStyles(uniqueStyles);

      console.log("✅ fetchBotAndStyles finalizó con éxito. Styles:", uniqueStyles);
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
        const response = await createBotStyle(newStyle);
        const created = response.data;

        await axios.put(`http://localhost:5006/api/Bots/${botId}`, {
          style_id: created.id,
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
    try {
      setLoading(true);
      setLoadingMessage("Preparando selección de bot...");

      // Obtener todos los bots del usuario
      let bots = await getBotsByUserId(user.id);
      console.log("📌 Bots desde getBotsByUserId:", bots);

      // Traer también el bot actual por ID
      const currentBot = await axios.get(`http://localhost:5006/api/Bots/${botId}`).then(res => res.data);
      console.log("📌 Bot actual:", currentBot);

      // Mergear y eliminar duplicados por ID
      const mergedBots = Array.from(new Map([...bots, currentBot].map(b => [b.id, b])).values());
      console.log("📌 Bots finales para mostrar en modal:", mergedBots);

      if (mergedBots.length === 0) {
        alert("No tienes bots disponibles para aplicar el estilo.");
        return;
      }

      if (mergedBots.length === 1) {
        await updateBotStyle(mergedBots[0].id, styleId);
        alert(`Estilo aplicado al bot "${mergedBots[0].name}".`);
        await fetchBotAndStyles();
        return;
      }

      // Mostrar todos los bots en el modal
      setSelectedBotForStyle({ styleId, userBots: mergedBots, selectedBotId: mergedBots[0].id });
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

      await axios.delete(`http://localhost:5006/api/BotStyles/${style.id}`);

      if (style.id === botStyleId) {
        await axios.put(`http://localhost:5006/api/Bots/${botId}`, { styleId: 1 });
        setBotStyleId(1);
      }

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
              <Tab label={viewMode === "edit" ? "Editar Estilo" : "Crear Estilo"} />
            </Tabs>

            <SoftBox mt={3}>
              {activeTab === 0 && (
                <>
                  {activeTab === 0 && viewMode === "list" && (
                    <StyleList
                      styles={styles}
                      botStyleId={botStyleId}
                      userBots={userBots}          // ✅ PASAR LOS BOTS
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

                      <StylePreview style={styleToPreview} />

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
                    />
                  ) : (
                    <SoftTypography variant="body2" color="text">
                      Cargando estilo...
                    </SoftTypography>
                  )}
                </>
              )}
            </SoftBox>

            {styleToPreview && viewMode !== "list" && (
              <SoftBox mt={4} display="flex" gap={4} flexWrap="wrap" alignItems="flex-start">
                <SoftBox flex="1 1 40%" minWidth="300px">
                  <StylePreview style={styleToPreview} />
                </SoftBox>
                <SoftBox flex="1 1 40%" minWidth="300px"></SoftBox>
              </SoftBox>
            )}
          </>
        )}
        {activeTab === 0 && viewMode === "list" && (
          <SoftBox mt={4} display="flex" justifyContent="flex-start">
            <SoftButton variant="gradient" color="info" onClick={handleContinue}>
              Continuar
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
              {selectedBotForStyle.userBots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

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
