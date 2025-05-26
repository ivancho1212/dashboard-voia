import React, { useState } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftTypography from "components/SoftTypography";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";

export default function SaveApplyButtons({ style }) {
  const [openModal, setOpenModal] = useState(false);
  const [styleName, setStyleName] = useState("");

  const handleSave = () => {
    setOpenModal(true); // Abrir el modal para ingresar el nombre
  };

  const handleConfirmSave = () => {
    if (!styleName.trim()) {
      alert("Por favor, ingresa un nombre para el estilo.");
      return;
    }

    const styleToSave = {
      ...style,
      name: styleName,
    };

    console.log("Guardar estilo:", styleToSave);

    // Aquí puedes hacer un POST al backend (API REST)
    // Por ejemplo usando fetch o axios:
    /*
    fetch('/api/style-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(styleToSave),
    })
    .then(response => response.json())
    .then(data => console.log('Guardado:', data));
    */

    alert(`Estilo "${styleName}" guardado!`);
    setOpenModal(false);
    setStyleName("");
  };

  const handleApply = () => {
    console.log("Aplicar estilo:", style);
    alert("Estilo aplicado!");
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

      {/* Modal para ingresar nombre */}
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
};
