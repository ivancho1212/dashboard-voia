import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { Visibility, Edit, Delete } from "@mui/icons-material";

function BotList({ bots, onViewBot, onEditBot, onDeleteBot, onCreateBot }) {
  return (
    <SoftBox mt={3}>
      {bots.map((bot) => (
        <SoftBox
          key={bot.id}
          py={1.5}
          px={2}
          mb={2}
          border="1px solid #ccc"
          borderRadius="12px"
          boxShadow="sm"
          bgcolor="white"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <SoftBox>
            <SoftTypography variant="h6" fontWeight="bold">
              Nombre: {bot.name}
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              Descripción: {bot.description || "Sin descripción"}
            </SoftTypography>
          </SoftBox>

          <SoftBox display="flex" gap={1}>
            <SoftButton
              color="info"
              variant="gradient"
              size="medium"
              onClick={() => onViewBot(bot)}
            >
              <Visibility fontSize="medium" />
            </SoftButton>
            <SoftButton
              color="success"
              variant="outlined"
              size="medium"
              onClick={() => onEditBot(bot)}
            >
              <Edit fontSize="medium" />
            </SoftButton>
            <SoftButton
              color="error"
              variant="outlined"
              size="medium"
              onClick={() => {
                if (window.confirm(`¿Eliminar bot "${bot.name}"?`)) {
                  onDeleteBot(bot);
                }
              }}
            >
              <Delete fontSize="medium" />
            </SoftButton>
          </SoftBox>
        </SoftBox>
      ))}
    </SoftBox>
  );
}

BotList.propTypes = {
  bots: PropTypes.array.isRequired,
  onViewBot: PropTypes.func.isRequired,
  onEditBot: PropTypes.func.isRequired,
  onDeleteBot: PropTypes.func.isRequired,
  onCreateBot: PropTypes.func.isRequired,
};

export default BotList;
