import { useEffect, useState } from "react";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { useNavigate } from "react-router-dom";

import { getMyBot } from "services/botService";

function MyBotCard() {
  const [bot, setBot] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyBot()
      .then((data) => {
        setBot(Array.isArray(data) ? data[0] : data); // ajusta según tu API
      })
      .catch(() => setBot(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="bold" gutterBottom>
          Mi Bot Asociado
        </SoftTypography>

        {loading ? (
          <SoftTypography>Cargando bot...</SoftTypography>
        ) : !bot ? (
          <SoftBox textAlign="center">
            <SoftTypography variant="body1" gutterBottom>
              No tienes ningún bot asociado.
            </SoftTypography>
            <SoftButton
              variant="gradient"
              onClick={() => navigate("/bots")}
              sx={{
                background: "linear-gradient(135deg, #F0F8FF, #87CEFA)",
                color: "#003B73", // texto más oscuro para contraste
                fontWeight: "bold",
                "&:hover": {
                  background: "linear-gradient(135deg, #e6f2fb, #7ec8f5)",
                },
              }}
            >
              Crear Bot
            </SoftButton>
          </SoftBox>
        ) : (
          <>
            <SoftTypography variant="h5" gutterBottom>
              {bot.name}
            </SoftTypography>
            <SoftTypography variant="body2" color="text" gutterBottom>
              {bot.description || "Sin descripción"}
            </SoftTypography>
            <SoftTypography variant="body2" color="textSecondary">
              Estado: {bot.isActive ? "Activo" : "Inactivo"}
            </SoftTypography>
            <SoftButton
              variant="outlined"
              color="info"
              onClick={() => navigate(`/bots/settings?id=${bot.id}`)}
              sx={{ mt: 2 }}
            >
              Configurar Bot
            </SoftButton>
          </>
        )}
      </SoftBox>
    </Card>
  );
}

export default MyBotCard;
