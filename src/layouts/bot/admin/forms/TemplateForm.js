import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";

import {
  createBotTemplate,
  updateBotTemplate,
  getBotTemplateById,
} from "services/botTemplateService";

function TemplateForm({ onSubmit, iaProviderId, templateId }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [defaultStyleId, setDefaultStyleId] = useState("");
  const [selectedIaModelId, setSelectedIaModelId] = useState(null);
  const [iaModels, setIaModels] = useState([]);
  // Cargar datos para editar si hay templateId
  useEffect(() => {
    if (templateId) {
      getBotTemplateById(templateId)
        .then((template) => {
          setName(template.name);
          setDescription(template.description || "");
          setDefaultStyleId(template.defaultStyleId || "");
          setSelectedIaModelId(template.aiModelConfigId || null); // ✅ Nombre consistente
        })
        .catch((err) => {
          console.error("Error cargando plantilla:", err);
        });
    }
  }, [templateId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!iaProviderId) {
      console.error("iaProviderId inválido, no se puede enviar.");
      return;
    }

    const validModelId = selectedIaModelId > 0 ? selectedIaModelId : null;

    const payload = {
  name,
  description,
  defaultStyleId: defaultStyleId ? parseInt(defaultStyleId, 10) : null,
  iaProviderId,
};

if (selectedIaModelId > 0) {
  payload.aiModelConfigId = selectedIaModelId;
}


    console.log("Payload a enviar:", payload);

    try {
      let responseData;
      if (templateId) {
        responseData = await updateBotTemplate(templateId, payload);
        console.log("Plantilla actualizada:", responseData);
      } else {
        responseData = await createBotTemplate(payload);
        console.log("Plantilla creada:", responseData);
      }
      onSubmit(responseData);
    } catch (error) {
      console.error("Error guardando plantilla:", error);
    }
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2}>
      <SoftTypography variant="h6" mb={2}>
        {templateId ? "Editar plantilla de bot" : "Crear plantilla de bot"}
      </SoftTypography>

      <SoftBox mb={2}>
        <SoftInput
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftInput
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </SoftBox>

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
        <option value="1">Tema Claro</option>
        <option value="2">Tema Oscuro</option>
      </select>

      <SoftButton type="submit" color="info" fullWidth>
        {templateId ? "Actualizar plantilla" : "Crear plantilla"}
      </SoftButton>
    </SoftBox>
  );
}

TemplateForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  iaProviderId: PropTypes.number.isRequired,
  templateId: PropTypes.number,
};

export default TemplateForm;
