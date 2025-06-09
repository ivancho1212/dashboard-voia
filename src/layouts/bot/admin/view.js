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

        {bot.prompts && bot.prompts.length > 0 && (
          <SoftBox mt={3}>
            <SoftTypography variant="h6" gutterBottom>Prompts de la plantilla:</SoftTypography>
            {bot.prompts.map((prompt, index) => (
              <SoftBox key={prompt.id || index} mb={2} p={2} borderRadius="lg" bgcolor="#f5f5f5">
                <SoftTypography variant="subtitle2" color="text">
                  Rol: <strong>{prompt.role}</strong>
                </SoftTypography>
                <SoftTypography variant="body2" color="textSecondary">
                  {prompt.content}
                </SoftTypography>
              </SoftBox>
            ))}
          </SoftBox>
        )}

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
    prompts: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        role: PropTypes.string,
        content: PropTypes.string,
      })
    )
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default ViewBot;
