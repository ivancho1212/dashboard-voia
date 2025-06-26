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
    status: "active",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      apiEndpoint: form.api_endpoint.trim(),
      apiKey: form.api_key.trim(),
      status: form.status,
    };

    if (!payload.name || !payload.apiEndpoint) {
      alert("Completa los campos requeridos.");
      return;
    }

    if (onSubmit) onSubmit(payload);
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit}>
      <SoftTypography variant="h5" mb={2}>
        Crear Conexión con Proveedor de IA
      </SoftTypography>

      {/* Nombre */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
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

      {/* Endpoint */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Endpoint de API
        </SoftTypography>
        <SoftInput
          name="api_endpoint"
          placeholder="https://api.ejemplo.com"
          value={form.api_endpoint}
          onChange={handleChange}
          required
        />
      </SoftBox>

      {/* API Key */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          API Key
        </SoftTypography>
        <SoftInput
          name="api_key"
          placeholder="Tu API Key secreta"
          value={form.api_key}
          onChange={handleChange}
        />
      </SoftBox>

      {/* Estado */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Estado
        </SoftTypography>
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginTop: "6px",
          }}
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </SoftBox>

      {/* Botones */}
      <SoftBox display="flex" justifyContent="flex-start" gap={2} mt={2}>
        <SoftButton variant="contained" color="info" type="submit">
          Guardar Proveedor
        </SoftButton>

        {onCancel && (
          <SoftButton
            variant="outlined"
            color="error"
            type="button"
            onClick={onCancel}
          >
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
