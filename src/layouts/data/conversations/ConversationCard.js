import React from "react";
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
  return (
    <Card
      onClick={onClick}
      sx={{
        display: "flex",
        flexDirection: "column",
        borderLeft: `4px solid ${isActive ? "#1a73e8" : "#ccc"}`,
        boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
        borderRadius: "12px",
        mb: 0.6,
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        },
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ pb: 0.5 }}>
        <Typography variant="subtitle1" fontWeight="bold" noWrap title={userName}>
          {userName}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap title={lastMessage}>
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
        }}
      >
        <Chip
          label={isActive ? "Activa" : "Cerrada"}
          color={isActive ? "primary" : "default"}
          size="small"
        />
        <Typography variant="caption" color="text.secondary" noWrap>
          {formatDistanceToNow(new Date(updatedAt), {
            addSuffix: true,
            locale: es,
          })}
        </Typography>
        <ArrowForwardIcon fontSize="small" sx={{ ml: 1 }} />
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
