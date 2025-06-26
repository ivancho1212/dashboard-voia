import { useState } from "react";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types";
import { createBotTemplatePrompt } from "services/botTemplatePromptsService";

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
      BotTemplateId: botTemplateId,
      Role: "system",
      Content: content.trim(),
    };

    try {
      const response = await createBotTemplatePrompt(newPrompt);
      onSubmit(response.data);
      setContent("");
    } catch (error) {
      console.error("Error guardando prompt:", error);
      alert(
        "Error al guardar prompt: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit}>

      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Contenido del Prompt
        </SoftTypography>
        <SoftInput
          placeholder="Describe las instrucciones base para el bot..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          rows={8}
          fullWidth
          required
          disabled={loading}
        />
      </SoftBox>

      <SoftBox display="flex" justifyContent="flex-start" gap={2}>
        <SoftButton
          type="submit"
          color="info"
          variant="contained"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar Prompt"}
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

TemplatePromptForm.propTypes = {
  botTemplateId: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default TemplatePromptForm;
