import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from "@mui/material";
import { createConversationTag } from "services/conversationTagService";

const ConversationTagModal = ({ open, onClose, conversationId, onTagCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!title || !conversationId) return;

    const tagData = {
      conversationId,
      title,
      description,
    };

    const result = await createConversationTag(tagData);
    if (result) {
      if (onTagCreated) onTagCreated(result); // notificar al padre
      onClose(); // cerrar modal
    } else {
      alert("❌ Error al guardar la etiqueta.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Agregar etiqueta a la conversación</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle2" gutterBottom>
          Esta etiqueta se asociará al estado actual de la conversación.
        </Typography>
        <TextField
          label="Título"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="dense"
          required
        />
        <TextField
          label="Descripción (opcional)"
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="dense"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConversationTagModal;
