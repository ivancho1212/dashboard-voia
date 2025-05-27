import { useState, useEffect } from "react";
import axios from "axios";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types";

function IaProviderForm({ onSubmit }) {
  const [providers, setProviders] = useState([]);
  const [modelsByProvider, setModelsByProvider] = useState({});
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  useEffect(() => {
    // Simulación local de proveedores con modelos asociados
    const fakeProviders = [
      { id: 1, name: "OpenAI", apiEndpoint: "https://api.openai.com", apiKey: "openai-key" },
      { id: 2, name: "Anthropic", apiEndpoint: "https://api.anthropic.com", apiKey: "anthropic-key" },
    ];

    const fakeModels = {
      1: [ // OpenAI
        { id: "gpt-3.5", name: "GPT-3.5" },
        { id: "gpt-4", name: "GPT-4" },
      ],
      2: [ // Anthropic
        { id: "claude-2", name: "Claude 2" },
        { id: "claude-3", name: "Claude 3" },
      ],
    };

    setProviders(fakeProviders);
    setModelsByProvider(fakeModels);

    // Si luego quieres llamada real, puedes cargar modelos desde el backend al seleccionar un proveedor
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedProviderId && selectedModelId) {
      const provider = providers.find(p => p.id === parseInt(selectedProviderId));
      const model = modelsByProvider[selectedProviderId]?.find(m => m.id === selectedModelId);

      if (provider && model) {
        onSubmit({ ...provider, selectedModel: model });
      }
    }
  };

  const selectedModels = modelsByProvider[selectedProviderId] || [];

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2}>
      <SoftTypography variant="h6" mb={2}>
        Selecciona proveedor IA
      </SoftTypography>

      <select
        value={selectedProviderId}
        onChange={(e) => {
          setSelectedProviderId(e.target.value);
          setSelectedModelId(""); // Reinicia modelo al cambiar proveedor
        }}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      >
        <option value="">-- Selecciona un proveedor --</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {selectedProviderId && (
        <>
          <SoftTypography variant="subtitle2" mb={1}>
            Selecciona modelo
          </SoftTypography>

          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
          >
            <option value="">-- Selecciona un modelo --</option>
            {selectedModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </>
      )}

      <SoftButton
        type="submit"
        color="info"
        fullWidth
        mt={2}
        disabled={!selectedProviderId || !selectedModelId}
      >
        Continuar
      </SoftButton>
    </SoftBox>
  );
}

IaProviderForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default IaProviderForm;
