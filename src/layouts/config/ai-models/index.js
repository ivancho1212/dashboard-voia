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

import IaProviderUpdateForm from "./components/IaProviderUpdateForm";
import ModelConfigList from "./components/ModelConfigList";
import ModelConfigCreateForm from "./components/ModelConfigCreateForm";
import {
  getIaProviders,
  createIaProvider,
  updateIaProvider,
  deleteIaProvider,
} from "services/botIaProviderService";
function AIModelsConfig() {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("list"); // list | view | edit
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await getIaProviders();
        setProviders(data);
      } catch (err) {
        console.error("Error cargando proveedores:", err);
      }
    };

    fetchProviders();
  }, []);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setViewMode(newValue === 0 ? "list" : "create");
    setSelectedProvider(null);
  };

  const handleCreate = async (form) => {
    try {
      const payload = {
        Name: form.name,
        ApiEndpoint: form.api_endpoint,
        ApiKey: form.api_key,
      };

      const created = await createIaProvider(payload);
      console.log("Proveedor creado:", created);
      // ... tu lógica
    } catch (err) {
      console.error("Error al crear proveedor:", err.response?.data ?? err.message);
    }
  };

  const handleEdit = async (updated) => {
    try {
      const payload = {
        Name: updated.name,
        ApiEndpoint: updated.apiEndpoint,
        ApiKey: updated.apiKey,
        Status: updated.status || "active",
      };

      await updateIaProvider(updated.id, payload);
      const refreshed = await getIaProviders();
      setProviders(refreshed);
      setViewMode("list");
      setSelectedProvider(null);
    } catch (err) {
      console.error("Error al editar proveedor:", err.response?.data ?? err.message);
      alert("Error al editar proveedor.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Seguro que quieres eliminar este proveedor?")) {
      try {
        await deleteIaProvider(id);
        const updated = await getIaProviders();
        setProviders(updated);
      } catch (err) {
        console.error("Error al eliminar proveedor:", err.response?.data ?? err.message);
        alert("Error al eliminar proveedor.");
      }
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
              onSubmit={async (data) => {
                try {
                  await createIaProvider(data);
                  const updated = await getIaProviders();
                  setProviders(updated);
                  setViewMode("list");
                  setActiveTab(0);
                } catch (err) {
                  console.error("Error al crear proveedor:", err);
                  alert("Error al crear proveedor.");
                }
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
            <IaProviderUpdateForm
              initialData={selectedProvider}
              onSubmit={async (data) => {
                try {
                  await handleEdit(data); // <-- ya contiene el ID
                  setViewMode("list");
                  setSelectedProvider(null);
                  setActiveTab(0);
                } catch (err) {
                  console.error("Error al editar proveedor:", err);
                  alert("Error al editar proveedor.");
                }
              }}
              onCancel={handleBack}
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
