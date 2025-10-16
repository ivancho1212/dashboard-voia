import React, { useMemo } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function ConversationCard({ userName, lastMessage, updatedAt, isActive, onClick }) {
  const timeAgo = useMemo(
    () =>
      formatDistanceToNow(new Date(updatedAt), {
        addSuffix: true,
        locale: es,
      }),
    [updatedAt]
  );

  return (
    <Card
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        borderLeft: `4px solid ${isActive ? "#1a73e8" : "#ccc"}`,
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        borderRadius: 2,
        mb: 0.75,
        cursor: "pointer",
        transition: "box-shadow 0.2s ease-in-out",
        maxWidth: "100%", // 👈 impide que se desborde del contenedor padre
        overflow: "hidden", // 👈 oculta contenido desbordado
        "&:hover": {
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent
        sx={{
          pb: 0.5,
          overflow: "hidden", // 👈 previene que los textos internos desborden
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          noWrap
          title={userName}
          sx={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {userName}
        </Typography>
        <Typography
          variant="body2"
          color="text"
          noWrap
          title={lastMessage}
          sx={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {lastMessage}
        </Typography>
      </CardContent>

      <Box
        sx={{
          px: 2,
          pb: 1,
          pt: 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "nowrap", // 👈 asegura que los elementos no se vayan hacia abajo
          overflow: "hidden", // 👈 oculta el desbordamiento horizontal
        }}
      >
        <Chip
          label={isActive ? "Activa" : "Cerrada"}
          color={isActive ? "primary" : "default"}
          size="small"
          sx={{ flexShrink: 0 }} // 👈 evita que el chip se comprima
        />
        <Typography
          variant="caption"
          color="text"
          noWrap
          sx={{ maxWidth: "100%", flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis" }}
        >
          {timeAgo}
        </Typography>
        <ArrowForwardIcon fontSize="small" sx={{ flexShrink: 0 }} />
      </Box>
    </Card>

  );
}

ConversationCard.propTypes = {
  userName: PropTypes.string.isRequired,
  lastMessage: PropTypes.string.isRequired,
  updatedAt: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ConversationCard;
