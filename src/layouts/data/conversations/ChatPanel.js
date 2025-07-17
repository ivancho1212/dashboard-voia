import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
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

const ChatPanel = forwardRef(
  (
    {
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
    },
    ref
  ) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const bottomRef = useRef(null);
    const typingRef = useRef(null);
    const [isUserAtBottom, setIsUserAtBottom] = useState(true);
    const lastMessageIdRef = useRef(null);
    const [hasNewMessageBelow, setHasNewMessageBelow] = useState(false);
    const inputRef = useRef(null);
    const scrollToBottom = () => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };
    
    useImperativeHandle(ref, () => ({
      isInputFocused: () => inputRef.current === document.activeElement,
    }));

    useEffect(() => {
      if (iaPaused && inputRef.current) inputRef.current.focus();
    }, [iaPaused]);

    useEffect(() => {
      if (replyTo && inputRef.current) inputRef.current.focus();
    }, [replyTo]);

    useLayoutEffect(() => {
      injectTypingAnimation();

      const container = document.getElementById("chat-container");
      if (!container) return;

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      const SCROLL_THRESHOLD = 150;
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD;
      const isNew = lastMessage.id !== lastMessageIdRef.current;
      if (!isNew) return;
      
      lastMessageIdRef.current = lastMessage.id;

      if (lastMessage.from === "admin") {
        scrollToBottom();
        setHasNewMessageBelow(false);
        return;
      }

      if (atBottom) {
        scrollToBottom();
        setHasNewMessageBelow(false);
      } else {
        setHasNewMessageBelow(true);
      }
    }, [messages]);

    useEffect(() => {
      if (!highlightedMessageId || !messageRefs.current[highlightedMessageId]) return;

      const el = messageRefs.current[highlightedMessageId];
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      const timeout = setTimeout(() => {
        if (typeof onJumpToReply === "function") {
          onJumpToReply(null);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    }, [highlightedMessageId]);

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
        const messageId = crypto.randomUUID();
        const replyInfo = replyTo
          ? {
              id: replyTo.id,
              text: replyTo.text,
              fileName:
                replyTo.multipleFiles?.[0]?.fileName || replyTo.files?.[0]?.fileName || undefined,
            }
          : null;

        onSendAdminMessage(inputValue.trim(), conversationId, messageId, replyInfo);
        setInputValue("");
        setTimeout(() => {
          scrollToBottom();
        }, 50);
        if (onCancelReply) onCancelReply();
      }
    };

    const typingTimeout = useRef(null);

    const handleInputChange = (text) => {
      setInputValue(text);

      if (typingTimeout.current) clearTimeout(typingTimeout.current);

      if (text.trim()) {
        typingTimeout.current = setTimeout(() => {
          connection
            .invoke("Typing", Number(conversationId), "admin")
            .catch((err) => console.error("❌ Error enviando Typing:", err));
        }, 500);
      }
    };

    const processedMessages = useMemo(() => {
      return messages.map((msg) => {
        let files = [];

        if (msg.file?.fileUrl) {
          files.push({ ...msg.file, url: msg.file.fileUrl });
        }

        if (Array.isArray(msg.images)) {
          msg.images.forEach((img) => {
            if (img.fileUrl) files.push({ ...img, url: img.fileUrl });
          });
        }

        let resolvedReplyTo = null;
        if (msg.replyToMessageId) {
          const original = messages.find(
            (m) => m.id?.toString() === msg.replyToMessageId?.toString()
          );
          if (original) {
            const firstFile = original.file || original.images?.[0];
            resolvedReplyTo = {
              id: original.id,
              text: original.text || (firstFile ? "📎 " + firstFile.fileName : null),
              fileName: firstFile?.fileName,
            };
          } else if (msg.replyToText) {
            resolvedReplyTo = {
              id: msg.replyToMessageId,
              text: msg.replyToText,
            };
          }
        }

        return {
          ...msg,
          files: files.length > 0 ? files : undefined,
          replyTo: resolvedReplyTo ?? msg.replyTo ?? null,
        };
      });
    }, [messages]);

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        <Box sx={{ px: 2, pb: 2, borderBottom: "1px solid #eee", bgcolor: "white", zIndex: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" height={25}>
            <SoftTypography
              variant="caption"
              fontWeight="500"
              noWrap
              sx={{
                maxWidth: "60%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: "1rem",
              }}
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
                  sx={{ fontSize: "0.7rem", height: 22, fontWeight: 500 }}
                />
              </Tooltip>

              {blocked && (
                <Tooltip title="Usuario bloqueado">
                  <Chip
                    label="BLOQUEADO"
                    color="error"
                    size="small"
                    sx={{ fontSize: "0.7rem", height: 22 }}
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

        <div
          id="chat-container"
          onScroll={(e) => {
            const el = e.target;
            setIsUserAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 150);
          }}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            backgroundColor: "#f9f9f9",
            position: "relative",
          }}
        >
          {processedMessages.map((msg, idx) => (
            <MessageBubble
              key={idx}
              msg={msg}
              onReply={() => onReply(msg)}
              onJumpToReply={onJumpToReply}
              ref={(el) => {
                if (el && msg.id) messageRefs.current[msg.id] = el;
              }}
              isHighlighted={highlightedMessageId === msg.id}
            />
          ))}

          {isTyping && ["bot", "admin", "user"].includes(typingSender) && (
            <CSSTransition
              in
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
                position: "fixed",
                bottom: 130,
                right: 60,
                backgroundColor: "#00bcd4",
                color: "white",
                px: 2,
                py: 1,
                borderRadius: "16px",
                cursor: "pointer",
                boxShadow: 3,
                fontSize: "0.8rem",
                zIndex: 1300,
              }}
            >
              ⬇ Nuevo mensaje
            </Box>
          )}
        </div>

        <Box sx={{ pt: 1, pb: 2, borderTop: "1px solid #eee", bgcolor: "white", zIndex: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Controls onToggle={onToggleIA} iaPaused={iaPaused} />

            {iaPaused && (
              <Box flex={1}>
                <InputChat
                  ref={inputRef}
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
);

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
