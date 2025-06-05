import { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import {
  getModelConfigs,
  deleteModelConfig,
  updateModelConfig,
} from "services/aiModelConfigService";
import ModelConfigEditForm from "./ModelConfigEditForm";
import Loader from "components/Loader";

function ModelConfigList() {
  const [modelConfigs, setModelConfigs] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // list | edit | view | create
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
        setIsLoading(false); // cuando termina de cargar
      }
    };
    fetchConfigs();
  }, []);

  if (isLoading) {
    return (
      <SoftBox mt={5} display="flex" justifyContent="center" alignItems="center" height="200px">
        <Loader />
      </SoftBox>
    );
  }
  
  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar esta configuración?")) {
      try {
        await deleteModelConfig(id);
        setModelConfigs((prev) => prev.filter((c) => c.id !== id));
      } catch (error) {
        console.error("Error eliminando la configuración:", error);
        alert("No se pudo eliminar la configuración. Inténtalo de nuevo.");
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

  // Ejemplo función para guardar cambios (a adaptar cuando tengas el formulario)
  const handleSave = async (updatedData) => {
    try {
      await updateModelConfig(selectedConfig.id, updatedData);

      // Actualiza la lista local con los datos modificados
      setModelConfigs((prev) =>
        prev.map((item) => (item.id === selectedConfig.id ? { ...item, ...updatedData } : item))
      );
      setViewMode("list");
      setSelectedConfig(null);
    } catch (error) {
      console.error("Error actualizando la configuración:", error);
      alert("No se pudo actualizar la configuración. Inténtalo de nuevo.");
    }
  };

  return (
    <SoftBox mt={5}>
      <SoftTypography variant="h4" fontWeight="bold" mb={3}>
        Lista de Modelos
      </SoftTypography>

      {viewMode === "list" &&
        modelConfigs.map((config) => (
          <SoftBox
            key={config.id}
            p={2}
            mb={2}
            border="1px solid #ddd"
            borderRadius="md"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <div>
              <SoftTypography variant="h6">Modelo: {config.modelName}</SoftTypography>
              <SoftTypography variant="body2" color="text">
                Proveedor: {config.iaProviderName || "Desconocido"}
              </SoftTypography>

              <SoftTypography variant="body2" color="text">
                Temperature: {config.temperature} | Frequency Penalty: {config.frequencyPenalty} |
                Presence Penalty: {config.presencePenalty}
              </SoftTypography>
            </div>

            <div>
              <SoftButton size="small" color="info" onClick={() => handleView(config)}>
                Ver
              </SoftButton>{" "}
              <SoftButton size="small" color="warning" onClick={() => handleEdit(config)}>
                Editar
              </SoftButton>{" "}
              <SoftButton size="small" color="error" onClick={() => handleDelete(config.id)}>
                Eliminar
              </SoftButton>
            </div>
          </SoftBox>
        ))}

      {viewMode === "view" && selectedConfig && (
        <SoftBox>
          <SoftTypography variant="h5">{selectedConfig.modelName}</SoftTypography>
          <SoftTypography>Temperature: {selectedConfig.temperature}</SoftTypography>
          <SoftTypography>Frequency Penalty: {selectedConfig.frequencyPenalty}</SoftTypography>
          <SoftTypography>Presence Penalty: {selectedConfig.presencePenalty}</SoftTypography>
          <SoftTypography>
            Creado: {new Date(selectedConfig.createdAt).toLocaleString()}
          </SoftTypography>
          <SoftBox mt={2}>
            <SoftButton onClick={handleBack}>Volver</SoftButton>
          </SoftBox>
        </SoftBox>
      )}

      {viewMode === "edit" && selectedConfig && (
        <SoftBox>
          <SoftTypography variant="h5">Editar configuración</SoftTypography>
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
