import React from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";

export default function SaveApplyButtons({ style }) {
  const handleSave = () => {
    // Aquí podrías guardar el estilo en backend o localStorage
    console.log("Guardar estilo:", style);
    alert("Estilo guardado!");
  };

  const handleApply = () => {
    // Aquí aplicas el estilo (quizás actualizar contexto o estado global)
    console.log("Aplicar estilo:", style);
    alert("Estilo aplicado!");
  };

  return (
    <SoftBox mt={4} display="flex" gap={2}>
      <SoftButton variant="contained" color="info" onClick={handleSave}>
        Guardar
      </SoftButton>
      <SoftButton variant="outlined" color="info" onClick={handleApply}>
        Aplicar
      </SoftButton>
    </SoftBox>
  );
}

SaveApplyButtons.propTypes = {
  style: PropTypes.object.isRequired,
};
