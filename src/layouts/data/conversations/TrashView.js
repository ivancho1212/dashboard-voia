import { useState } from "react";
import { useAuth } from "contexts/AuthContext";
import { hasPermission } from "utils/permissions";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  IconButton,
  Button,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import RestoreIcon from "@mui/icons-material/Restore";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";

function TrashView({ conversations = [], onRestore, onDelete, onEmptyTrash, onBack, onOpen }) {
  const { user } = useAuth();
  const canManageTrash = hasPermission(user, "CanDeleteConversations");

  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" px={2} pt={2} pb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Volver a conversaciones">
            <IconButton size="small" onClick={onBack}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography variant="subtitle1" fontWeight="bold" color="error.main">
            Papelera
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ({conversations.length})
          </Typography>
        </Box>
        {canManageTrash && conversations.length > 0 && (
          <Tooltip title="Vaciar papelera">
            <Button
              size="small"
              color="error"
              variant="outlined"
              startIcon={<DeleteIcon fontSize="small" />}
              onClick={() => setConfirmEmpty(true)}
              sx={{ fontSize: "11px", py: 0.3 }}
            >
              Vaciar
            </Button>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* List */}
      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pt: 1 }}>
        {conversations.length === 0 ? (
          <Box px={2} py={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              La papelera está vacía.
            </Typography>
          </Box>
        ) : (
          conversations.map((conv) => (
            <Box
              key={conv.id}
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 0.5,
                borderRadius: "10px",
                padding: "10px 12px",
                paddingLeft: "14px",
                border: "1.5px solid #e0e0e0",
                backgroundColor: "#fafafa",
                cursor: "pointer",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
              onClick={() => onOpen && onOpen(conv.id)}
            >
              {/* Text content */}
              <Box sx={{ flex: 1, minWidth: 0, mr: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  noWrap
                  sx={{ fontSize: "13px", color: "#333" }}
                >
                  {`Sesión ${conv.sessionNumber ?? conv.id}`}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: "block" }}
                >
                  {formatDate(conv.updatedAt)}
                </Typography>
              </Box>

              {/* Action icons */}
              <Box display="flex" alignItems="center" gap={0.5} onClick={(e) => e.stopPropagation()}>
                <Tooltip title="Restaurar conversación">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onRestore && onRestore(conv.id)}
                  >
                    <RestoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar definitivamente">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => setConfirmDelete(conv.id)}
                  >
                    <DeleteForeverIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Confirm: vaciar papelera */}
      <Dialog open={confirmEmpty} onClose={() => setConfirmEmpty(false)}>
        <DialogTitle>¿Vaciar papelera?</DialogTitle>
        <DialogContent>
          Todas las conversaciones en la papelera se eliminarán permanentemente. Esta acción no se puede deshacer.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmEmpty(false)}>Cancelar</Button>
          <Button
            color="error"
            onClick={() => {
              setConfirmEmpty(false);
              onEmptyTrash && onEmptyTrash();
            }}
          >
            Vaciar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm: eliminar una conversación */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>¿Eliminar permanentemente?</DialogTitle>
        <DialogContent>
          Esta conversación se eliminará de forma permanente y no podrá recuperarse.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button
            color="error"
            onClick={() => {
              const id = confirmDelete;
              setConfirmDelete(null);
              onDelete && onDelete(id);
            }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

TrashView.propTypes = {
  conversations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      alias: PropTypes.string,
      updatedAt: PropTypes.string,
    })
  ),
  onRestore: PropTypes.func,
  onDelete: PropTypes.func,
  onEmptyTrash: PropTypes.func,
  onBack: PropTypes.func,
  onOpen: PropTypes.func,
};

export default TrashView;
