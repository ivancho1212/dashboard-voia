import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

function Controls({ onToggle, iaPaused }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{
        minWidth: 80,
        px: 1,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          fontWeight: "bold",
          textAlign: "center",
          fontSize: "0.7rem",
          lineHeight: 1.2,
          mb: 0.3,
        }}
      >
        {iaPaused ? "Activa IA" : "Pausar IA"}
      </Typography>

      <Box
        sx={{
          transform: "scale(1.2)", // reduce visualmente el switch sin romper su animación
          transformOrigin: "center",
        }}
      >
        <Switch
          checked={!iaPaused}
          onChange={onToggle}
          color="info"
        />
      </Box>
    </Box>
  );
}

Controls.propTypes = {
  onToggle: PropTypes.func.isRequired,
  iaPaused: PropTypes.bool.isRequired,
};

export default Controls;
