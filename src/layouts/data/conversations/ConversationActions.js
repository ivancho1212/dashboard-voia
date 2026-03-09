// src/layouts/data/conversations/ConversationActions.js

import React, { useState, useCallback } from "react";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import PropTypes from "prop-types";
import { moveConversationToTrash } from "services/conversationsService";

function ConversationActions({ onBlock, onStatusChange, blocked, currentStatus, conversationId, onMovedToTrash }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

        <MenuItem
          onClick={() => {
            handleClose();
            setConfirmOpen(true);
          }}
        >
          Eliminar conversación
        </MenuItem>
      </Menu>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>¿Estás seguro?</DialogTitle>
        <DialogContent>¿Deseas eliminar esta conversación? Se moverá a la papelera.</DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">Cancelar</Button>
          <Button onClick={async () => {
            setConfirmOpen(false);
            const result = await moveConversationToTrash(conversationId);
            if (result !== null && onMovedToTrash) onMovedToTrash(conversationId);
          }} color="error">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

ConversationActions.propTypes = {
  onBlock: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  blocked: PropTypes.bool.isRequired,
  currentStatus: PropTypes.string.isRequired,
  conversationId: PropTypes.string.isRequired,
  onMovedToTrash: PropTypes.func,
};

export default ConversationActions;
