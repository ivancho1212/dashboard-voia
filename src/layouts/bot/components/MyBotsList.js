
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { getBotsByUserId, deleteBot } from "services/botService";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DeleteIcon from "@mui/icons-material/Delete";

function MyBotsList({ userId }) {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBots();
    // eslint-disable-next-line
  }, [userId]);

  const loadBots = async () => {
    setLoading(true);
    try {
      const data = await getBotsByUserId(userId);
      setBots(data);
    } catch (error) {
      if (error.message && error.message.includes("No se encontraron bots")) {
        console.info("No se encontraron bots para el usuario (OK si es primer bot)");
      } else {
        alert("Error al cargar bots: " + (error.message || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (bot) => {
    const confirm = window.confirm(`¿Seguro que deseas eliminar el bot "${bot.name}"? Esta acción es irreversible.`);
    if (confirm) {
      try {
        await deleteBot(bot.id);
        setBots((prev) => prev.filter((b) => b.id !== bot.id));
        alert("Bot eliminado correctamente.");
      } catch (error) {
        alert("Error al eliminar el bot: " + (error.message || ""));
      }
    }
  };

  return (
    <SoftBox>
      <SoftTypography variant="h5" mb={2}>Mis Bots</SoftTypography>
      {loading ? (
        <SoftTypography>Cargando...</SoftTypography>
      ) : bots.length === 0 ? (
        <SoftTypography>No tienes bots creados.</SoftTypography>
      ) : (
        bots.map((bot) => (
          <SoftBox key={bot.id} display="flex" alignItems="center" mb={2}>
            <SoftTypography mr={2}>{bot.name}</SoftTypography>
            <SoftButton
              color="error"
              variant="outlined"
              size="small"
              onClick={() => handleDeleteBot(bot)}
              startIcon={<DeleteIcon />}
            >
              Eliminar
            </SoftButton>
          </SoftBox>
        ))
      )}
    </SoftBox>
  );
}

MyBotsList.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default MyBotsList;


MyBotsList.propTypes = {
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};
