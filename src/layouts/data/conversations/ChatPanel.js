// ...importaciones...
import React, { useState } from "react";
import PropTypes from "prop-types";
import SoftTypography from "components/SoftTypography";
import Divider from "@mui/material/Divider";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import Controls from "./Controls";
import InputChat from "./InputChat";
import Chip from "@mui/material/Chip";

import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

function ChatPanel({
  messages = [],
  userName,
  isTyping,
  onToggleIA,
  iaPaused,
  onSendAdminMessage,
  onStatusChange,
  onBlock,
  status,
  blocked,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleChangeStatus = (newStatus) => {
    onStatusChange(newStatus);
    handleCloseMenu();
  };

  const handleToggleBlock = () => {
    onBlock(); // La función debe alternar bloqueado/desbloqueado
    handleCloseMenu();
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendAdminMessage(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <>
      {/* Header del chat */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <SoftTypography variant="h6">Chat con {userName}</SoftTypography>

        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title={`Estado: ${status}`}>
            <Chip
              label={status.toUpperCase()}
              color={
                status === "pendiente" ? "warning" : status === "resuelta" ? "success" : "info"
              }
              size="small"
              sx={{
                fontWeight: "bold",
                "& .MuiChip-label": {
                  color: "white !important",
                },
              }}
            />
          </Tooltip>

          {blocked && (
            <Tooltip title="Usuario bloqueado">
              <Chip label="Bloqueado" color="error" size="small" sx={{ fontWeight: "bold" }} />
            </Tooltip>
          )}

          <IconButton onClick={handleOpenMenu}>
            <MoreVertIcon />
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
            <MenuItem disabled>Estado actual: {status}</MenuItem>
            <MenuItem onClick={() => handleChangeStatus("pendiente")}>
              Marcar como Pendiente
            </MenuItem>
            <MenuItem onClick={() => handleChangeStatus("resuelta")}>Marcar como Resuelta</MenuItem>

            <Divider />

            <MenuItem onClick={handleToggleBlock}>
              {blocked ? "Desbloquear Usuario" : "Bloquear Usuario"}
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Mensajes */}
      <div
        style={{
          flexGrow: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          paddingRight: "10px",
        }}
      >
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} />
        ))}

        {isTyping && <TypingIndicator />}
      </div>

      {/* Input y controles */}
      {iaPaused && (
        <Box mt={2}>
          <InputChat
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onSend={handleSendMessage}
          />
        </Box>
      )}

      <Controls onToggle={onToggleIA} iaPaused={iaPaused} />
    </>
  );
}

ChatPanel.propTypes = {
  messages: PropTypes.array.isRequired,
  userName: PropTypes.string.isRequired,
  isTyping: PropTypes.bool.isRequired,
  onToggleIA: PropTypes.func.isRequired,
  iaPaused: PropTypes.bool.isRequired,
  onSendAdminMessage: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  blocked: PropTypes.bool.isRequired,
};

export default ChatPanel;
