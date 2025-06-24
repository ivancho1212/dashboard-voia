// @mui material components
import Select from "@mui/material/Select";
import { styled } from "@mui/material/styles";

export default styled(Select)(({ theme, ownerState }) => {
  const { palette, borders } = theme;
  const { color = "info", variant = "outlined" } = ownerState;

  return {
    width: "100%",
    borderRadius: borders.borderRadius.md,
    backgroundColor:
      variant === "filled"
        ? palette.grey[100]
        : variant === "standard"
        ? "transparent"
        : palette.background.paper,
    color: palette.text.primary,

    "& .MuiSelect-select": {
      padding: "12px 14px",
      borderRadius: borders.borderRadius.md,
      display: "flex",
      alignItems: "center",
    },

    // Al pasar el mouse
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: palette[color]?.main,
    },

    // Al estar enfocado
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: palette[color]?.dark,
    },
  };
});
