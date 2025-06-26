import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import { getIaProviders } from "services/botIaProviderService";
import { getModelConfigsByProvider } from "services/aiModelConfigService";
import { getStyleTemplates } from "services/styleTemplateService";

function IaProviderForm({ onSubmit }) {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [styles, setStyles] = useState([]);

  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [defaultStyleId, setDefaultStyleId] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await getIaProviders();
        setProviders(data);
      } catch (error) {
        console.error("Error al obtener proveedores:", error);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedProviderId) return;
      try {
        const data = await getModelConfigsByProvider(selectedProviderId);
        setModels(data);
      } catch (error) {
        console.error("Error al obtener modelos IA:", error);
      }
    };
    fetchModels();
  }, [selectedProviderId]);

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const data = await getStyleTemplates();
        setStyles(data);
      } catch (error) {
        console.error("Error al obtener estilos:", error);
      }
    };
    fetchStyles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProviderId || !selectedModelId || !name.trim()) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const newTemplate = {
      name: name.trim(),
      description: description.trim(),
      iaProviderId: parseInt(selectedProviderId, 10),
      aiModelConfigId: parseInt(selectedModelId, 10),
      defaultStyleId: defaultStyleId ? parseInt(defaultStyleId, 10) : null,
    };

    try {
      const response = await fetch("http://localhost:5006/api/bottemplates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTemplate),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear la plantilla.");
      }

      const data = await response.json();
      onSubmit(newTemplate, data);
    } catch (error) {
      console.error("Error al enviar datos:", error);
      alert("Error al crear la plantilla: " + error.message);
    }
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit}>

      {/* Proveedor IA */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Proveedor de IA
        </SoftTypography>
        <select
          name="provider"
          value={selectedProviderId}
          onChange={(e) => {
            setSelectedProviderId(e.target.value);
            setSelectedModelId("");
          }}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginTop: "6px",
          }}
        >
          <option value="">-- Selecciona un proveedor --</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </SoftBox>

      {/* Modelo IA */}
      {selectedProviderId && (
        <SoftBox mb={2}>
          <SoftTypography variant="caption" color="text">
            Modelo de IA
          </SoftTypography>
          <select
            name="model"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginTop: "6px",
            }}
          >
            <option value="">-- Selecciona un modelo --</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.modelName}
              </option>
            ))}
          </select>
        </SoftBox>
      )}

      {/* Nombre */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Nombre
        </SoftTypography>
        <SoftInput
          placeholder="Ej. Plantilla de atención"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
      </SoftBox>

      {/* Descripción */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Descripción
        </SoftTypography>
        <SoftInput
          placeholder="Describe la plantilla"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
        />
      </SoftBox>

      {/* Estilo por defecto */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Estilo por defecto (opcional)
        </SoftTypography>
        <select
          value={defaultStyleId}
          onChange={(e) =>
            setDefaultStyleId(e.target.value === "" ? null : e.target.value)
          }
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginTop: "6px",
          }}
        >
          <option value="">-- Selecciona un estilo --</option>
          {styles.map((style) => (
            <option key={style.id} value={style.id}>
              {style.name} ({style.theme})
            </option>
          ))}
        </select>
      </SoftBox>

      {/* Botón enviar */}
      <SoftBox mt={3} display="flex" justifyContent="flex-start" gap={2}>
        <SoftButton
          type="submit"
          color="info"
          variant="contained"
          disabled={!selectedProviderId || !selectedModelId || !name.trim()}
        >
          Crear Plantilla
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

IaProviderForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default IaProviderForm;
