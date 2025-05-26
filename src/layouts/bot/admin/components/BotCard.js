import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Card from "@mui/material/Card";

function BotCard({ bot, onView, onEdit }) {
  return (
    <Card>
      <SoftBox p={2}>
        <SoftTypography variant="h6">{bot.name}</SoftTypography>
        <SoftTypography variant="body2" color="text">
          {bot.description}
        </SoftTypography>
        <SoftBox mt={2} display="flex" gap={1}>
          <SoftButton size="small" onClick={() => onView(bot)}>Ver</SoftButton>
          <SoftButton size="small" onClick={() => onEdit(bot)} color="info">Editar</SoftButton>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

BotCard.propTypes = {
  bot: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default BotCard;
