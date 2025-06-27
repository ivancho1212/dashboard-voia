import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import IconButton from "@mui/material/IconButton";
import PropTypes from "prop-types";
import { Tooltip } from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import PaletteIcon from "@mui/icons-material/Palette";
import MemoryIcon from "@mui/icons-material/Memory";
import CheckIcon from "@mui/icons-material/Check";

// Función para capitalizar texto
function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function MyBotCard({ template, onSelectTemplate }) {
  return (
    <Card
      sx={{
        backgroundColor: "#fff",
        borderRadius: "20px",
        padding: 3,
        boxShadow: "0px 10px 30px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        minHeight: 280,
        maxHeight: 330,
        transition: "box-shadow 0.3s ease-in-out, transform 0.3s ease-in-out",
        "&:hover": {
          boxShadow: "0 12px 25px rgba(0,0,0,0.1)",
          transform: "translateY(-4px)",
        },
      }}
    >
      {/* Título */}
      <SoftTypography
        variant="h5"
        fontWeight="bold"
        color="info"
        textAlign="center"
        mb={1}
      >
        {capitalizar(template.name)}
      </SoftTypography>

      {/* Descripción */}
      <SoftTypography
        variant="body2"
        sx={{
          color: "#7b809a",
          fontSize: "0.8rem",
          lineHeight: 1.4,
          maxHeight: "5.2em",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 4,
          WebkitBoxOrient: "vertical",
        }}
        textAlign="center"
      >
        {template.description}
      </SoftTypography>

      {/* Fila final: detalles técnicos + botón */}
      <SoftBox
        mt={3}
        display="flex"
        justifyContent="space-between"
        alignItems="flex-end"
      >
        {/* Info técnica a la izquierda */}
        <SoftBox textAlign="left">
          {template.iaProviderName && (
            <Tooltip title="Proveedor de IA">
              <SoftBox
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.7rem",
                  color: "#344767",
                  mb: 0.5,
                }}
              >
                <CloudIcon sx={{ fontSize: "1rem", mr: 1 }} />
                {capitalizar(template.iaProviderName)}
              </SoftBox>
            </Tooltip>
          )}
          {template.aiModelName && (
            <Tooltip title="Modelo de IA">
              <SoftBox
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.7rem",
                  color: "#344767",
                  mb: 0.5,
                }}
              >
                <MemoryIcon sx={{ fontSize: "1rem", mr: 1 }} />
                {capitalizar(template.aiModelName)}
              </SoftBox>
            </Tooltip>
          )}
          {template.styleName && (
            <Tooltip title="Estilo visual del bot">
              <SoftBox
                component="div"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.7rem",
                  color: "#344767",
                }}
              >
                <PaletteIcon sx={{ fontSize: "1rem", mr: 1 }} />
                {capitalizar(template.styleName)}
              </SoftBox>
            </Tooltip>
          )}
        </SoftBox>

        {/* Botón con tooltip */}
        <Tooltip title="Seleccionar este bot">
          <IconButton
            onClick={() => onSelectTemplate(template)}
            sx={{
              backgroundColor: "info.main",
              width: 60,
              height: 60,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 0,
              "&:hover": {
                backgroundColor: "info.dark",
                boxShadow: "0 0 10px rgba(0,0,0,0.4)",
              },
            }}
          >
            <CheckIcon sx={{ fontSize: "2.6rem", color: "#fff" }} />
          </IconButton>
        </Tooltip>
      </SoftBox>
    </Card>
  );
}

MyBotCard.propTypes = {
  template: PropTypes.object.isRequired,
  onSelectTemplate: PropTypes.func.isRequired,
};

export default MyBotCard;
