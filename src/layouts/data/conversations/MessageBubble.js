import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

function MessageBubble({ msg, onReply }) {
  const { from, text, timestamp, files = [], replyTo } = msg;
  const isRight = from === "admin" || from === "bot";
  const backgroundColor = from === "user" ? "#e0f7fa" : from === "admin" ? "#d0f0c0" : "#f1f1f1";

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const [previewIndex, setPreviewIndex] = useState(null);
  const [imageOptionsOpen, setImageOptionsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const optionsRef = useRef(null);
  const imageFiles = files.filter((file) => file.fileType.startsWith("image/"));
  const showOptionsIcon = isHovered && (text || imageFiles.length > 0);

  const handlePrev = () => setPreviewIndex((prev) => (prev > 0 ? prev - 1 : imageFiles.length - 1));
  const handleNext = () => setPreviewIndex((prev) => (prev < imageFiles.length - 1 ? prev + 1 : 0));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setImageOptionsOpen(false);
      }
    };
    if (imageOptionsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [imageOptionsOpen]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        alignSelf: isRight ? "flex-end" : "flex-start",
        backgroundColor,
        color: "#1a1a1a",
        padding: "10px 14px",
        borderRadius: "16px",
        maxWidth: "80%",
        wordBreak: "break-word",
        fontSize: "14px",
        fontFamily: "Arial",
        marginBottom: "8px",
        boxShadow: "0 1px 4px rgba(0, 0, 0, 0.1)",
        position: "relative",
      }}
    >
      {!isRight && (
        <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: "#555" }}>
          {from === "user" ? "Usuario" : from === "bot" ? "Bot" : "Admin"}
        </div>
      )}

      {replyTo && (
        <div
          style={{
            background: "#ffffff90",
            padding: "4px 8px",
            borderLeft: "3px solid #888",
            fontSize: "12px",
            color: "#444",
            marginBottom: "6px",
          }}
        >
          Respondiendo a: {replyTo.text || replyTo.fileName || "mensaje"}
        </div>
      )}

      {/* Icono de opciones */}
      {showOptionsIcon && (
        <div
          style={{
            position: "absolute",
            top: "6px",
            right: "10px",
            zIndex: 10,
            fontSize: "20px",
            color: "gray",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          onClick={() => setImageOptionsOpen(!imageOptionsOpen)}
        >
          ⋮
        </div>
      )}

      {/* Menú desplegable */}
      {imageOptionsOpen && (
        <div
          ref={optionsRef}
          style={{
            position: "absolute",
            top: "30px",
            right: "10px",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "6px",
            zIndex: 11,
            padding: "4px 0",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            fontSize: "12px",
          }}
        >
          {imageFiles.length > 0 && (
            <>
              <div
                style={{ padding: "6px 12px", cursor: "pointer" }}
                onClick={() => {
                  setPreviewIndex(0);
                  setImageOptionsOpen(false);
                }}
              >
                Ver
              </div>
              <div
                style={{ padding: "6px 12px", cursor: "pointer" }}
                onClick={() => {
                  imageFiles.forEach((file) => {
                    const source =
                      file.url ||
                      (file.fileContent && `data:${file.fileType};base64,${file.fileContent}`);
                    const link = document.createElement("a");
                    link.href = source;
                    link.download = file.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  });
                  setImageOptionsOpen(false);
                }}
              >
                Descargar
              </div>
            </>
          )}

          {text && (
            <div
              style={{ padding: "6px 12px", cursor: "pointer" }}
              onClick={() => {
                navigator.clipboard.writeText(text);
                setImageOptionsOpen(false);
              }}
            >
              Copiar
            </div>
          )}

          <div
            style={{ padding: "6px 12px", cursor: "pointer" }}
            onClick={() => {
              onReply && onReply(msg);
              setImageOptionsOpen(false);
            }}
          >
            Responder
          </div>
        </div>
      )}

      {/* Imágenes */}
      {imageFiles.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
          {imageFiles.map((file, idx) => {
            const source =
              file.url || (file.fileContent && `data:${file.fileType};base64,${file.fileContent}`);
            if (!source) return null;

            return (
              <div key={idx} style={{ borderRadius: "8px", overflow: "hidden" }}>
                <img
                  src={source}
                  alt={file.fileName}
                  style={{ maxWidth: "180px", borderRadius: "8px" }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Texto */}
      {text && files.length === 0 && <div>{text}</div>}

      {/* Hora */}
      <div
        style={{
          fontSize: "10px",
          color: "#555",
          marginTop: "4px",
          textAlign: "right",
        }}
      >
        {formattedTime}
      </div>

      {/* Modal de imagen ampliada */}
      {previewIndex !== null && (
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
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            style={{
              position: "absolute",
              top: "50%",
              left: "10px",
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
            }}
          >
            ❮
          </button>

          <img
            src={
              imageFiles[previewIndex].url ||
              `data:${imageFiles[previewIndex].fileType};base64,${imageFiles[previewIndex].fileContent}`
            }
            alt={imageFiles[previewIndex].fileName}
            style={{
              maxWidth: "75%",
              maxHeight: "70vh",
              borderRadius: "10px",
              boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
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
            }}
          >
            ❯
          </button>

          <a
            href={
              imageFiles[previewIndex].url ||
              `data:${imageFiles[previewIndex].fileType};base64,${imageFiles[previewIndex].fileContent}`
            }
            download={imageFiles[previewIndex].fileName}
            onClick={(e) => e.stopPropagation()}
            style={{
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
            }}
          >
            Descargar
          </a>
        </div>
      )}
    </div>
  );
}

MessageBubble.propTypes = {
  msg: PropTypes.shape({
    from: PropTypes.oneOf(["user", "bot", "admin"]).isRequired,
    text: PropTypes.string,
    timestamp: PropTypes.string,
    files: PropTypes.arrayOf(
      PropTypes.shape({
        fileName: PropTypes.string.isRequired,
        fileType: PropTypes.string.isRequired,
        fileContent: PropTypes.string,
        url: PropTypes.string,
      })
    ),
    replyTo: PropTypes.object,
  }).isRequired,
  onReply: PropTypes.func,
};

export default MessageBubble;
