import React, { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import PropTypes from "prop-types";

function ModelConfigEditForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState({
    modelName: initialData.modelName || "",
    temperature: initialData.temperature?.toString() || "0.70",
    frequencyPenalty: initialData.frequencyPenalty?.toString() || "0.00",
    presencePenalty: initialData.presencePenalty?.toString() || "0.00",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        modelName: initialData.modelName || "",
        temperature: initialData.temperature?.toString() || "0.70",
        frequencyPenalty: initialData.frequencyPenalty?.toString() || "0.00",
        presencePenalty: initialData.presencePenalty?.toString() || "0.00",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      id: initialData.id,
      modelName: form.modelName.trim(),
      temperature: parseFloat(form.temperature) || 0.7,
      frequencyPenalty: parseFloat(form.frequencyPenalty) || 0.0,
      presencePenalty: parseFloat(form.presencePenalty) || 0.0,
    };

    if (!payload.modelName) {
      alert("El nombre del modelo es obligatorio.");
      return;
    }

    onSave(payload);
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit}>

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
          required
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
        <SoftButton variant="contained" color="info" type="submit">
          Guardar Cambios
        </SoftButton>
        <SoftButton
          variant="outlined"
          color="error"
          type="button"
          onClick={onCancel}
        >
          Cancelar
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

ModelConfigEditForm.propTypes = {
  initialData: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ModelConfigEditForm;
