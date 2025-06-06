import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

function BotList({ bots, onViewBot, onEditBot, onDeleteBot, onCreateBot }) {
  return (
    <SoftBox mt={5}>
      <SoftTypography variant="h4" fontWeight="bold" mb={3}>
        Lista de Plantillas
      </SoftTypography>

      {bots.map((bot) => (
        <SoftBox
          key={bot.id}
          p={2}
          mb={2}
          border="1px solid #ddd"
          borderRadius="md"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <div>
            <SoftTypography variant="h6">Nombre: {bot.name}</SoftTypography>
            <SoftTypography variant="body2" color="text">
              Descripción: {bot.description || "Sin descripción"}
            </SoftTypography>
          </div>

          <div>
            <SoftButton size="small" color="info" onClick={() => onViewBot(bot)}>
              Ver
            </SoftButton>{" "}
            <SoftButton size="small" color="warning" onClick={() => onEditBot(bot)}>
              Editar
            </SoftButton>{" "}
            <SoftButton
              size="small"
              color="error"
              onClick={() => {
                if (window.confirm(`¿Eliminar bot "${bot.name}"?`)) {
                  onDeleteBot(bot);
                }
              }}
            >
              Eliminar
            </SoftButton>
          </div>
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
