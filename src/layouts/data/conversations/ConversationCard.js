import React from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
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
        p: 0, // menos padding
        mb: 0.4,
        cursor: "pointer",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      }}
    >
      <CardContent sx={{ pb: 0.5 }}>
        <Typography variant="subtitle1" fontWeight="bold" noWrap>
          {userName}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {lastMessage}
        </Typography>
      </CardContent>

      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pt: 0.2,
          pb: 0,
        }}
      >
        <Chip
          label={isActive ? "Activa" : "Cerrada"}
          color={isActive ? "primary" : "default"}
          size="small"
        />
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(updatedAt), {
            addSuffix: true,
            locale: es,
          })}
        </Typography>
        <ArrowForwardIcon fontSize="small" />
      </CardContent>
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
