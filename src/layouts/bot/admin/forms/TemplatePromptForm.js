import { useState } from "react";
import axios from "axios";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types"; 

function TemplatePromptForm({ botTemplateId, onSubmit }) {
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await axios.post("/api/BotTemplatePrompts", {
      botTemplateId,
      role: "system",
      content,
    });

    onSubmit(res.data);
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2}>
      <SoftTypography variant="h6" mb={2}>Prompt Base del Bot</SoftTypography>

      <SoftInput
        placeholder="Prompt de sistema (rol 'system')"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        multiline
        rows={10}
        mb={2}
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
