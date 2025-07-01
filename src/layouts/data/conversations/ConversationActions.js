// src/layouts/data/conversations/ConversationActions.js
import React, { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PropTypes from "prop-types";

function ConversationActions({ onBlock, onStatusChange, blocked, currentStatus }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem disabled>Estado actual: {currentStatus}</MenuItem>
        <MenuItem
          onClick={() => {
            onStatusChange("pendiente");
            handleClose();
          }}
        >
          Marcar como Pendiente
        </MenuItem>
        <MenuItem
          onClick={() => {
            onStatusChange("resuelta");
            handleClose();
          }}
        >
          Marcar como Resuelta
        </MenuItem>
        <MenuItem
          onClick={() => {
            onBlock(); // Esto alterna bloqueado/desbloqueado
            handleClose();
          }}
        >
          {blocked ? "Desbloquear Usuario" : "Bloquear Usuario"}
        </MenuItem>
      </Menu>
    </>
  );
}

ConversationActions.propTypes = {
  onBlock: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  blocked: PropTypes.bool.isRequired,
  currentStatus: PropTypes.string.isRequired,
};

export default ConversationActions;
