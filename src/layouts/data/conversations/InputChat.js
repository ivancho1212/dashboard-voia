import React from "react";
import PropTypes from "prop-types";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import Paper from "@mui/material/Paper";

function InputChat({ value, onChange, onSend, replyTo, onCancelReply }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
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
            marginLeft: "35px", // 👈 CORRERLO A LA DERECHA
            maxWidth: "81%", // 👈 QUE NO LLEGUE HASTA EL BORDE DERECHO
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
          fullWidth
          multiline
          maxRows={3}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          sx={{
            fontSize: "14px",
            lineHeight: "1.4",
            overflowY: "auto",
            maxHeight: "90px",
            pr: 1,
          }}
        />
        <IconButton onClick={onSend} color="info">
          <SendIcon />
        </IconButton>
      </Paper>
    </div>
  );
}

InputChat.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  replyTo: PropTypes.object, // mensaje al que se está respondiendo
  onCancelReply: PropTypes.func, // función para cancelar respuesta
};

export default InputChat;
