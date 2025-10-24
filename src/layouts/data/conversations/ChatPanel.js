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

import TypingIndicator from "./TypingIndicator";
import { CSSTransition } from "react-transition-group";
import { injectTypingAnimation } from "./typingAnimation";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import TextField from "@mui/material/TextField";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import { Box, Tooltip, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Loader from "../../../components/Loader";

import TagChip from "components/TagChip";
import {
  getTagsByConversationId,
  createConversationTag,
  updateConversationTag,
  deleteConversationTag,
} from "services/conversationTagsService";
import { updateConversationIsWithAI } from "services/conversationsService";

const ChatPanel = forwardRef(
  (
    {
      conversationId,
      messages = [],
      userName,
      isTyping,
      typingSender,
      typingConversationId,
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
      onAdminTyping,
      onAdminStopTyping,
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
    const [pendingTag, setPendingTag] = useState(null); // { title, description }
    const [showPendingEditor, setShowPendingEditor] = useState(false);
    const [conversationTags, setConversationTags] = useState([]);
    const [expandedTagIndex, setExpandedTagIndex] = useState(null);
    const isTagLimitReached = conversationTags.length >= 6;
    const [loadingConversationId, setLoadingConversationId] = useState(null);

    const inputRef = useRef(null);
    const scrollToBottom = () => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    };
    const [hasMounted, setHasMounted] = useState(false);

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
      if (!hasMounted) return; // ⛔ NO HACER NADA HASTA QUE MONTADO

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
    }, [messages, hasMounted]);

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
    }, [highlightedMessageId, onJumpToReply, messageRefs]);

    const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(null);

    useEffect(() => {
      const container = document.getElementById("chat-container");
      if (!container) return;

      container.style.overflow = anchorEl ? "hidden" : "auto";

      return () => {
        if (container) container.style.overflow = "auto";
      };
    }, [anchorEl]);

    const handleChangeStatus = (newStatus) => {
      onStatusChange(newStatus);

      if (newStatus === "pendiente") {
        setShowPendingEditor(true);
        setPendingTag({ title: "", description: "" });
      } else {
        setShowPendingEditor(false);
        setPendingTag(null);
      }

      handleCloseMenu();
    };

    const handleToggleBlock = () => {
      onBlock();
      handleCloseMenu();
    };

    const handleSendMessage = async () => {
      console.log("📝 Mensaje enviado:", inputValue);
      console.log("📎 Respondiendo a:", replyTo);

      if (inputValue.trim()) {
        const messageId = crypto.randomUUID();

        const replyInfo = replyTo
          ? {
            replyToMessageId: replyTo.id,
            replyToText: replyTo.text || replyTo.fileName || "mensaje",
          }
          : null;

        try {
          // 1. Pausar IA en backend
          await updateConversationIsWithAI(conversationId, false); // 👈 función que debes implementar

          // 2. Enviar mensaje
          onSendAdminMessage(
            inputValue.trim(),
            conversationId,
            messageId,
            replyTo ? replyTo.id : null,
            replyTo ? replyTo.text || replyTo.fileName || "mensaje" : null
          );

          setInputValue("");
          if (onCancelReply) onCancelReply();

          setTimeout(() => {
            scrollToBottom();
          }, 50);
        } catch (error) {
          console.error("❌ Error al pausar IA:", error);
        }
      }
    };

    const typingTimeout = useRef(null);
    const typingActiveRef = useRef(false); // To track if typing is currently active

    const handleInputChange = (text) => {
      setInputValue(text);

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      if (text.trim()) {
        // If not already typing, send typing start
        if (!typingActiveRef.current) {
          onAdminTyping(conversationId);
          typingActiveRef.current = true;
        }
        // Set a timeout to send stop typing if no more input
        typingTimeout.current = setTimeout(() => {
          onAdminStopTyping(conversationId); // New prop to send stop typing
          typingActiveRef.current = false;
        }, 1000); // Send stop typing after 1 second of inactivity
      } else {
        // If input is empty and typing was active, send stop typing immediately
        if (typingActiveRef.current) {
          onAdminStopTyping(conversationId);
          typingActiveRef.current = false;
        }
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case "resuelta":
          return <DoneAllIcon />;
        case "activo":
        default:
          return <CheckIcon />;
      }
    };

    const getBackgroundColor = (status) => {
      switch (status?.toLowerCase()) {
        case "pendiente":
          return "rgb(252, 166, 55)"; // naranja
        case "resuelta":
          return "rgb(70, 181, 94)"; // verde
        default:
          return "rgb(100, 100, 100)"; // gris
      }
    };

    const getBlockedIcon = () => <BlockIcon />;
    const processedMessages = useMemo(() => {
      return messages.map((msg) => {
        const normalizedText = msg.text || msg.question || msg.content || "";

        // Prioritize msg.files if it exists (for real-time messages)
        let files = Array.isArray(msg.files) ? [...msg.files] : [];

        // Fallback for history/legacy messages if msg.files is not present
        if (files.length === 0) {
          if (msg.file?.fileUrl) {
            files.push({ ...msg.file, url: msg.file.fileUrl });
          }
          if (Array.isArray(msg.images)) {
            msg.images.forEach((img) => {
              if (img.fileUrl) files.push({ ...img, url: img.fileUrl });
            });
          }
          if (msg.fileUrl && msg.fileName) {
            files.push({
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              fileType: msg.fileType || "application/octet-stream",
              url: msg.fileUrl,
            });
          }
        }

        let resolvedReplyTo = null;
        if (msg.replyToMessageId) {
          const original = messages.find((m) => m.id?.toString() === msg.replyToMessageId?.toString());
          if (original) {
            const firstFile =
              (Array.isArray(original.files) && original.files.length > 0 ? original.files[0] : null) ||
              original.file ||
              (Array.isArray(original.images) && original.images.length > 0 ? original.images[0] : null);

            resolvedReplyTo = {
              id: original.id,
              text: original.text || (firstFile ? null : msg.replyToText),
              fromName: original.fromRole === "admin" ? "Admin" : `Sesión ${conversationId}`,
              fromRole: original.fromRole || original.from || "user",
              fileName: firstFile?.fileName,
              fileUrl: firstFile?.fileUrl || firstFile?.url,
              fileType: firstFile?.fileType,
            };
          }
        }

        return {
          ...msg,
          fromName: msg.fromRole === "admin" ? "Admin" : `Sesión ${conversationId}`,
          text: normalizedText,
          fromRole: msg.fromRole || msg.from || "user",
          files: files.length > 0 ? files : undefined,
          replyTo: resolvedReplyTo ?? msg.replyTo ?? null,
        };
      });
    }, [messages, conversationId]);

    useEffect(() => {
      const fetchTags = async () => {
        if (!conversationId) return;
        try {
          const tags = await getTagsByConversationId(conversationId);
          setConversationTags(tags || []);
        } catch (error) {
          console.error("❌ Error obteniendo las etiquetas:", error);
          setConversationTags([]);
        }
      };

      fetchTags();
    }, [conversationId]);

    useLayoutEffect(() => {
      const container = document.getElementById("chat-container");
      if (!container || !bottomRef.current) return;

      const images = container.querySelectorAll("img");
      let loaded = 0;

      const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        setIsUserAtBottom(true);
      };

      const handleImageLoad = () => {
        loaded++;
        if (loaded === images.length) {
          scrollToBottom();
        }
      };

      if (images.length === 0) {
        scrollToBottom();
        return;
      }

      images.forEach((img) => {
        if (img.complete) {
          loaded++;
        } else {
          img.addEventListener("load", handleImageLoad);
          img.addEventListener("error", handleImageLoad);
        }
      });

      if (loaded === images.length) {
        scrollToBottom();
      }

      return () => {
        images.forEach((img) => {
          img.removeEventListener("load", handleImageLoad);
          img.removeEventListener("error", handleImageLoad);
        });
      };
    }, [conversationId, messages.length]);

    useLayoutEffect(() => {
      const container = document.getElementById("chat-container");
      if (!container || !bottomRef.current) return;

      const observer = new ResizeObserver(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        setIsUserAtBottom(true);
      });

      observer.observe(container);

      return () => {
        observer.disconnect();
      };
    }, [conversationId]);

    
    // DEBUG: print processed messages just before render to help diagnose missing messages
    try {
      // keep this non-blocking and safe in environments where console may not exist
      if (typeof console !== "undefined" && console.log) {
        console.log("DEBUG processedMessages:", processedMessages);
      }
    } catch (e) {
      /* ignore logging errors */
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
        {/* HEADER */}
        <Box
          sx={{
            position: "relative",
            px: 2,
            pb: 2,
            borderBottom: "1px solid #eee",
            bgcolor: "white",
            zIndex: 1,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" height={25}>
            <SoftTypography
              variant="caption"
              fontWeight="medium"
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

            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              {conversationTags.length > 0
                ? conversationTags.map((tag, index) => (
                  <TagChip
                    key={index}
                    tag={tag}
                    index={index}
                    isExpanded={expandedTagIndex === index}
                    onToggle={() =>
                      setExpandedTagIndex((prev) => (prev === index ? null : index))
                    }
                    backgroundColor={getBackgroundColor(status)}
                    onDelete={async (tagToDelete) => {
                      try {
                        await deleteConversationTag(tagToDelete.id);
                        const updatedTags = await getTagsByConversationId(conversationId);
                        setConversationTags(updatedTags || []);
                        setExpandedTagIndex(null);
                      } catch (error) {
                        console.error('Error eliminando etiqueta:', error);
                      }
                    }}
                  />
                ))
                : null}
              {blocked && (
                <Tooltip title="Usuario bloqueado">
                  <Chip
                    icon={getBlockedIcon()}
                    color="error"
                    size="small"
                    sx={{
                      height: 32,
                      width: 32,
                      borderRadius: "50%",
                      padding: 0,
                      minWidth: 0,
                      backgroundColor: "#ef9a9a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "& .MuiChip-icon": {
                        color: "#fff !important",
                        fontSize: "10px !important",
                        margin: 0,
                        padding: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                      "& .MuiChip-label": {
                        display: "none",
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

                <Tooltip
                  title={
                    isTagLimitReached
                      ? "Límite de 6 etiquetas alcanzado"
                      : "Añadir etiqueta de Pendiente"
                  }
                >
                  <span>
                    <MenuItem
                      onClick={() => handleChangeStatus("pendiente")}
                      disabled={isTagLimitReached}
                    >
                      Añadir etiqueta de Pendiente
                    </MenuItem>
                  </span>
                </Tooltip>

                <MenuItem
                  onClick={() => handleChangeStatus("resuelta")}
                  disabled={status?.toLowerCase() === "resuelta"}
                >
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

        {/* PANEL DE TAGS */}
        {showPendingEditor && (
          <Box
            sx={{
              position: "absolute",
              top: 92,
              right: 20,
              width: 300,
              zIndex: 10,
              p: 2,
              backgroundColor: "#ffffff",
              borderRadius: 2,
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "#0bbbb8",
                mb: 0.5,
                fontWeight: "bold",
                textTransform: "uppercase",
                fontSize: "12px",
              }}
            >
              Crear Etiqueta
            </Typography>

            <TextField
              placeholder="Nombre de la etiqueta"
              size="small"
              fullWidth
              value={pendingTag?.label || ""}
              inputProps={{ maxLength: 100 }}
              onChange={(e) => setPendingTag((prev) => ({ ...prev, label: e.target.value }))}
              InputProps={{
                sx: {
                  width: "100% !important",
                  fontSize: "12px",
                  color: "#333",
                  px: 1,
                },
              }}
              sx={{
                mb: 1,
                backgroundColor: "#fafafa",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#ccc" },
                  "&:hover fieldset": { borderColor: "#aaa" },
                },
                "& input::placeholder": {
                  color: "#999",
                },
              }}
            />

            <Box display="flex" justifyContent="flex-end" gap={1}>
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setShowPendingEditor(false);
                  setPendingTag(null);
                }}
                sx={{ fontSize: "16px", p: "2px" }}
              >
                ❌
              </IconButton>
              <IconButton
                size="small"
                color="success"
                onClick={async () => {
                  if (!pendingTag.label?.trim()) return;
                  try {
                    await createConversationTag({
                      conversationId,
                      label: pendingTag.label.trim(),
                      highlightedMessageId: null,
                    });
                    const updatedTags = await getTagsByConversationId(conversationId);
                    setConversationTags(updatedTags || []);
                    setShowPendingEditor(false);
                    setPendingTag(null);
                  } catch (error) {
                    console.error("❌ Error guardando etiqueta:", error);
                  }
                }}
                sx={{ fontSize: "16px", p: "2px" }}
              >
                ✔️
              </IconButton>
            </Box>
          </Box>
        )}

        {/* MENSAJES */}
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
          {loadingConversationId === `${conversationId}` ? (
            <>
              <div style={{ marginBottom: 10, color: "#888" }}></div>
              <Loader message="Cargando..." />
            </>
          ) : (
            processedMessages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                msg={msg}
                onReply={() => onReply(msg)}
                onJumpToReply={onJumpToReply}
                ref={(el) => {
                  if (el && msg.id) messageRefs.current[msg.id] = el;
                }}
                isHighlighted={highlightedMessageId === msg.id}
                isAIActive={!iaPaused}
              />
            ))
          )}
          {isTyping && typingSender && typingConversationId == conversationId && (
            <CSSTransition
              in
              appear
              timeout={300}
              classNames="fade"
              nodeRef={typingRef}
              unmountOnExit
            >
              <div ref={typingRef}>
                <TypingIndicator sender={typingSender} />
              </div>
            </CSSTransition>
          )}


          <div ref={bottomRef} />

          {hasMounted && hasNewMessageBelow && (
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
                color: "white !important",
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

        {/* INPUT */}
        <Box sx={{ pt: 1, pb: 2, borderTop: "1px solid #eee", bgcolor: "white", zIndex: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Controls onToggle={onToggleIA} iaPaused={iaPaused} />
            {iaPaused && (
              <Box flex={1}>
                <InputChat
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}   // 👈 ya no necesitas (e) => ... porque la función espera directamente el texto
                  onSend={handleSendMessage}
                  replyTo={replyTo}
                  onCancelReply={onCancelReply}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    ); // 👈 este cierra el return y el componente
  } // 👈 este cierra la definición de la función ChatPanel si la tienes como function
);
// 👇 Esto SIEMPRE va FUERA del componente
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
  onAdminTyping: PropTypes.func.isRequired,
  onAdminStopTyping: PropTypes.func, // ✅ agregado
    typingConversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ✅ agregar
};

export default ChatPanel;