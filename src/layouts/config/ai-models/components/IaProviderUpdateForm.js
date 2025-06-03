import { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import PropTypes from "prop-types";

function IaProviderUpdateForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    api_endpoint: "",
    api_key: "",
    status: "active",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        api_endpoint: initialData.apiEndpoint || "",
        api_key: initialData.apiKey || "",
        status: initialData.status || "active",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      id: initialData.id, // ⚠️ asegúrate de pasar el ID para que sepa a quién actualizar
      name: form.name,
      apiEndpoint: form.api_endpoint,
      apiKey: form.api_key,
      status: form.status,
    };

    if (onSubmit) onSubmit(payload);
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2} shadow="sm" borderRadius="lg">
      <SoftTypography variant="h5" fontWeight="bold" mb={2}>
        Editar Proveedor de IA
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

      <SoftBox mb={2}>
        <SoftTypography variant="caption" fontWeight="bold">
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
            fontSize: "14px",
          }}
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </SoftBox>

      <SoftBox display="flex" justifyContent="space-between" mt={3}>
        <SoftButton color="info" type="submit">
          Actualizar Proveedor
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

IaProviderUpdateForm.propTypes = {
  initialData: PropTypes.object.isRequired,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
};

export default IaProviderUpdateForm;
