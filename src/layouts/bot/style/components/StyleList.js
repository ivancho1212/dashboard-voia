import React from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { Visibility, CheckCircle, PlayArrow, Edit, Delete } from "@mui/icons-material";

function StyleList({ styles, botStyleId, userBots, onViewStyle, onApplyStyle, onEditStyle, onDeleteStyle }) {
  if (!styles.length) return <SoftTypography>No hay estilos guardados.</SoftTypography>;

  return (
    <SoftBox display="flex" flexDirection="column" gap={2}>
      {styles.map((style, idx) => {
        const isApplied = userBots?.some(bot => bot.styleId === style.id); // cualquiera que tenga este estilo

        // Obtener los bots asignados a este estilo
        const assignedBots = userBots?.filter(bot => bot.styleId === style.id) || [];

        return (
          <SoftBox
            key={style.id || idx}
            p={2}
            border="1px solid #ccc"
            borderRadius="12px"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            bgcolor={isApplied ? "rgba(0, 200, 83, 0.05)" : "transparent"}
          >
            {/* Info del estilo */}
            <SoftBox>
              <SoftTypography variant="h6" fontWeight="bold">
                {style.name || `Estilo #${idx + 1}`}
                {isApplied && (
                  <SoftTypography component="span" variant="caption" color="info" ml={1}>
                    <CheckCircle fontSize="small" sx={{ verticalAlign: "middle" }} /> Aplicado
                  </SoftTypography>
                )}
              </SoftTypography>
              <SoftTypography variant="body2" color="text">
                Tema: {style.theme}
              </SoftTypography>
              {assignedBots.length > 0 && (
                <SoftTypography variant="body2" color="text">
                  Aplicado a: {assignedBots.map(bot => bot.name).join(", ")}
                </SoftTypography>
              )}
            </SoftBox>

            {/* Botones de acción */}
            <SoftBox display="flex" gap={1}>
              <SoftButton
                color="info"
                variant="gradient"
                size="medium"
                onClick={() => onViewStyle(style)}
              >
                <Visibility fontSize="medium" />
              </SoftButton>

              <SoftButton
                color="success"
                variant="outlined"
                size="medium"
                onClick={() => onEditStyle(style)}
              >
                <Edit fontSize="medium" />
              </SoftButton>

              <SoftButton
                color="error"
                variant="outlined"
                size="medium"
                onClick={() => onDeleteStyle(style)}
              >
                <Delete fontSize="medium" />
              </SoftButton>

              {/* Siempre mostrar aplicar, el modal permitirá seleccionar el bot */}
              <SoftButton
                color="info"
                variant="outlined"
                size="medium"
                onClick={() => onApplyStyle(style.id)}
              >
                <PlayArrow fontSize="medium" />
              </SoftButton>
            </SoftBox>
          </SoftBox>
        );
      })}
    </SoftBox>
  );
}

StyleList.propTypes = {
  styles: PropTypes.arrayOf(PropTypes.object).isRequired,
  botStyleId: PropTypes.number,
  userBots: PropTypes.arrayOf(PropTypes.object), // ✅ lista de bots del usuario
  onViewStyle: PropTypes.func.isRequired,
  onApplyStyle: PropTypes.func.isRequired,
  onEditStyle: PropTypes.func.isRequired,
  onDeleteStyle: PropTypes.func.isRequired,
};

export default StyleList;
