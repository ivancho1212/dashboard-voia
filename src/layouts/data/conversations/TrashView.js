import React from "react";
import { hasPermission } from "utils/permissions";
import PropTypes from "prop-types";
import { Box, Typography, IconButton, Button, List, ListItem, ListItemText } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

// Este componente espera props: conversations (array), onEmptyTrash (función), userId (string)
function TrashView({ conversations = [], onEmptyTrash, userId }) {
  const isAdmin = userId === "1";
  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" color="error" fontWeight="bold">
          Papelera de conversaciones
        </Typography>
        {isAdmin && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={onEmptyTrash}
          >
            Vaciar papelera
          </Button>
        )}
      </Box>
      <List>
        {conversations.length === 0 ? (
          <Typography color="text">No hay conversaciones en la papelera.</Typography>
        ) : (
          conversations.map((conv) => (
            <ListItem key={conv.id} divider>
              <ListItemText
                primary={conv.alias || `Usuario ${conv.id.slice(-4)}`}
                secondary={`Última actualización: ${conv.updatedAt}`}
              />
            </ListItem>
          ))
        )}
      </List>
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
  onEmptyTrash: PropTypes.func,
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default TrashView;
