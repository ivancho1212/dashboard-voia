// src/layouts/data/conversations/ConversationActions.js

import React, { useState, useCallback } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PropTypes from "prop-types";

function ConversationActions({ onBlock, onStatusChange, blocked, currentStatus }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const statusOptions = [
    { label: "Marcar como Pendiente", value: "pendiente" },
    { label: "Marcar como Resuelta", value: "resuelta" },
  ];

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <MoreVertIcon fontSize="small" />
      </IconButton>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem disabled>
          Estado actual: {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
        </MenuItem>

        {statusOptions.map((option) => (
          <MenuItem
            key={option.value}
            disabled={option.value === currentStatus}
            onClick={() => {
              onStatusChange(option.value);
              handleClose();
            }}
          >
            {option.label}
          </MenuItem>
        ))}

        <MenuItem
          onClick={() => {
            onBlock();
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
