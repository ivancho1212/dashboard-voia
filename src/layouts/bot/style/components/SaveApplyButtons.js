import React, { useState } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import axios from "axios";

export default function SaveApplyButtons({ style, botId, userId, onStyleSaved }) {
  const [openModal, setOpenModal] = useState(false);
  const [styleName, setStyleName] = useState("");

  const handleSave = () => {
    setOpenModal(true);
  };

  const updateBotStyle = async (botId, styleId) => {
    try {
      const res = await axios.get(`http://localhost:5006/api/Bots/${botId}`);
      const bot = res.data;

      // Actualizamos solo el styleId, el backend necesita el objeto completo
      const updatedBot = { ...bot, styleId };

      await axios.put(`http://localhost:5006/api/Bots/${botId}`, updatedBot);
    } catch (err) {
      console.error("Error al actualizar estilo del bot:", err);
      throw err;
    }
  };

  const handleConfirmSave = async () => {
    if (!styleName.trim()) {
      alert("Por favor, ingresa un nombre para el estilo.");
      return;
    }

    const styleToSave = {
      userId, // ✅ ahora sí se enviará
      name: styleName,
      theme: style.theme,
      primaryColor: style.primary_color,
      secondaryColor: style.secondary_color,
      fontFamily: style.font_family,
      avatarUrl: style.avatar_url,
      position: style.position,
      customCss: style.custom_css,
    };
    

    try {
      const response = await axios.post("http://localhost:5006/api/BotStyles", styleToSave);
      const createdStyle = response.data;

      await updateBotStyle(botId, createdStyle.id);

      alert(`Estilo "${styleName}" guardado y aplicado al bot.`);
      setOpenModal(false);
      setStyleName("");

      if (onStyleSaved) onStyleSaved(createdStyle);
    } catch (error) {
      console.error("Error al guardar el estilo:", error);
      alert("Error al guardar el estilo. Revisa la consola.");
    }
  };

  const handleApply = async () => {
    try {
      await updateBotStyle(botId, style.id);
      alert("Estilo aplicado al bot.");
    } catch (error) {
      console.error("Error al aplicar el estilo:", error);
      alert("Error al aplicar el estilo.");
    }
  };

  return (
    <>
      <SoftBox mt={4} display="flex" gap={2}>
        <SoftButton variant="contained" color="info" onClick={handleSave}>
          Guardar
        </SoftButton>
        <SoftButton variant="outlined" color="info" onClick={handleApply}>
          Aplicar
        </SoftButton>
      </SoftBox>

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
  botId: PropTypes.number.isRequired,
  userId: PropTypes.number.isRequired, // ✅ aquí
  onStyleSaved: PropTypes.func,
};
