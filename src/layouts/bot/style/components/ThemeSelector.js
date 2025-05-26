// src/layouts/bot/style/components/ThemeSelector.js
import React from "react";
import PropTypes from "prop-types";

import SoftSelect from "components/SoftSelect";
import MenuItem from "@mui/material/MenuItem";

function ThemeSelector({ theme, onChange }) {
  return (
    <SoftSelect
      label="Tema"
      value={theme}
      onChange={(e) => onChange(e.target.value)}
      color="dark"
      variant="outlined"
      size="small"
      sx={{ minWidth: 150 }}
    >
      <MenuItem value="light">Light</MenuItem>
      <MenuItem value="dark">Dark</MenuItem>
      <MenuItem value="custom">Custom</MenuItem>
    </SoftSelect>
  );
}

ThemeSelector.propTypes = {
  theme: PropTypes.oneOf(["light", "dark", "custom"]).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default ThemeSelector;
