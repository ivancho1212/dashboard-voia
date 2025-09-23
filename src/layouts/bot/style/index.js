import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { getBotStylesByUser, getBotStyleById, createBotStyle } from "services/botStylesService";

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

  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("list");
  const [selectedStyle, setSelectedStyle] = useState(null);

  const [styles, setStyles] = useState([]);
  const [botStyleId, setBotStyleId] = useState(null);
  const [styleEditing, setStyleEditing] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Cargando estilos...");

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
      const botStyleId = botRes.data.styleId;
      setBotStyleId(botStyleId);

      const userStyles = await getBotStylesByUser(user.id);

      let currentBotStyle = null;
      if (botStyleId && !userStyles.find((s) => s.id === botStyleId)) {
        currentBotStyle = await getBotStyleById(botStyleId);
      }

      const combined = [...(currentBotStyle ? [currentBotStyle] : []), ...userStyles];
      const uniqueStyles = Array.from(new Map(combined.map((s) => [s.id, s])).values());

      setStyles(uniqueStyles);
    } catch (error) {
      console.error("Error al cargar estilos o datos del bot:", error);
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
    try {
      setLoading(true);
      setLoadingMessage("Aplicando estilo al bot...");
      const botRes = await axios.get(`http://localhost:5006/api/Bots/${botId}`);
      const updatedBot = { ...botRes.data, styleId };

      await axios.put(`http://localhost:5006/api/Bots/${botId}`, updatedBot);
      setBotStyleId(styleId);

      alert("Estilo aplicado al bot.");
      await fetchBotAndStyles();
    } catch (err) {
      console.error("Error al aplicar estilo al bot:", err);
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
                  {viewMode === "list" && (
                    <StyleList
                      styles={styles}
                      botStyleId={botStyleId}
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
                      setShowPreviewWidget={() => {}}
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

      <Footer />
    </DashboardLayout>
  );
}

export default BotStylePage;
