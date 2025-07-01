import React from "react";
import PropTypes from "prop-types";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";

function Controls({ onToggle, iaPaused }) {
  return (
    <Box mt={2} display="flex" justifyContent="flex-end">
      <Button
        variant="contained"
        size="medium"
        onClick={onToggle}
        sx={{
          backgroundColor: iaPaused ? "info.main" : "info.dark",
          color: "#fff",
          "&:hover": {
            backgroundColor: iaPaused ? "info.dark" : "info.main",
          },
          fontWeight: "bold",
          px: 3,
          borderRadius: "8px",
          textTransform: "none",
        }}
      >
        {iaPaused ? "Reanudar IA" : "Pausar IA"}
      </Button>
    </Box>
  );
}

Controls.propTypes = {
  onToggle: PropTypes.func.isRequired,
  iaPaused: PropTypes.bool.isRequired,
};

export default Controls;
