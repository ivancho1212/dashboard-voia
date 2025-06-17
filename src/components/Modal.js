// src/components/Modal.js
import React from "react";
import PropTypes from "prop-types";
import { Modal as MuiModal, Box } from "@mui/material";

function Modal({ open = true, onClose, children }) {
  return (
    <MuiModal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slotProps={{
        backdrop: {
          timeout: 300,
          sx: {
            backgroundColor: "rgba(255, 255, 255, 0.88)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "white",
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          minWidth: 350,
          maxWidth: "90%",
        }}
      >
        {children}
      </Box>
    </MuiModal>
  );
}

Modal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node,
};

export default Modal;
