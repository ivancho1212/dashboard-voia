import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

function BotStylePage() {
  const { id: botId } = useParams();
  const userId = 45; // 🔵 ID fijo del usuario actual

  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("list");
  const [selectedStyle, setSelectedStyle] = useState(null);

  const [styles, setStyles] = useState([]);
  const [botStyleId, setBotStyleId] = useState(null);
  const [styleEditing, setStyleEditing] = useState(null);

  const defaultNewStyle = {
    user_id: userId,
    theme: "light",
    primary_color: "#000000",
    secondary_color: "#ffffff",
    font_family: "Arial",
    avatar_url: "",
    position: "bottom-right",
    custom_css: "",
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const botRes = await axios.get(`http://localhost:5006/api/Bots/${botId}`);
        const botStyleId = botRes.data.styleId;
        setBotStyleId(botStyleId);

        const userStylesRes = await getBotStylesByUser(userId);
        const userStyles = userStylesRes.data;

        let currentBotStyle = null;
        if (botStyleId && !userStyles.find((s) => s.id === botStyleId)) {
          const currentStyleRes = await getBotStyleById(botStyleId);
          currentBotStyle = currentStyleRes.data;
        }

        const combined = [...(currentBotStyle ? [currentBotStyle] : []), ...userStyles];
        const uniqueStyles = Array.from(new Map(combined.map((s) => [s.id, s])).values());

        setStyles(uniqueStyles);
      } catch (error) {
        console.error("Error al cargar estilos o datos del bot:", error);
      }
    }

    fetchData();
  }, [botId]);

  const onTabChange = (_, newVal) => {
    setActiveTab(newVal);
    if (newVal === 0) {
      setViewMode("list");
      setSelectedStyle(null);
      setStyleEditing(null);
    } else if (newVal === 1) {
      setViewMode("create");
      setSelectedStyle(null);
      setStyleEditing({ ...defaultNewStyle });
    }
  };

  const onViewStyle = (style) => {
    setSelectedStyle(style);
    setViewMode("view");
    setActiveTab(0);
  };

  const onBackToList = () => {
    setSelectedStyle(null);
    setStyleEditing(null);
    setViewMode("list");
    setActiveTab(0);
  };

  const onSaveNewStyle = async (newStyle) => {
    try {
      const response = await createBotStyle(newStyle);
      const created = response.data;

      await axios.put(`http://localhost:5006/api/Bots/${botId}`, {
        styleId: created.id,
      });

      setStyles([...styles, created]);
      setBotStyleId(created.id);
      onBackToList();
    } catch (error) {
      console.error("Error al crear y asociar estilo:", error);
    }
  };

  const onApplyStyle = async (styleId) => {
    try {
      const botRes = await axios.get(`http://localhost:5006/api/Bots/${botId}`);
      const updatedBot = { ...botRes.data, styleId };

      await axios.put(`http://localhost:5006/api/Bots/${botId}`, updatedBot);
      setBotStyleId(styleId);
      alert("Estilo aplicado al bot.");
    } catch (err) {
      console.error("Error al aplicar estilo al bot:", err);
    }
  };

  const currentBotStyle = styles.find((style) => style.id === botStyleId);
  const styleToPreview =
    viewMode === "edit" || viewMode === "create" ? styleEditing : selectedStyle || null;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        {/* Estilo actual aplicado */}
        {currentBotStyle && (
          <SoftBox mb={3}>
            <SoftTypography variant="h4" gutterBottom>
              Estilo actual aplicado al bot
            </SoftTypography>
            <StylePreview style={currentBotStyle} />
          </SoftBox>
        )}

        <Tabs value={activeTab} onChange={onTabChange}>
          <Tab label="Lista de Estilos" />
          <Tab label="Crear Estilo" />
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
                />
              )}
              {viewMode === "view" && selectedStyle && (
                <>
                  <SoftTypography variant="h6" gutterBottom>
                    Detalle del Estilo: {selectedStyle.name}
                  </SoftTypography>
                  <StylePreview style={selectedStyle} />
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

          {activeTab === 1 && viewMode === "create" && styleEditing && (
            <>
              <SoftTypography variant="h6" gutterBottom>
                Crear nuevo estilo personalizado
              </SoftTypography>
              <StyleEditor
                style={styleEditing}
                setStyle={setStyleEditing}
                setShowPreviewWidget={() => {}}
                botId={botId}
                userId={userId}
              />
            </>
          )}
        </SoftBox>

        {/* Preview adicional si estás editando o creando */}
        {styleToPreview && viewMode !== "list" && (
          <SoftBox mt={4} display="flex" gap={4} flexWrap="wrap" alignItems="flex-start">
            <SoftBox flex="1 1 40%" minWidth="300px">
              <StylePreview style={styleToPreview} />
            </SoftBox>
            <SoftBox flex="1 1 40%" minWidth="300px"></SoftBox>
          </SoftBox>
        )}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotStylePage;
