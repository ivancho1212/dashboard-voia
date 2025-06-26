import React, { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import PropTypes from "prop-types";
import { getIaProviders } from "services/botIaProviderService";
import { createModelConfig } from "services/aiModelConfigService";

function ModelConfigCreateForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    modelName: "",
    temperature: "0.70",
    frequencyPenalty: "0.00",
    presencePenalty: "0.00",
    iaProviderId: "",
  });

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await getIaProviders();
        setProviders(data);
      } catch (error) {
        console.error("Error al cargar los proveedores IA:", error);
        alert("No se pudieron cargar los proveedores IA.");
      }
    };

    fetchProviders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      modelName: form.modelName.trim(),
      temperature: parseFloat(form.temperature) || 0.7,
      frequencyPenalty: parseFloat(form.frequencyPenalty) || 0.0,
      presencePenalty: parseFloat(form.presencePenalty) || 0.0,
      iaProviderId: parseInt(form.iaProviderId),
    };

    if (!payload.modelName || isNaN(payload.iaProviderId)) {
      alert("Completa todos los campos requeridos.");
      return;
    }

    try {
      setLoading(true);
      await createModelConfig(payload);
      onSubmit?.(payload);
    } catch (error) {
      console.error("Error al crear el modelo IA:", error);
      alert("Ocurrió un error al guardar el modelo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit}>
      <SoftTypography variant="h5" mb={2}>
        Crear Modelo IA
      </SoftTypography>

      {/* Proveedor IA */}
      <SoftBox mb={3}>
        <SoftTypography variant="caption" color="text">
          Proveedor de IA
        </SoftTypography>
        <select
          name="iaProviderId"
          value={form.iaProviderId}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginTop: "6px",
          }}
        >
          <option value="">Selecciona un proveedor IA</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>
      </SoftBox>

      {/* Nombre del Modelo */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Nombre del Modelo
        </SoftTypography>
        <SoftInput
          name="modelName"
          placeholder="Ej: GPT-4 Turbo"
          value={form.modelName}
          onChange={handleChange}
          fullWidth
        />
      </SoftBox>

      {/* Temperatura */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Temperatura (0.0 - 1.0)
        </SoftTypography>
        <SoftInput
          name="temperature"
          placeholder="Ej: 0.70"
          value={form.temperature}
          onChange={handleChange}
          type="number"
          step="0.01"
          fullWidth
        />
      </SoftBox>

      {/* Penalización por Frecuencia */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Penalización por Frecuencia (Frequency Penalty)
        </SoftTypography>
        <SoftInput
          name="frequencyPenalty"
          placeholder="Ej: 0.00"
          value={form.frequencyPenalty}
          onChange={handleChange}
          type="number"
          step="0.01"
          fullWidth
        />
      </SoftBox>

      {/* Penalización por Presencia */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Penalización por Presencia (Presence Penalty)
        </SoftTypography>
        <SoftInput
          name="presencePenalty"
          placeholder="Ej: 0.00"
          value={form.presencePenalty}
          onChange={handleChange}
          type="number"
          step="0.01"
          fullWidth
        />
      </SoftBox>

      {/* Botones */}
      <SoftBox display="flex" justifyContent="flex-start" gap={2} mt={2}>
        <SoftButton
          variant="contained"
          color="info"
          type="submit"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Modelo"}
        </SoftButton>

        <SoftButton
          variant="outlined"
          color="error"
          type="button"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

ModelConfigCreateForm.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
};

export default ModelConfigCreateForm;
