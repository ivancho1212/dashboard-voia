// src/components/Loader.js o Loader.jsx
import React from "react";
import PropTypes from "prop-types";
import { CircularProgress } from "@mui/material";
import SoftTypography from "./SoftTypography"; // si estás usando esto

function Loader({ message }) {
  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <CircularProgress color="info" />
      {message && (
        <SoftTypography variant="caption" display="block" mt={1}>
          {message}
        </SoftTypography>
      )}
    </div>
  );
}

// ✅ Validación de props
Loader.propTypes = {
  message: PropTypes.string,
};

export default Loader;
