import { useState } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";

function TemplateForm({ onSubmit, iaProviderId }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultStyleId, setDefaultStyleId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name,
      description,
      ia_provider_id: iaProviderId,
      default_style_id: defaultStyleId || null,
    };

    onSubmit(payload);
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2}>
      <SoftTypography variant="h6" mb={2}>
        Crear plantilla de bot
      </SoftTypography>

      <SoftInput
        placeholder="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        mb={2}
        required
      />

      <SoftInput
        placeholder="Descripción"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        mb={2}
      />

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
        <option value="1">Estilo clásico</option>
        <option value="2">Estilo moderno</option>
      </select>

      <SoftButton type="submit" color="info" fullWidth>
        Crear plantilla
      </SoftButton>
    </SoftBox>
  );
}

TemplateForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  iaProviderId: PropTypes.number.isRequired,
};

export default TemplateForm;
