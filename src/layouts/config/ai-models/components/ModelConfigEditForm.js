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

    onSave({
      id: initialData.id,
      modelName: form.modelName,
      temperature: parseFloat(form.temperature),
      frequencyPenalty: parseFloat(form.frequencyPenalty),
      presencePenalty: parseFloat(form.presencePenalty),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <SoftBox mb={2}>
        <SoftTypography variant="caption">Nombre del Modelo</SoftTypography>
        <SoftInput name="modelName" value={form.modelName} onChange={handleChange} required />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Temperatura</SoftTypography>
        <SoftInput
          type="number"
          step="0.01"
          name="temperature"
          value={form.temperature}
          onChange={handleChange}
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Frecuencia Penalty</SoftTypography>
        <SoftInput
          type="number"
          step="0.01"
          name="frequencyPenalty"
          value={form.frequencyPenalty}
          onChange={handleChange}
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Presencia Penalty</SoftTypography>
        <SoftInput
          type="number"
          step="0.01"
          name="presencePenalty"
          value={form.presencePenalty}
          onChange={handleChange}
        />
      </SoftBox>

      <SoftBox display="flex" gap={2}>
        <SoftButton type="submit" color="info">
          Guardar Cambios
        </SoftButton>
        <SoftButton color="secondary" onClick={onCancel}>
          Cancelar
        </SoftButton>
      </SoftBox>
    </form>
  );
}

ModelConfigEditForm.propTypes = {
  initialData: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ModelConfigEditForm;
