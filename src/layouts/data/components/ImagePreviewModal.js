// src/layouts/data/components/ImagePreviewModal.js

import React from "react";
import PropTypes from "prop-types";
import { buildFileUrl, downloadImagesAsZip } from "utils/fileHelpers";

const ImagePreviewModal = ({ imageFiles, currentIndex, onClose, onPrev, onNext }) => {
  if (!imageFiles || currentIndex === null) return null;

  const file = imageFiles[currentIndex];
  const fileUrl = buildFileUrl(file.fileUrl);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.85)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      {/* Botón anterior */}
      <button onClick={(e) => { e.stopPropagation(); onPrev(); }} style={navBtnLeft}>❮</button>

      {/* Imagen actual */}
      <img
        src={fileUrl}
        alt={file.fileName}
        style={{
          maxWidth: "75%",
          maxHeight: "70vh",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        }}
      />

      {/* Botón siguiente */}
      <button onClick={(e) => { e.stopPropagation(); onNext(); }} style={navBtnRight}>❯</button>

      {/* Botón descargar individual */}
      {imageFiles.length === 1 && (
        <a
          href={fileUrl}
          download={file.fileName}
          onClick={(e) => e.stopPropagation()}
          style={downloadBtnStyle}
        >
          Descargar
        </a>
      )}

      {/* Botón descargar todas */}
      {imageFiles.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            downloadImagesAsZip(imageFiles);
          }}
          style={downloadBtnStyle}
        >
          Descargar todo
        </button>
      )}
    </div>
  );
};

// Estilos base
const navBtnBase = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  background: "transparent",
  border: "2px solid #fff",
  borderRadius: "50%",
  color: "#fff",
  fontSize: "20px",
  cursor: "pointer",
  width: "36px",
  height: "36px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

// Estilos específicos
const navBtnLeft = {
  ...navBtnBase,
  left: "20px",
};

const navBtnRight = {
  ...navBtnBase,
  right: "20px",
};

const downloadBtnStyle = {
  position: "absolute",
  top: "20px",
  right: "20px",
  background: "#fff",
  color: "#000",
  padding: "6px 12px",
  fontSize: "13px",
  borderRadius: "6px",
  textDecoration: "none",
  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
};

ImagePreviewModal.propTypes = {
  imageFiles: PropTypes.array.isRequired,
  currentIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};

export default ImagePreviewModal;
