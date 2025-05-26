import React, { useState } from "react";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import PropTypes from "prop-types";

function ModelConfigCreateForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    bot_id: "",
    model_name: "",
    temperature: "0.70",
    max_tokens: "512",
    frequency_penalty: "0.00",
    presence_penalty: "0.00",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <SoftBox mb={2}>
        <SoftTypography variant="caption">Bot ID</SoftTypography>
        <SoftInput name="bot_id" value={form.bot_id} onChange={handleChange} required />
      </SoftBox>
      <SoftBox mb={2}>
        <SoftTypography variant="caption">Nombre del Modelo</SoftTypography>
        <SoftInput name="model_name" value={form.model_name} onChange={handleChange} required />
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
        <SoftTypography variant="caption">Máx Tokens</SoftTypography>
        <SoftInput
          type="number"
          name="max_tokens"
          value={form.max_tokens}
          onChange={handleChange}
        />
      </SoftBox>
      <SoftBox mb={2}>
        <SoftTypography variant="caption">Frecuencia Penalty</SoftTypography>
        <SoftInput
          type="number"
          step="0.01"
          name="frequency_penalty"
          value={form.frequency_penalty}
          onChange={handleChange}
        />
      </SoftBox>
      <SoftBox mb={2}>
        <SoftTypography variant="caption">Presencia Penalty</SoftTypography>
        <SoftInput
          type="number"
          step="0.01"
          name="presence_penalty"
          value={form.presence_penalty}
          onChange={handleChange}
        />
      </SoftBox>

      <SoftBox display="flex" gap={2}>
        <SoftButton type="submit" color="info">
          Guardar Modelo
        </SoftButton>
        <SoftButton color="secondary" onClick={onCancel}>
          Cancelar
        </SoftButton>
      </SoftBox>
    </form>
  );
}

ModelConfigCreateForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ModelConfigCreateForm;
