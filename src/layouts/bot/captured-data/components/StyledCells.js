import { styled } from "@mui/material/styles";
import TableCell from "@mui/material/TableCell";

// Celda de cabecera con estilo fijo
export const FixedCell = styled(TableCell)(({ theme, width }) => ({
  width: width || "auto",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  padding: theme.spacing(1),
  backgroundColor: "#f0f0f0",
  fontWeight: "bold",
}));

// Celda de cuerpo con estilo
export const BodyCell = styled(TableCell)(({ theme, width }) => ({
  width: width || "auto",
  textAlign: "center",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  padding: theme.spacing(1),
}));
