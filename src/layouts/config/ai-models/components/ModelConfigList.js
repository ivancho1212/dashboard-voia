import { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Icon from "@mui/material/Icon";

function ModelConfigList() {
  const [modelConfigs, setModelConfigs] = useState([]);
  const [viewMode, setViewMode] = useState("list"); // list | edit | view | create
  const [selectedConfig, setSelectedConfig] = useState(null);

  // Simulación de carga inicial
  useEffect(() => {
    setModelConfigs([
      {
        id: 1,
        bot_id: 101,
        model_name: "gpt-4",
        temperature: 0.7,
        max_tokens: 512,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      },
      {
        id: 2,
        bot_id: 102,
        model_name: "gpt-3.5-turbo",
        temperature: 0.9,
        max_tokens: 1024,
        frequency_penalty: 0.1,
        presence_penalty: 0.3,
      },
    ]);
  }, []);

  const handleDelete = (id) => {
    if (confirm("¿Seguro que deseas eliminar esta configuración?")) {
      setModelConfigs((prev) => prev.filter((c) => c.id !== id));
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

  return (
    <SoftBox mt={5}>
      <SoftTypography variant="h4" fontWeight="bold" mb={3}>
        Configuraciones del Modelo IA
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
              <SoftTypography variant="h6">
                Modelo: {config.model_name}
              </SoftTypography>
              <SoftTypography variant="body2" color="text">
                Temp: {config.temperature} | Tokens: {config.max_tokens}
              </SoftTypography>
            </div>
            <div>
              <SoftButton
                size="small"
                color="info"
                onClick={() => handleView(config)}
              >
                Ver
              </SoftButton>{" "}
              <SoftButton
                size="small"
                color="warning"
                onClick={() => handleEdit(config)}
              >
                Editar
              </SoftButton>{" "}
              <SoftButton
                size="small"
                color="error"
                onClick={() => handleDelete(config.id)}
              >
                Eliminar
              </SoftButton>
            </div>
          </SoftBox>
        ))}

      {viewMode === "view" && selectedConfig && (
        <SoftBox>
          <SoftTypography variant="h5">
            {selectedConfig.model_name}
          </SoftTypography>
          <SoftTypography>Bot ID: {selectedConfig.bot_id}</SoftTypography>
          <SoftTypography>Temperature: {selectedConfig.temperature}</SoftTypography>
          <SoftTypography>Max Tokens: {selectedConfig.max_tokens}</SoftTypography>
          <SoftTypography>Frequency Penalty: {selectedConfig.frequency_penalty}</SoftTypography>
          <SoftTypography>Presence Penalty: {selectedConfig.presence_penalty}</SoftTypography>
          <SoftBox mt={2}>
            <SoftButton onClick={handleBack}>Volver</SoftButton>
          </SoftBox>
        </SoftBox>
      )}

      {viewMode === "edit" && selectedConfig && (
        <SoftBox>
          <SoftTypography variant="h5">Editar configuración</SoftTypography>
          {/* Aquí puedes incluir un formulario tipo <ModelConfigForm /> */}
          <SoftTypography mt={2}> (Formulario en construcción...) </SoftTypography>
          <SoftBox mt={2}>
            <SoftButton onClick={handleBack}>Cancelar</SoftButton>
          </SoftBox>
        </SoftBox>
      )}
    </SoftBox>
  );
}

export default ModelConfigList;
