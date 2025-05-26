import React from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Button from "@mui/material/Button";

function StyleList({ styles, onEdit, onDelete, onApply }) {
  if (!styles.length) return <SoftTypography>No hay estilos guardados</SoftTypography>;

  return (
    <SoftBox>
      {styles.map((style, idx) => (
        <SoftBox key={idx} mb={2} p={2} border="1px solid #ccc" borderRadius="8px">
          <SoftTypography variant="h6">{style.name || `Estilo #${idx + 1}`}</SoftTypography>
          <SoftTypography variant="body2">Tema: {style.theme}</SoftTypography>
          <SoftBox mt={1} display="flex" gap={1}>
            <Button variant="outlined" onClick={() => onEdit(style)}>Editar</Button>
            <Button variant="outlined" color="error" onClick={() => onDelete(style)}>Eliminar</Button>
            <Button variant="contained" onClick={() => onApply(style)}>Aplicar</Button>
          </SoftBox>
        </SoftBox>
      ))}
    </SoftBox>
  );
}

StyleList.propTypes = {
  styles: PropTypes.arrayOf(PropTypes.object).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
};

export default StyleList;
