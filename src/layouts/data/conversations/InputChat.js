import React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SendIcon from "@mui/icons-material/Send";
import Paper from "@mui/material/Paper";

function InputChat({ value, onChange, onSend }) {
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      onSend();
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: "999px",
        px: 2,
        py: 0.5,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <InputBase
        fullWidth
        placeholder="Escribe un mensaje..."
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        sx={{
          fontSize: "14px",
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
