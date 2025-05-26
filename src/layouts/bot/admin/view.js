import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Card from "@mui/material/Card";

function ViewBot({ bot, onBack, onEdit }) {
  return (
    <Card>
      <SoftBox p={3}>
        <SoftTypography variant="h4" gutterBottom>{bot.name}</SoftTypography>
        <SoftTypography variant="body1" gutterBottom>{bot.description}</SoftTypography>
        <SoftTypography variant="body2" color="text">
          Estado: {bot.active ? "Activo" : "Inactivo"}
        </SoftTypography>
        <SoftBox mt={2} display="flex" gap={1}>
          <SoftButton onClick={onBack} color="secondary">Volver</SoftButton>
          <SoftButton onClick={() => onEdit(bot)} color="info">Editar</SoftButton>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

ViewBot.propTypes = {
  bot: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    active: PropTypes.bool,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default ViewBot;
