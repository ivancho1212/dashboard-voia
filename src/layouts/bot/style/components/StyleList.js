import React from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { Visibility, CheckCircle, PlayArrow } from "@mui/icons-material";

function StyleList({ styles, botStyleId, onViewStyle, onApplyStyle }) {
  if (!styles.length) return <SoftTypography>No hay estilos guardados</SoftTypography>;

  return (
    <SoftBox display="flex" flexDirection="column" gap={2}>
      {styles.map((style, idx) => {
        const isApplied = parseInt(style.id) === parseInt(botStyleId);

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
                  <SoftTypography component="span" variant="caption" color="success" ml={1}>
                    <CheckCircle fontSize="small" sx={{ verticalAlign: "middle" }} /> Aplicado
                  </SoftTypography>
                )}
              </SoftTypography>
              <SoftTypography variant="body2" color="text">
                Tema: {style.theme}
              </SoftTypography>
            </SoftBox>

            {/* Botones de acción */}
            <SoftBox display="flex" gap={1}>
              <SoftButton
                color="info"
                variant="gradient"
                size="small"
                onClick={() => onViewStyle(style)}
                sx={{
                  textTransform: "none",
                  px: 2,
                  py: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Visibility fontSize="small" />
                Ver
              </SoftButton>

              {!isApplied && (
                <SoftButton
                  color="success"
                  variant="outlined"
                  size="small"
                  onClick={() => onApplyStyle(style.id)}
                  sx={{
                    textTransform: "none",
                    px: 2,
                    py: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <PlayArrow fontSize="small" />
                  Aplicar
                </SoftButton>
              )}
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
  onViewStyle: PropTypes.func.isRequired,
  onApplyStyle: PropTypes.func.isRequired,
};

export default StyleList;
