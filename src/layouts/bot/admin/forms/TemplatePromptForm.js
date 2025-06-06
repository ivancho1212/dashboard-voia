import { useState } from "react";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types";
import { createBotTemplatePrompt } from "services/botTemplatePromptsService";  // <--- Importas el servicio correcto

function TemplatePromptForm({ botTemplateId, onSubmit }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert("El prompt no puede estar vacío.");
      return;
    }

    setLoading(true);

    const newPrompt = {
      BotTemplateId: botTemplateId,   // el ID de la template
      Role: "system",                 // siempre 'system' en este form (puedes parametrizar luego)
      Content: content.trim(),        // el texto del prompt
    };

    try {
      // Usas el servicio con axios
      const response = await createBotTemplatePrompt(newPrompt);

      // response.data contiene el prompt guardado
      onSubmit(response.data);

      // Limpiar input para nuevo prompt
      setContent("");
    } catch (error) {
      console.error("Error guardando prompt:", error);
      alert("Error al guardar prompt: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
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
        disabled={loading}
      />

      <SoftButton type="submit" color="info" fullWidth disabled={loading}>
        {loading ? "Guardando..." : "Guardar prompt"}
      </SoftButton>
    </SoftBox>
  );
}

TemplatePromptForm.propTypes = {
  botTemplateId: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default TemplatePromptForm;
