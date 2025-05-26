import { useState, useEffect } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import IaProviderCreateForm from "./components/IaProviderCreateForm";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import IaProviderForm from "layouts/bot/admin/forms/IaProviderForm";
import ModelConfigList from "./components/ModelConfigList";
import ModelConfigCreateForm from "./components/ModelConfigCreateForm";

function AIModelsConfig() {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("list"); // list | view | edit
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);

  // 🔁 Cargar datos (simulado por ahora)
  useEffect(() => {
    // Simulación inicial
    setProviders([
      { id: 1, name: "OpenAI", apiEndpoint: "https://api.openai.com", apiKey: "••••" },
      { id: 2, name: "IA Local", apiEndpoint: "http://localhost:3000", apiKey: "123456" },
    ]);
  }, []);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setViewMode(newValue === 0 ? "list" : "create");
    setSelectedProvider(null);
  };

  const handleCreate = (provider) => {
    setProviders((prev) => [...prev, { ...provider, id: Date.now() }]);
    setActiveTab(0);
    setViewMode("list");
  };

  const handleEdit = (updated) => {
    setProviders((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setViewMode("list");
    setSelectedProvider(null);
  };

  const handleDelete = (id) => {
    if (confirm("¿Seguro que quieres eliminar este proveedor?")) {
      setProviders((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleView = (provider) => {
    setSelectedProvider(provider);
    setViewMode("view");
  };

  const handleEditMode = (provider) => {
    setSelectedProvider(provider);
    setViewMode("edit");
  };

  const handleBack = () => {
    setSelectedProvider(null);
    setViewMode("list");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Proveedores de IA
        </SoftTypography>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Lista de Proveedores" />
          <Tab label="Nuevo Proveedor" />
          <Tab label="Lista de Modelos IA" />
          <Tab label="Nuevo Modelo IA" />
        </Tabs>

        <SoftBox mt={3}>
          {activeTab === 0 && viewMode === "list" && (
            <>
              {providers.map((p) => (
                <SoftBox
                  key={p.id}
                  p={2}
                  mb={2}
                  border="1px solid #ccc"
                  borderRadius="md"
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <div>
                    <SoftTypography variant="h6">{p.name}</SoftTypography>
                    <SoftTypography variant="body2" color="text">
                      {p.apiEndpoint}
                    </SoftTypography>
                  </div>
                  <div>
                    <SoftButton size="small" color="info" onClick={() => handleView(p)}>
                      Ver
                    </SoftButton>{" "}
                    <SoftButton size="small" color="warning" onClick={() => handleEditMode(p)}>
                      Editar
                    </SoftButton>{" "}
                    <SoftButton size="small" color="error" onClick={() => handleDelete(p.id)}>
                      Eliminar
                    </SoftButton>
                  </div>
                </SoftBox>
              ))}
            </>
          )}

          {activeTab === 1 && viewMode === "create" && (
            <IaProviderCreateForm
              onSubmit={(data) => {
                const newProvider = {
                  ...data,
                  id: Date.now(),
                  created_at: new Date().toISOString(),
                };
                setProviders([...providers, newProvider]);
                setViewMode("list");
                setActiveTab(0);
              }}
              onCancel={handleBack}
            />
          )}

          {activeTab === 2 && <ModelConfigList />}
          
          {activeTab === 3 && (
            <ModelConfigCreateForm
              onSubmit={(data) => {
                console.log("Modelo IA creado:", data);
                // Aquí podrías guardar el modelo o actualizar lista
                setActiveTab(2); // Vuelve al tab de lista de modelos IA
              }}
              onCancel={() => setActiveTab(2)}
            />
          )}

          {viewMode === "edit" && selectedProvider && activeTab === 0 && (
            <IaProviderForm
              onSubmit={(provider) => handleEdit({ ...selectedProvider, ...provider })}
              initialData={selectedProvider}
            />
          )}

          {viewMode === "view" && selectedProvider && activeTab === 0 && (
            <SoftBox>
              <SoftTypography variant="h5">{selectedProvider.name}</SoftTypography>
              <SoftTypography>Endpoint: {selectedProvider.apiEndpoint}</SoftTypography>
              <SoftTypography>API Key: {selectedProvider.apiKey}</SoftTypography>
              <SoftBox mt={2}>
                <SoftButton onClick={() => handleBack()}>Volver</SoftButton>
              </SoftBox>
            </SoftBox>
          )}
        </SoftBox>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AIModelsConfig;
