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
      setPrompts(bot.prompts || []);
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
      name: form.name.trim(),
      description: form.description.trim(),
      prompts: prompts.map((p) => ({
        role: p.role,
        content: p.content,
      })),
    };


    try {
      await updateBotTemplate(bot.id, payload);
      onBack();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      alert("Error al guardar los cambios.");
    }
  };

  return (
    <SoftBox component="form">
      <SoftTypography variant="h5" mb={2}>
        Editar Plantilla
      </SoftTypography>

      {/* Nombre */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Nombre
        </SoftTypography>
        <SoftInput
          name="name"
          placeholder="Ej. Plantilla de Atención"
          value={form.name}
          onChange={handleChange}
          fullWidth
          required
        />
      </SoftBox>

      {/* Descripción */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Descripción
        </SoftTypography>
        <SoftInput
          name="description"
          placeholder="Describe brevemente la plantilla"
          value={form.description}
          onChange={handleChange}
          fullWidth
        />
      </SoftBox>

      {/* Prompts */}
      <SoftTypography variant="subtitle2" mt={3} mb={1}>
        Prompts de la plantilla
      </SoftTypography>

      {prompts.map((prompt, index) => (
        <SoftBox key={prompt.id || index} mb={2}>
          <SoftTypography variant="caption" color="text">
            Contenido del Prompt
          </SoftTypography>
          <SoftInput
            multiline
            placeholder="Escribe el contenido del prompt"
            value={prompt.content}
            onChange={(e) =>
              handlePromptChange(index, "content", e.target.value)
            }
            fullWidth
          />
        </SoftBox>
      ))}

      {/* Botones */}
      <SoftBox mt={3} display="flex" justifyContent="flex-start" gap={2}>
        <SoftButton variant="contained" color="info" onClick={handleSave}>
          Guardar Cambios
        </SoftButton>
        <SoftButton
          variant="outlined"
          color="error"
          type="button"
          onClick={onBack}
        >
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
