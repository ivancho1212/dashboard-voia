import React, { useState, useEffect, useRef } from "react";
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
  conversationId, // ✅ obligatorio para enviar correctamente
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
  const bottomRef = useRef(null); // 👈 Referencia para hacer scroll automático

  const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);

  const handleChangeStatus = (newStatus) => {
    onStatusChange(newStatus);
    handleCloseMenu();
  };

  const handleToggleBlock = () => {
    onBlock();
    handleCloseMenu();
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendAdminMessage(inputValue.trim(), conversationId); // ✅ pasa el ID
      setInputValue("");
    }
  };

  // 🔁 Scroll automático al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Encabezado fijo */}
      <Box
        sx={{
          px: 2,
          pb: 2,
          borderBottom: "1px solid #eee",
          bgcolor: "white",
          zIndex: 1,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          height={20} // 👈 altura fija coherente
        >
          <SoftTypography
            variant="subtitle1" // 👈 un poco más compacto
            fontWeight="bold"
            noWrap
            sx={{ maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            Chat con {userName}
          </SoftTypography>

          <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
            <Tooltip title={`Estado: ${status}`}>
              <Chip
                label={status.toUpperCase()}
                color={
                  status === "pendiente" ? "warning" : status === "resuelta" ? "success" : "info"
                }
                size="small"
                sx={{
                  fontWeight: "bold",
                  height: 28, // 👈 altura fija para alinear
                  "& .MuiChip-label": {
                    color: "white !important",
                    px: 1,
                  },
                }}
              />
            </Tooltip>

            {blocked && (
              <Tooltip title="Usuario bloqueado">
                <Chip
                  label="Bloqueado"
                  color="error"
                  size="small"
                  sx={{ fontWeight: "bold", height: 28 }}
                />
              </Tooltip>
            )}

            <IconButton size="small" onClick={handleOpenMenu}>
              <MoreVertIcon fontSize="small" />
            </IconButton>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
              <MenuItem disabled>Estado actual: {status}</MenuItem>
              <MenuItem onClick={() => handleChangeStatus("pendiente")}>
                Marcar como Pendiente
              </MenuItem>
              <MenuItem onClick={() => handleChangeStatus("resuelta")}>
                Marcar como Resuelta
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleToggleBlock}>
                {blocked ? "Desbloquear Usuario" : "Bloquear Usuario"}
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>

      {/* ÁREA DE BURBUJAS SCROLLEABLE */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          minHeight: 0, // 🛑 Esto es CLAVE para que el scroll funcione dentro del flexbox
          bgcolor: "#f9f9f9",
        }}
      >
        {messages.map((msg, idx) => (
          <MessageBubble key={idx} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </Box>

      {/* Input fijo abajo */}
      <Box
        sx={{
          px: 2,
          pt: 1,
          pb: 2,
          borderTop: "1px solid #eee",
          bgcolor: "white",
          zIndex: 1,
        }}
      >
        {iaPaused && (
          <Box mb={1}>
            <InputChat
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onSend={handleSendMessage}
            />
          </Box>
        )}
        <Controls onToggle={onToggleIA} iaPaused={iaPaused} />
      </Box>
    </Box>
  );
}

ChatPanel.propTypes = {
  conversationId: PropTypes.number.isRequired, // ✅ nuevo prop obligatorio
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
