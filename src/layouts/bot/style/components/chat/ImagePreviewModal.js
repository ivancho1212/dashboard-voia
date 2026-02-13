import React from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom"; // Importar ReactDOM

const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageGroup,
  imageGroupBlobUrls = {},
  activeImageIndex,
  setActiveImageIndex,
}) => {
  if (!isOpen) return null;

  const currentImage = imageGroup[activeImageIndex];

  // 🔹 PRIORIZAR blob URL para evitar CORS issues
  const imageUrl = imageGroupBlobUrls?.[currentImage?.fileUrl] || (
    currentImage?.fileUrl.startsWith("http")
      ? currentImage?.fileUrl
      : `http://localhost:5006${currentImage?.fileUrl}`
  );

  return ReactDOM.createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        flexDirection: "row",
      }}
    >
      {imageGroup.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveImageIndex((prev) => (prev - 1 + imageGroup.length) % imageGroup.length);
          }}
          style={{
            position: "absolute",
            left: "20px",
            backgroundColor: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "32px",
            cursor: "pointer",
          }}
        >
          ‹
        </button>
      )}

      <img
        src={imageUrl}
        alt="Vista previa"
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: "10px",
          boxShadow: "0 0 10px #000",
        }}
      />

      {imageGroup.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveImageIndex((prev) => (prev + 1) % imageGroup.length);
          }}
          style={{
            position: "absolute",
            right: "20px",
            backgroundColor: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "32px",
            cursor: "pointer",
          }}
        >
          ›
        </button>
      )}
    </div>,
    document.body
  );
};

ImagePreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  imageGroup: PropTypes.arrayOf(
    PropTypes.shape({
      fileUrl: PropTypes.string.isRequired,
    })
  ).isRequired,
  imageGroupBlobUrls: PropTypes.object,
  activeImageIndex: PropTypes.number.isRequired,
  setActiveImageIndex: PropTypes.func.isRequired,
};

export default ImagePreviewModal;
