import { useState } from "react";
import PropTypes from "prop-types";

// Material UI
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

// Soft UI Dashboard components
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";

// Servicio para crear bots
import { createBot } from "services/bots";

function BotCreate({ onCancel }) {
  const [bot, setBot] = useState({
    name: "",
    description: "",
    apiKey: "",
    modelUsed: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBot((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setBot((prev) => ({
      ...prev,
      isActive: checked,
    }));
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      await createBot(bot);
      if (onCancel) onCancel(); // cerrar formulario si existe la función
    } catch (error) {
      setError(error.message || "Error al crear el bot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ p: 4 }}>
      <SoftBox>
        <SoftTypography variant="h5" mb={2}>
          Crear un nuevo bot
        </SoftTypography>
        {error && (
          <SoftTypography color="error" mb={2}>
            {error}
          </SoftTypography>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <SoftInput
              name="name"
              placeholder="Nombre del bot"
              value={bot.name}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <SoftInput
              name="description"
              placeholder="Descripción"
              value={bot.description}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <SoftInput
              name="apiKey"
              placeholder="API Key"
              value={bot.apiKey}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <SoftInput
              name="modelUsed"
              placeholder="Modelo usado"
              value={bot.modelUsed}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={bot.isActive}
                  onChange={handleCheckboxChange}
                  color="info"
                />
              }
              label="Activo"
            />
          </Grid>
          <Grid item xs={12}>
            <SoftBox display="flex" gap={2}>
              <SoftButton
                variant="gradient"
                color="info"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Creando..." : "Crear Bot"}
              </SoftButton>
              <SoftButton
                variant="outlined"
                color="secondary"
                onClick={onCancel}
              >
                Cancelar
              </SoftButton>
            </SoftBox>
          </Grid>
        </Grid>
      </SoftBox>
    </Card>
  );
}

BotCreate.propTypes = {
  onCancel: PropTypes.func,
};

export default BotCreate;
