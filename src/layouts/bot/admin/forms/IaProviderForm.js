import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput"; // Asumo que SoftInput viene de ahí
import { getIaProviders } from "services/botIaProviderService";
import { getModelConfigsByProvider } from "services/aiModelConfigService";

function IaProviderForm({ onSubmit }) {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);

  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  // Nuevos campos del formulario
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultStyleId, setDefaultStyleId] = useState("");

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

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!selectedProviderId) {
    alert("Por favor selecciona un proveedor válido.");
    return;
  }
  if (!selectedModelId) {
    alert("Por favor selecciona un modelo válido.");
    return;
  }
  if (!name.trim()) {
    alert("Por favor ingresa un nombre para la plantilla.");
    return;
  }

  const newTemplate = {
    name: name.trim(),
    description: description.trim(),
    iaProviderId: parseInt(selectedProviderId, 10),
    aiModelConfigId: parseInt(selectedModelId, 10),
    defaultStyleId: defaultStyleId ? parseInt(defaultStyleId, 10) : null,
  };
  console.log("Enviando template:", newTemplate);

  try {
    const response = await fetch("http://localhost:5006/api/bottemplates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTemplate),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error al crear el template");
    }

    const data = await response.json();
    console.log("Plantilla creada:", data);
    onSubmit(data);
  } catch (error) {
    console.error("Error al enviar datos:", error);
    alert("Error al crear la plantilla: " + error.message);
  }
};


  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2} shadow="sm" borderRadius="lg">
      <SoftTypography variant="h5" fontWeight="bold" mb={2}>
        Crear Plantilla IA
      </SoftTypography>

      {/* Proveedor IA */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" fontWeight="bold">
          Proveedor de IA
        </SoftTypography>
        <select
          name="provider"
          value={selectedProviderId}
          onChange={(e) => {
            setSelectedProviderId(e.target.value);
            setSelectedModelId("");
          }}
          required
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "14px",
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
          <SoftTypography variant="caption" fontWeight="bold">
            Modelo de IA
          </SoftTypography>
          <select
            name="model"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
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

      {/* Nombre plantilla */}
      <SoftBox mb={2}>
        <SoftInput
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </SoftBox>

      {/* Descripción */}
      <SoftBox mb={2}>
        <SoftInput
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </SoftBox>

      {/* Estilo por defecto */}
      <SoftTypography variant="caption" mb={1}>
        Estilo por defecto (opcional)
      </SoftTypography>
      <select
        value={defaultStyleId}
        onChange={(e) => setDefaultStyleId(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #ccc",
          marginBottom: "16px",
        }}
      >
        <option value="">Seleccionar estilo</option>
        <option value="1">Tema Claro</option>
        <option value="2">Tema Oscuro</option>
      </select>

      {/* Botón enviar */}
      <SoftBox mt={3}>
        <SoftButton
          type="submit"
          color="info"
          fullWidth
          disabled={!selectedProviderId || !selectedModelId || !name.trim()}
        >
          Crear plantilla
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

IaProviderForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default IaProviderForm;
