import { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types";
import {
  getIaProviders,
  getIaModelsByProvider,
} from "services/botIaProviderService"; // ✅ Usamos solo getIaModelsByProvider

function IaProviderForm({ onSubmit }) {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  // Obtener proveedores al montar
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

  // Obtener modelos cuando cambia el proveedor seleccionado
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedProviderId) return;

      try {
        const data = await getIaModelsByProvider(selectedProviderId);
        setModels(data);
      } catch (error) {
        console.error("Error al obtener modelos IA:", error);
      }
    };

    fetchModels();
  }, [selectedProviderId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedProviderId && selectedModelId) {
      const provider = providers.find((p) => p.id === parseInt(selectedProviderId));
      const model = models.find((m) => m.id === parseInt(selectedModelId));

      if (provider && model) {
        onSubmit({ ...provider, selectedModel: model });
      }
    }
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2}>
      <SoftTypography variant="h6" mb={2}>
        Selecciona proveedor IA
      </SoftTypography>

      <select
        value={selectedProviderId}
        onChange={(e) => {
          setSelectedProviderId(e.target.value);
          setSelectedModelId("");
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
            {models.map((m) => (
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
