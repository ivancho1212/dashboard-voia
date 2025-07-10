import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import SoftTypography from "components/SoftTypography";
import Divider from "@mui/material/Divider";
import MessageBubble from "./MessageBubble";
import Controls from "./Controls";
import InputChat from "./InputChat";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import connection from "../../../services/signalr";
import TypingIndicator from "./TypingIndicator";
import { CSSTransition } from "react-transition-group";
import { injectTypingAnimation } from "./typingAnimation";

function ChatPanel({
  conversationId,
  messages = [],
  userName,
  isTyping,
  typingSender,
  onToggleIA,
  iaPaused,
  onSendAdminMessage,
  onStatusChange,
  onBlock,
  status,
  blocked,
  replyTo,
  onReply,
  onCancelReply,
  messageRefs,
  onJumpToReply,
  highlightedMessageId,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef(null);
  const typingRef = useRef(null);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);
  const [isViewerOpen, setIsViewerOpen] = useState(false); // ← nuevo
  const lastMessageIdRef = useRef(null);
  const [hasNewMessageBelow, setHasNewMessageBelow] = useState(false);

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
      onSendAdminMessage(inputValue.trim(), conversationId);

      const adminMessage = {
        id: Date.now().toString(), // ✅ ID único (string)
        from: "admin",
        text: inputValue.trim(),
        timestamp: new Date().toISOString(),
        ...(replyTo ? { replyTo } : {}),
      };

      setInputValue("");

      if (onCancelReply) onCancelReply(); // limpia el estado después de enviar
    }
  };

  useEffect(() => {
    injectTypingAnimation();

    const container = document.getElementById("chat-container");
    if (!container) return;

    const atBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

    const lastMessage = messages[messages.length - 1];

    if (
      lastMessage &&
      lastMessage.id !== lastMessageIdRef.current &&
      lastMessage.from !== "admin" && // 👈 solo si NO es del admin
      !atBottom &&
      !isViewerOpen
    ) {
      setHasNewMessageBelow(true);
    }

    if (atBottom && !isViewerOpen) {
      setHasNewMessageBelow(false); // Oculta el aviso
      bottomRef.current?.scrollIntoView({ behavior: "smooth" }); // Scroll automático
    }

    lastMessageIdRef.current = lastMessage?.id; // Guarda referencia del último mensaje
  }, [messages, isTyping, isViewerOpen]);

  const handleInputChange = (text) => {
    setInputValue(text);
    if (text.trim()) {
      connection
        .invoke("Typing", conversationId, "admin")
        .catch((err) => console.error("❌ Error enviando Typing:", err));
    }
  };

  // ✅ Procesar archivos en mensajes con logs
  const processedMessages = messages.map((msg, i) => {
    console.log(`📩 Procesando mensaje[${i}]:`, msg);

    if (msg.multipleFiles && msg.multipleFiles.length > 0) {
      console.log(`📎 Mensaje[${i}] contiene archivos en multipleFiles:`, msg.multipleFiles);

      const files = msg.multipleFiles.map((file, index) => {
        console.log(`🔍 Archivo[${index}] en mensaje[${i}]:`, file);

        try {
          const byteCharacters = atob(file.fileContent);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: file.fileType });
          const url = URL.createObjectURL(blob);

          const processedFile = {
            ...file,
            url,
          };

          console.log(`✅ Archivo[${index}] procesado con URL:`, processedFile);
          return processedFile;
        } catch (error) {
          console.error(`❌ Error procesando archivo[${index}] en mensaje[${i}]:`, error);
          return file; // Retornar sin URL para que el render lo omita o lo maneje
        }
      });

      return {
        ...msg,
        files: files.length > 0 ? files : undefined,
        multipleFiles: undefined, // opcional: evita confusión
      };
    }

    return msg;
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* ENCABEZADO */}
      <Box sx={{ px: 2, pb: 2, borderBottom: "1px solid #eee", bgcolor: "white", zIndex: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" height={25}>
          <SoftTypography
            variant="caption"
            fontWeight="500"
            noWrap
            sx={{ maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", fontSize: "1rem" }}
          >
            Chat con {userName}
          </SoftTypography>

          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip title={`Estado: ${status}`}>
              <Chip
                label={status.toUpperCase()}
                color={
                  status === "pendiente" ? "warning" : status === "resuelta" ? "success" : "info"
                }
                size="small"
                sx={{
                  fontSize: "0.7rem",
                  height: 22,
                  fontWeight: "500",
                  "& .MuiChip-label": {
                    color: "white !important",
                    px: 1,
                    lineHeight: "18px",
                  },
                }}
              />
            </Tooltip>

            {blocked && (
              <Tooltip title="Usuario bloqueado">
                <Chip
                  label="BLOQUEADO"
                  color="error"
                  size="small"
                  sx={{
                    fontSize: "0.7rem",
                    height: 22,
                    fontWeight: 500,
                    "& .MuiChip-label": {
                      px: 1,
                      lineHeight: "18px",
                    },
                  }}
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

      {/* CUERPO DEL CHAT */}
      <div
        id="chat-container"
        onScroll={(e) => {
          const el = e.target;
          const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50; // margen de tolerancia
          setIsUserAtBottom(isAtBottom);
        }}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          backgroundColor: "#f9f9f9",
          position: "relative", // importante para el botón flotante
        }}
      >
        {processedMessages.map((msg, idx) => {
          console.log(`💬 Renderizando mensaje[${idx}]`, msg);
          return (
            <MessageBubble
              key={idx}
              msg={msg}
              onReply={() => onReply(msg)}
              onJumpToReply={onJumpToReply}
              ref={(el) => {
                if (el && msg.id) {
                  messageRefs.current[msg.id] = el;
                }
              }}
              isHighlighted={highlightedMessageId === msg.id} // ✅ <-- AQUI VA
            />
          );
        })}

        {isTyping &&
          (typingSender === "bot" || typingSender === "admin" || typingSender === "user") && (
            <CSSTransition
              in={true}
              appear
              timeout={300}
              classNames="fade"
              nodeRef={typingRef}
              unmountOnExit
            >
              <div ref={typingRef}>
                <TypingIndicator color="#00bcd4" background="#e0f7fa" variant="bars" />
              </div>
            </CSSTransition>
          )}

        <div ref={bottomRef} />

        {hasNewMessageBelow && (
          <Box
            onClick={() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              setHasNewMessageBelow(false);
            }}
            sx={{
              position: "absolute",
              bottom: 16,
              right: 20,
              backgroundColor: "#00bcd4",
              color: "white !important",
              px: 2,
              py: 1,
              borderRadius: "16px",
              cursor: "pointer",
              boxShadow: 3,
              fontSize: "0.8rem",
              zIndex: 999,
            }}
          >
            ⬇ Nuevo mensaje
          </Box>
        )}
      </div>

      {/* INPUT */}
      <Box sx={{ pt: 1, pb: 2, borderTop: "1px solid #eee", bgcolor: "white", zIndex: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Controls onToggle={onToggleIA} iaPaused={iaPaused} />

          {iaPaused && (
            <Box flex={1}>
              <InputChat
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onSend={handleSendMessage}
                replyTo={replyTo}
                onCancelReply={onCancelReply}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

ChatPanel.propTypes = {
  conversationId: PropTypes.number.isRequired,
  messages: PropTypes.array.isRequired,
  userName: PropTypes.string.isRequired,
  isTyping: PropTypes.bool.isRequired,
  typingSender: PropTypes.string,
  onToggleIA: PropTypes.func.isRequired,
  iaPaused: PropTypes.bool.isRequired,
  onSendAdminMessage: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  blocked: PropTypes.bool.isRequired,
  replyTo: PropTypes.object,
  onReply: PropTypes.func,
  onCancelReply: PropTypes.func,
  messageRefs: PropTypes.object,
  onJumpToReply: PropTypes.func,
  highlightedMessageId: PropTypes.string,
};

export default ChatPanel;
