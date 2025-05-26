// src/layouts/bot/style/index.js
import { useState } from "react";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

import StyleEditor from "./components/StyleEditor";
import StylePreview from "./components/StylePreview";

// Aquí asumo que crearás estos componentes
import StyleList from "./components/StyleList"; // lista de estilos
// Opcionalmente, StyleView si quieres modo solo vista
// import StyleView from "./components/StyleView";

function BotStylePage() {
  const [activeTab, setActiveTab] = useState(0); // 0 = lista, 1 = crear
  const [viewMode, setViewMode] = useState("list"); // "list", "view", "edit", "create"
  const [selectedStyle, setSelectedStyle] = useState(null);

  // Estado de estilos guardados
  const [styles, setStyles] = useState([
    {
      id: 1,
      name: "Estilo Oscuro",
      theme: "dark",
      primary_color: "#000000",
      secondary_color: "#ffffff",
      font_family: "Arial",
      avatar_url: "",
      position: "bottom-right",
      custom_css: "",
    },
    {
      id: 2,
      name: "Estilo Claro",
      theme: "light",
      primary_color: "#ffffff",
      secondary_color: "#000000",
      font_family: "Roboto",
      avatar_url: "",
      position: "top-left",
      custom_css: "",
    },
  ]);

  // El estilo que se está editando o creando (local temporal)
  const [styleEditing, setStyleEditing] = useState(null);

  // Cambiar tab (Lista <-> Crear)
  function onTabChange(_, newVal) {
    setActiveTab(newVal);
    if (newVal === 0) {
      setViewMode("list");
      setSelectedStyle(null);
      setStyleEditing(null);
    } else if (newVal === 1) {
      setViewMode("create");
      setSelectedStyle(null);
      setStyleEditing({
        name: "",
        theme: "light",
        primary_color: "#000000",
        secondary_color: "#ffffff",
        font_family: "Arial",
        avatar_url: "",
        position: "bottom-right",
        custom_css: "",
      });
    }
  }

  // Ver estilo (modo solo lectura, opcional)
  function onViewStyle(style) {
    setSelectedStyle(style);
    setViewMode("view");
    setActiveTab(0);
  }

  // Editar estilo
  function onEditStyle(style) {
    setSelectedStyle(style);
    setStyleEditing(style);
    setViewMode("edit");
    setActiveTab(0);
  }

  // Volver a lista
  function onBackToList() {
    setSelectedStyle(null);
    setStyleEditing(null);
    setViewMode("list");
    setActiveTab(0);
  }

  // Guardar nuevo estilo (crear)
  function onSaveNewStyle(newStyle) {
    const id = Math.max(0, ...styles.map((s) => s.id)) + 1;
    const styleToAdd = { ...newStyle, id };
    setStyles([...styles, styleToAdd]);
    setActiveTab(0);
    setViewMode("list");
    setSelectedStyle(null);
    setStyleEditing(null);
  }

  // Guardar edición
  function onSaveEditStyle(updatedStyle) {
    setStyles(styles.map((s) => (s.id === updatedStyle.id ? updatedStyle : s)));
    setViewMode("list");
    setSelectedStyle(null);
    setStyleEditing(null);
  }

  // Eliminar estilo
  function onDeleteStyle(id) {
    setStyles(styles.filter((s) => s.id !== id));
    if (selectedStyle?.id === id) {
      onBackToList();
    }
  }

  // Aplicar estilo (ejemplo: mostrar preview y botón aplicar)
  const styleToPreview =
    viewMode === "edit" || viewMode === "create" ? styleEditing : selectedStyle || styles[0];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Estilos del Widget de Chat
        </SoftTypography>

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
                  onViewStyle={onViewStyle}
                  onEditStyle={onEditStyle}
                  onDeleteStyle={onDeleteStyle}
                />
              )}
              {viewMode === "view" && selectedStyle && (
                <>
                  <SoftTypography variant="h6" gutterBottom>
                    Detalle del Estilo: {selectedStyle.name}
                  </SoftTypography>
                  {/* Aquí podrías reutilizar StyleEditor en modo solo lectura o crear StyleView */}
                  <StyleEditor
                    style={selectedStyle}
                    setStyle={() => {}}
                    setShowPreviewWidget={() => {}}
                  />
                  <SoftBox mt={2}>
                    <button onClick={onBackToList}>Volver a la lista</button>
                    <button onClick={() => onEditStyle(selectedStyle)}>Editar</button>
                  </SoftBox>
                </>
              )}
              {(viewMode === "edit" || viewMode === "create") && styleEditing && (
                <>
                  <StyleEditor
                    style={styleEditing}
                    setStyle={setStyleEditing}
                    setShowPreviewWidget={() => {}}
                  />
                  <SoftBox mt={2} display="flex" gap={2}>
                    <button
                      onClick={() => {
                        if (viewMode === "edit") onSaveEditStyle(styleEditing);
                        else if (viewMode === "create") onSaveNewStyle(styleEditing);
                      }}
                    >
                      Guardar
                    </button>
                    <button onClick={onBackToList}>Cancelar</button>
                  </SoftBox>
                </>
              )}
            </>
          )}
          {activeTab === 1 && viewMode === "create" && styleEditing && (
            <SoftBox
              mt={3}
              display="flex"
              justifyContent="center"
              alignItems="flex-start"
              width="100%"
            >
              <StyleEditor
                style={styleEditing}
                setStyle={setStyleEditing}
                setShowPreviewWidget={() => {}}
              />
            </SoftBox>
          )}
        </SoftBox>

        {/* Preview y aplicar estilo - Siempre visible para el estilo activo */}
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
