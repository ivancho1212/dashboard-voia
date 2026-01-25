import { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { Visibility, Edit, Delete, ArrowBack } from "@mui/icons-material";
import {
  getModelConfigs,
  deleteModelConfig,
  updateModelConfig,
} from "services/aiModelConfigService";
import ModelConfigEditForm from "./ModelConfigEditForm";
import Loader from "components/Loader";

function ModelConfigList() {
  const [modelConfigs, setModelConfigs] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const data = await getModelConfigs();
        setModelConfigs(data);
      } catch (error) {
        console.error("Error al obtener configuraciones de IA:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfigs();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta configuración?")) {
      try {
        await deleteModelConfig(id);
        setModelConfigs((prev) => prev.filter((c) => c.id !== id));
        alert("✅ Configuración eliminada correctamente.");
      } catch (error) {
        const errorMessage = error.response?.data?.message || "No se pudo eliminar la configuración. Inténtalo de nuevo.";
        console.error("Error eliminando la configuración:", errorMessage);
        alert(errorMessage);
      }
    }
  };

  const handleView = (config) => {
    setSelectedConfig(config);
    setViewMode("view");
  };

  const handleEdit = (config) => {
    setSelectedConfig(config);
    setViewMode("edit");
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedConfig(null);
  };

  const handleSave = async (updatedData) => {
    try {
      await updateModelConfig(selectedConfig.id, updatedData);
      setModelConfigs((prev) =>
        prev.map((item) => (item.id === selectedConfig.id ? { ...item, ...updatedData } : item))
      );
      handleBack();
    } catch (error) {
      console.error("Error actualizando la configuración:", error);
      alert("No se pudo actualizar la configuración. Inténtalo de nuevo.");
    }
  };

  if (isLoading) {
    return (
      <SoftBox mt={5} display="flex" justifyContent="center" alignItems="center" height="200px">
        <Loader />
      </SoftBox>
    );
  }

  return (
    <SoftBox mt={3}>
      {viewMode === "list" &&
        modelConfigs.map((config) => (
          <SoftBox
            key={config.id}
            py={1.5}
            px={2}
            mb={2}
            border="1px solid #ccc"
            borderRadius="12px"
            boxShadow="sm"
            bgcolor="white"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <SoftBox>
              <SoftTypography variant="h6" fontWeight="bold">
                Modelo: {config.modelName}
              </SoftTypography>
              <SoftTypography variant="body2" color="text">
                Proveedor: {config.iaProviderName || "Desconocido"}
              </SoftTypography>
              <SoftTypography variant="body2" color="text">
                Temperature: {config.temperature} | Frequency Penalty: {config.frequencyPenalty} |
                Presence Penalty: {config.presencePenalty}
              </SoftTypography>
            </SoftBox>

            <SoftBox display="flex" gap={1}>
              <SoftButton
                color="info"
                variant="gradient"
                size="medium"
                onClick={() => handleView(config)}
              >
                <Visibility fontSize="medium" />
              </SoftButton>
              <SoftButton
                color="success"
                variant="outlined"
                size="medium"
                onClick={() => handleEdit(config)}
              >
                <Edit fontSize="medium" />
              </SoftButton>
              <SoftButton
                color="error"
                variant="outlined"
                size="medium"
                onClick={() => handleDelete(config.id)}
              >
                <Delete fontSize="medium" />
              </SoftButton>
            </SoftBox>
          </SoftBox>
        ))}

      {viewMode === "view" && selectedConfig && (
        <SoftBox
          p={2}
          borderRadius="12px"
          boxShadow="sm"
          border="1px solid #ccc"
          bgcolor="white"
        >
          <SoftTypography variant="h5" fontWeight="bold" mb={2}>
            {selectedConfig.modelName}
          </SoftTypography>
          <SoftTypography mb={1}>
            Proveedor: {selectedConfig.iaProviderName || "Desconocido"}
          </SoftTypography>
          <SoftTypography mb={1}>Temperatura: {selectedConfig.temperature}</SoftTypography>
          <SoftTypography mb={1}>
            Frequency Penalty: {selectedConfig.frequencyPenalty}
          </SoftTypography>
          <SoftTypography mb={1}>
            Presence Penalty: {selectedConfig.presencePenalty}
          </SoftTypography>
          <SoftTypography mb={2}>
            Creado: {new Date(selectedConfig.createdAt).toLocaleString()}
          </SoftTypography>

          <SoftButton variant="outlined" color="dark" onClick={handleBack}>
            <ArrowBack sx={{ mr: 1 }} /> Volver
          </SoftButton>
        </SoftBox>
      )}

      {viewMode === "edit" && selectedConfig && (
        <SoftBox
          p={2}
          borderRadius="12px"
          boxShadow="sm"
          border="1px solid #ccc"
          bgcolor="white"
        >
          <SoftTypography variant="h5" fontWeight="bold" mb={2}>
            Editar Modelo IA
          </SoftTypography>
          <ModelConfigEditForm
            initialData={selectedConfig}
            onSave={handleSave}
            onCancel={handleBack}
          />
        </SoftBox>
      )}
    </SoftBox>
  );
}

export default ModelConfigList;
