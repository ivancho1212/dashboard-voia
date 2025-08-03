import React, { useState } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import axios from "axios";

export default function SaveApplyButtons({
  style,
  botId,
  userId,
  onStyleSaved,
  onCancel,
  setLoading,
  setLoadingMessage,
}) {
  const [openModal, setOpenModal] = useState(false);
  const [styleName, setStyleName] = useState("");

  const isEditMode = !!style.id;

  const updateBotStyle = async (botId, styleId) => {
    try {
      const res = await axios.get(`http://localhost:5006/api/Bots/${botId}`);
      const bot = res.data;
      const updatedBot = { ...bot, styleId };
      await axios.put(`http://localhost:5006/api/Bots/${botId}`, updatedBot);
    } catch (err) {
      console.error("Error al actualizar estilo del bot:", err);
      alert("Error al aplicar el estilo al bot.");
    }
  };

  const saveStyle = async (styleData, isUpdate = false) => {
    const apiUrl = "http://localhost:5006/api/BotStyles";
    console.log("🚀 ENVIANDO AL BACKEND:", JSON.stringify(styleData, null, 2));

    try {
      setLoading(true);
      setLoadingMessage(isUpdate ? "Actualizando estilo..." : "Guardando nuevo estilo...");

      if (isUpdate) {
        await axios.put(`${apiUrl}/${style.id}`, styleData);
        alert("Estilo actualizado correctamente.");
        if (onStyleSaved) onStyleSaved({ ...style, ...styleData });
      } else {
        const response = await axios.post(apiUrl, styleData);
        const createdStyle = response.data;
        alert(`Estilo "${createdStyle.name}" guardado correctamente.`);
        if (onStyleSaved) onStyleSaved(createdStyle);
      }
    } catch (error) {
      console.error("Error al guardar el estilo:", error);
      alert("Error al guardar el estilo. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (isEditMode) {
      console.log("STYLE EN handleSave:", style); // 👈 agrega esto

      const updatedStyle = {
        userId,
        name: style.name,
        title: style.title || "",
        allowImageUpload: style.allowImageUpload,
        allowFileUpload: style.allowFileUpload,
        theme: style.theme,
        primaryColor: style.primary_color,
        secondaryColor: style.secondary_color,
        fontFamily: style.font_family,
        avatarUrl: style.avatar_url,
        position: style.position,
        customCss: style.custom_css,
        headerBackgroundColor: style.headerBackgroundColor, // ✅ AGREGA ESTO
      };

      saveStyle(updatedStyle, true);
    } else {
      setOpenModal(true);
    }
  };

  const handleConfirmSave = async () => {
    if (!styleName.trim()) {
      alert("Por favor, ingresa un nombre para el estilo.");
      return;
    }
    console.log("STYLE EN handleConfirmSave:", style); // 👈 agrega esto

    const newStyle = {
      userId,
      name: styleName,
      title: style.title || "",
      allowImageUpload: style.allowImageUpload ?? false,
      allowFileUpload: style.allowFileUpload ?? false,
      theme: style.theme,
      primaryColor: style.primary_color,
      secondaryColor: style.secondary_color,
      fontFamily: style.font_family,
      avatarUrl: style.avatar_url,
      position: style.position,
      customCss: style.custom_css,
      headerBackgroundColor: style.headerBackgroundColor, // ✅ AGREGA ESTO
    };

    await saveStyle(newStyle, false);
    setOpenModal(false);
    setStyleName("");
  };

  const handleApply = async () => {
    if (!style.id) {
      alert("Guarda primero el estilo antes de aplicarlo.");
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Aplicando estilo al bot...");
      await updateBotStyle(botId, style.id);
      alert("Estilo aplicado al bot.");
      if (onStyleSaved) await onStyleSaved();
    } catch (err) {
      console.error("Error al aplicar el estilo:", err);
      alert("Ocurrió un error al aplicar el estilo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SoftBox mt={4} display="flex" gap={2}>
        <SoftButton variant="contained" color="info" onClick={handleSave}>
          {isEditMode ? "Actualizar" : "Guardar"}
        </SoftButton>
        <SoftButton variant="outlined" color="info" onClick={handleApply} disabled={!style.id}>
          Aplicar
        </SoftButton>
        <SoftButton variant="outlined" color="error" onClick={onCancel}>
          Cancelar
        </SoftButton>
      </SoftBox>

      {/* Modal de nombre solo al crear */}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}
        >
          <SoftTypography variant="h6" mb={2}>
            Nombre del Estilo
          </SoftTypography>
          <SoftInput
            placeholder="Ej: Claro personalizado"
            value={styleName}
            onChange={(e) => setStyleName(e.target.value)}
            fullWidth
          />
          <SoftBox mt={2} display="flex" gap={2} justifyContent="flex-end">
            <SoftButton color="secondary" onClick={() => setOpenModal(false)}>
              Cancelar
            </SoftButton>
            <SoftButton color="info" onClick={handleConfirmSave}>
              Guardar
            </SoftButton>
          </SoftBox>
        </Box>
      </Modal>
    </>
  );
}

SaveApplyButtons.propTypes = {
  style: PropTypes.object.isRequired,
  botId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  userId: PropTypes.number.isRequired,
  onStyleSaved: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  setLoading: PropTypes.func.isRequired, // ✅ asegúrate que sean requeridos
  setLoadingMessage: PropTypes.func.isRequired, // ✅ asegúrate que sean requeridos
};
