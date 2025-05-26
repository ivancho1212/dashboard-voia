import { useState } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import PropTypes from "prop-types";

function IaProviderCreateForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    api_endpoint: "",
    api_key: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2} shadow="sm" borderRadius="lg">
      <SoftTypography variant="h5" fontWeight="bold" mb={2}>
        Crear Conexión con Proveedor de IA
      </SoftTypography>

      <SoftBox mb={2}>
        <SoftTypography variant="caption" fontWeight="bold">
          Nombre del Proveedor
        </SoftTypography>
        <SoftInput
          name="name"
          placeholder="Ej. OpenAI, Anthropic"
          value={form.name}
          onChange={handleChange}
          required
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption" fontWeight="bold">
          Endpoint de API
        </SoftTypography>
        <SoftInput
          name="api_endpoint"
          placeholder="https://api.example.com"
          value={form.api_endpoint}
          onChange={handleChange}
          required
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption" fontWeight="bold">
          API Key
        </SoftTypography>
        <SoftInput
          name="api_key"
          placeholder="Tu API Key secreta"
          value={form.api_key}
          onChange={handleChange}
        />
      </SoftBox>

      <SoftBox display="flex" justifyContent="space-between" mt={3}>
        <SoftButton color="dark" type="submit">
          Guardar Proveedor
        </SoftButton>
        {onCancel && (
          <SoftButton color="secondary" onClick={onCancel}>
            Cancelar
          </SoftButton>
        )}
      </SoftBox>
    </SoftBox>
  );
}

IaProviderCreateForm.propTypes = {
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func,
  };

export default IaProviderCreateForm;
