// @mui material components
import Select from "@mui/material/Select";
import { styled } from "@mui/material/styles";

export default styled(Select)(({ theme, ownerState }) => {
  const { palette, functions, borders } = theme;
  const { color, variant } = ownerState;

  // Puedes personalizar más estilos según props
  return {
    borderRadius: borders.borderRadius.md,
    backgroundColor: variant === "filled" ? palette.background.default : "transparent",
    color: palette[color]?.main || palette.text.primary,
    // Sombra y borde
    border: `1px solid ${palette[color]?.main || palette.divider}`,
    "&:hover": {
      borderColor: palette[color]?.dark || palette.primary.dark,
    },
    "& .MuiSelect-select": {
      padding: "10px 14px",
    },
  };
});
