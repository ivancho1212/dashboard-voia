import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import PropTypes from "prop-types";

function MyBotCard({ template, onSelect, onBackToList }) {
  const isLight = template.styleMode === "light";
  const circleBgColor = isLight ? "#000" : "#fff";
  const circleTextColor = isLight ? "#fff" : "#000";

  return (
    <Card
      sx={{
        backgroundColor: "#fff", // fondo blanco
        borderRadius: "16px",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
        p: 4,
        maxWidth: 500,
        margin: "0 auto", // centra la card horizontalmente
      }}
    >
      <SoftBox mb={2} textAlign="center">
        <SoftTypography variant="h4" color="info" fontWeight="bold" sx={{ mb: 2 }}>
          {template.name}
        </SoftTypography>

        <SoftBox
          sx={{
            border: "1px solid",
            borderColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.25)",
            borderRadius: 2,
            p: 2,
            mb: 3,
            backgroundColor: isLight ? "#f8f9fa" : "rgba(255,255,255,0.08)",
            color: "text.primary",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            textAlign: "left",
          }}
        >
          {template.description}
        </SoftBox>

        {template.styleName && (
          <SoftBox mb={3} display="flex" alignItems="center" justifyContent="center" gap={1}>
            <SoftTypography variant="caption" fontWeight="medium">
              Estilo: <strong>{template.styleName}</strong>
            </SoftTypography>
           
          </SoftBox>
        )}

        <SoftBox mb={2} textAlign="left">
          <SoftTypography variant="caption" sx={{ opacity: 0.8 }}>
            Proveedor: <strong>{template.iaProviderName}</strong> | Modelo:{" "}
            <strong>{template.aiModelName}</strong>
          </SoftTypography>
        </SoftBox>

        <SoftBox mt={3} display="flex" justifyContent="center">
          <SoftButton
            variant="gradient"
            color="info"
            onClick={() => onSelect(template)}
            sx={{
              px: 4,
              py: 1.5,
              fontWeight: "bold",
              fontSize: "0.7rem",
              borderRadius: "12px",
              boxShadow: "0 3px 10px rgba(0, 123, 255, 0.2)",
            }}
          >
            Usar plantilla
          </SoftButton>
        </SoftBox>

      </SoftBox>
    </Card>
  );
}

MyBotCard.propTypes = {
  template: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
  onBackToList: PropTypes.func.isRequired,
};

export default MyBotCard;
