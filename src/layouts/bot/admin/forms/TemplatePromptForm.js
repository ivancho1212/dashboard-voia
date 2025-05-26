import { useState } from "react";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types"; 

function TemplatePromptForm({ botTemplateId, onSubmit }) {
  const [content, setContent] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Simulación de la respuesta como si viniera de un backend
    const fakeResponse = {
      id: Math.floor(Math.random() * 100000), // ID simulado
      botTemplateId,
      role: "system",
      content,
      createdAt: new Date().toISOString(),
    };

    onSubmit(fakeResponse); // Enviar datos simulados al componente padre

    // Limpiar el contenido del input después de guardar
    setContent("");
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2}>
      <SoftTypography variant="h6" mb={2}>
        Prompt Base del Bot
      </SoftTypography>

      <SoftInput
        placeholder="Prompt de sistema (rol 'system')"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        multiline
        rows={10}
        mb={2}
        required
      />

      <SoftButton type="submit" color="info" fullWidth>
        Guardar prompt
      </SoftButton>
    </SoftBox>
  );
}

TemplatePromptForm.propTypes = {
  botTemplateId: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default TemplatePromptForm;
