import { useState, useEffect } from "react";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import IaProviderCreateForm from "./components/IaProviderCreateForm";
import IaProviderUpdateForm from "./components/IaProviderUpdateForm";
import ModelConfigList from "./components/ModelConfigList";
import ModelConfigCreateForm from "./components/ModelConfigCreateForm";

import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Loader from "components/Loader";

import {
  getIaProviders,
  createIaProvider,
  updateIaProvider,
  deleteIaProvider,
} from "services/botIaProviderService";

import { Visibility, Edit, Delete, ArrowBack } from "@mui/icons-material";

function AIModelsConfig() {
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState("list");
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true);
        const data = await getIaProviders();
        setProviders(data);
      } catch (err) {
        console.error("Error cargando proveedores:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProviders();
  }, []);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
    setViewMode(newValue === 0 ? "list" : "create");
    setSelectedProvider(null);
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
      console.error("Error al editar proveedor:", err);
      alert("Error al editar proveedor.");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Seguro que quieres eliminar este proveedor?")) {
      try {
        await deleteIaProvider(id);
        const updated = await getIaProviders();
        setProviders(updated);
        alert("✅ Proveedor eliminado correctamente.");
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Error al eliminar proveedor.";
        console.error("Error al eliminar proveedor:", errorMessage);
        alert(errorMessage);
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
          Proveedores y Modelos de IA
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
              {isLoading ? (
                <Loader />
              ) : (
                providers.map((p) => (
                  <SoftBox
                    key={p.id}
                    p={2}
                    mb={2}
                    border="1px solid #ccc"
                    borderRadius="12px"
                    boxShadow="sm"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    bgcolor="white"
                  >
                    <SoftBox>
                      <SoftTypography variant="h6" fontWeight="bold">
                        {p.name}
                      </SoftTypography>
                      <SoftTypography variant="body2" color="text">
                        {p.apiEndpoint}
                      </SoftTypography>
                    </SoftBox>

                    <SoftBox display="flex" gap={1}>
                      <SoftButton
                        color="info"
                        variant="gradient"
                        size="medium"
                        onClick={() => handleView(p)}
                      >
                        <Visibility fontSize="medium" />
                      </SoftButton>
                      <SoftButton
                        color="success"
                        variant="outlined"
                        size="medium"
                        onClick={() => handleEditMode(p)}
                      >
                        <Edit fontSize="medium" />
                      </SoftButton>
                      <SoftButton
                        color="error"
                        variant="outlined"
                        size="medium"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Delete fontSize="medium" />
                      </SoftButton>
                    </SoftBox>
                  </SoftBox>
                ))
              )}
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
              onSubmit={() => setActiveTab(2)}
              onCancel={() => setActiveTab(2)}
            />
          )}

          {viewMode === "edit" && selectedProvider && activeTab === 0 && (
            <IaProviderUpdateForm
              initialData={selectedProvider}
              onSubmit={async (data) => {
                try {
                  await handleEdit(data);
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
            <SoftBox
              p={3}
              border="1px solid #ccc"
              borderRadius="12px"
              boxShadow="sm"
              bgcolor="white"
            >
              <SoftTypography variant="h5" fontWeight="bold" mb={2}>
                {selectedProvider.name}
              </SoftTypography>
              <SoftTypography mb={1}>
                Endpoint: {selectedProvider.apiEndpoint}
              </SoftTypography>
              <SoftTypography mb={1}>API Key: {selectedProvider.apiKey}</SoftTypography>
              <SoftBox mt={2}>
                <SoftButton variant="outlined" color="dark" onClick={handleBack}>
                  <ArrowBack sx={{ mr: 1 }} /> Volver
                </SoftButton>
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
