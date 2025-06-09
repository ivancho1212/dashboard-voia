import React, { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import PropTypes from "prop-types";
import { updateBotTemplate } from "services/botTemplateService";

function BotEdit({ bot, onBack }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    if (bot) {
      setForm({
        name: bot.name || "",
        description: bot.description || "",
      });
      setPrompts(bot.prompts || []); // se espera que vengan como arreglo
    }
  }, [bot]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePromptChange = (index, field, value) => {
    const updated = [...prompts];
    updated[index][field] = value;
    setPrompts(updated);
  };

  const handleSave = async () => {
  const payload = {
    name: form.name,
    description: form.description,
    prompts: prompts.map((p) => ({
      role: p.role,
      content: p.content,
    })),
  };

  console.log("Payload enviado:", payload);

  try {
    await updateBotTemplate(bot.id, payload);
    onBack();
  } catch (error) {
    console.error("Error al guardar cambios:", error);
  }
};


  return (
    <SoftBox>
      <SoftTypography variant="h5" mb={2}>
        Editar Plantilla
      </SoftTypography>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Nombre</SoftTypography>
        <SoftInput name="name" value={form.name} onChange={handleChange} />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography variant="caption">Descripción</SoftTypography>
        <SoftInput name="description" value={form.description} onChange={handleChange} />
      </SoftBox>

      <SoftTypography variant="subtitle2" mt={3} mb={1}>
        Prompts de la plantilla
      </SoftTypography>

      {prompts.map((prompt, index) => (
        <SoftBox key={prompt.id || index} mb={2}>
          <SoftTypography variant="caption">Contenido</SoftTypography>
          <SoftInput
            multiline
            value={prompt.content}
            onChange={(e) => handlePromptChange(index, "content", e.target.value)}
          />
        </SoftBox>
      ))}

      <SoftBox mt={3} display="flex" gap={2}>
        <SoftButton color="info" onClick={handleSave}>
          Guardar cambios
        </SoftButton>
        <SoftButton color="secondary" onClick={onBack}>
          Cancelar
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

BotEdit.propTypes = {
  bot: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
};

export default BotEdit;
