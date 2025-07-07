import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import Paper from "@mui/material/Paper";

function InputChat({ value, onChange, onSend }) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // ✅ Previene salto de línea con Enter
      onSend();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        alignItems: "flex-end",
        borderRadius: "15px",
        pr: 2,
        py: 0.5,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        maxHeight: 100, // 👈 Límite visual para 2-3 líneas
      }}
    >
      <InputBase
        fullWidth
        multiline
        maxRows={3} // ✅ permite hasta 3 líneas visibles
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Escribe un mensaje..."
        sx={{
          fontSize: "14px",
          lineHeight: "1.4",
          overflowY: "auto", // ✅ muestra scroll cuando hay más texto
          maxHeight: "90px",
          pr: 1,
        }}
      />
      <IconButton onClick={onSend} color="info">
        <SendIcon />
      </IconButton>
    </Paper>
  );
}

InputChat.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
};

export default InputChat;
