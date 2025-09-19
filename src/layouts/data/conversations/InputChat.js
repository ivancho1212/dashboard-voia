import React, { forwardRef, useRef } from "react";
import PropTypes from "prop-types";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import Paper from "@mui/material/Paper";

const InputChat = forwardRef(function InputChat(
  { value, onChange, onSend, replyTo, onCancelReply, connection, conversationId, currentUser },
  ref
) {
  const typingTimeoutRef = useRef(null);

  // ✅ Notifica que se ha dejado de escribir
  const handleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (connection && conversationId && currentUser?.id) {
              connection.invoke("StopTyping", conversationId, currentUser.id.toString());
    }
  };

  // ✅ Notifica que se está escribiendo y programa la detención
  const handleTyping = (text) => {
    onChange(text); // Actualiza el estado en el componente padre

    if (connection && conversationId && currentUser?.id) {
      // Notifica que está escribiendo
              connection.invoke("Typing", conversationId, currentUser.id.toString());

      // Limpia el temporizador anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Inicia un nuevo temporizador para detener el typing después de 2 segundos de inactividad
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 2000);
    }
  };

  const handleSendMessage = () => {
    handleStopTyping(); // Detiene el indicador de "escribiendo" inmediatamente
    onSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {replyTo && (
        <div
          style={{
            background: "#e3f2fd",
            padding: "8px 12px",
            borderLeft: "4px solid #2196f3",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#0d47a1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            marginLeft: "35px",
            maxWidth: "81%",
          }}
        >
          <div
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flexGrow: 1,
              fontWeight: 500,
            }}
          >
            <strong>Respondiendo:</strong>{" "}
            <span style={{ fontStyle: "italic" }}>
              {replyTo.text || replyTo.fileName || "mensaje"}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              border: "none",
              background: "transparent",
              fontSize: "16px",
              color: "#666",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <Paper
        elevation={3}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          borderRadius: "15px",
          pr: 2,
          py: 0.5,
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          maxHeight: 100,
        }}
      >
        <InputBase
          inputRef={ref}
          fullWidth
          multiline
          maxRows={3}
          value={value}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleStopTyping} // ✅ Detiene el typing si el usuario sale del input
          placeholder="Escribe un mensaje..."
          sx={{
            fontSize: "14px",
            lineHeight: "1.4",
            overflowY: "auto",
            maxHeight: "90px",
            pr: 1,
          }}
        />
        <IconButton onClick={handleSendMessage} color="info">
          <SendIcon />
        </IconButton>
      </Paper>
    </div>
  );
});

InputChat.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  replyTo: PropTypes.object,
  onCancelReply: PropTypes.func,
  connection: PropTypes.object, // Conexión de SignalR
  conversationId: PropTypes.number, // ID de la conversación actual
  currentUser: PropTypes.shape({ id: PropTypes.any.isRequired }), // Usuario que está escribiendo
};

export default InputChat;
