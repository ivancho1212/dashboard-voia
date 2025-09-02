import React from "react";
import PropTypes from "prop-types";
import { FaClock, FaExclamationCircle } from "react-icons/fa";

function MessageBubble({ message, index, messageRef, fontFamily, openImageModal }) {
  const isUser = message.from === "user";
  const isAI = message.from === "ai";
  const isAdmin = message.from === "admin";
  const isSending = isUser && message.status === "sending";
  const isError = isUser && message.status === "error";

  // Helper function to determine text color based on background luminance
  const getContrastTextColor = (hexColor) => {
    if (!hexColor) return "#1a1a1a"; // Default dark text
    let color = hexColor.startsWith("#") ? hexColor.slice(1) : hexColor;
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    // YIQ formula for contrast
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? "#1a1a1a" : "#ffffff";
  };

  const backgroundColor = (() => {
    if (isUser) {
      if (isSending) return "#d6ecfc"; // Azul pastel muy claro (enviando)
      if (isError) return "#fcd6d6"; // Rojo pastel claro (error)
      return "#b3d4fc"; // Azul pastel (enviado)
    }
    if (isAI) return "#f0e6fa"; // Lila pastel muy suave
    if (isAdmin) return "#e6f7e6"; // Verde pastel muy suave
    return "#f5f5f5"; // Gris pastel claro por defecto
  })();

  const containerStyle = {
    alignSelf: isUser ? "flex-end" : "flex-start",

    // 🎨 Colores de la burbuja según el estado y remitente
    backgroundColor,

    // 👤 Color del texto
    color: getContrastTextColor(backgroundColor),

    padding: "10px",
    borderRadius: "12px",
    maxWidth: "62%",
    minWidth: "80px",
    width: "fit-content",
    wordBreak: "break-word",
    fontSize: "14px",
    fontFamily,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",

    // 🔄 Opacidad para estado "sending"
    opacity: isSending ? 0.6 : 1,
  };

  // 2. Log para inspección como solicitaste
  console.log(
    `[MessageBubble #${index}]`,
    { from: message.from, status: message.status },
    { backgroundColor: containerStyle.backgroundColor, color: containerStyle.color }
  );

  const renderImages = (images) =>
    images?.slice(0, 4).map((img, i) => {
      const isLast = i === 3 && images.length > 4;
      const fullUrl = img.fileUrl.startsWith("http") ? img.fileUrl : `http://localhost:5006${img.fileUrl}`;

      return (
        <div
          key={i}
          style={{
            position: "relative",
            width: "100px",
            height: "100px",
            borderRadius: "8px",
            overflow: "hidden",
            cursor: "pointer",
          }}
          onClick={() => openImageModal(images, fullUrl)}
        >
          <img
            src={fullUrl}
            alt={img.fileName}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: isLast ? "brightness(0.5)" : "none",
            }}
          />
          {isLast && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0,0,0,0.6)",
                color: "#fff",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "8px",
              }}
            >
              +{images.length - 4}
            </div>
          )}
        </div>
      );
    });

  return (
    <div ref={messageRef} style={containerStyle}>
      {/* Archivos múltiples */}
      {message.multipleFiles?.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "6px",
            marginBottom: "6px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          {message.multipleFiles.slice(0, 4).map((file, i) => {
            const isLastVisible = i === 3 && message.multipleFiles.length > 4;
            const src = `data:${file.fileType};base64,${file.fileContent}`;
            return (
              <div key={i} style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: "8px" }}>
                <img
                  src={src}
                  alt={file.fileName}
                  onClick={() => {
                    if (!isLastVisible) {
                      openImageModal(message.multipleFiles, src);
                    }
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: isLastVisible ? "brightness(0.5)" : "none",
                    cursor: isLastVisible ? "default" : "pointer",
                  }}
                />
                {isLastVisible && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      color: "white",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      fontSize: "18px",
                      fontWeight: "bold",
                      borderRadius: "8px",
                    }}
                  >
                    +{message.multipleFiles.length - 4}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Archivo único */}
      {message.file && (
        message.file.fileType?.startsWith("image/") ? (
          <img
            src={
              message.file.fileUrl.startsWith("http")
                ? message.file.fileUrl
                : `http://localhost:5006${message.file.fileUrl}`
            }
            alt={message.file.fileName}
            onClick={() => openImageModal([message.file], message.file.fileUrl)}
            style={{
              maxWidth: "100%",
              borderRadius: "8px",
              marginBottom: "4px",
              cursor: "pointer",
            }}
          />
        ) : (
          <a
            href={
              message.file.fileUrl.startsWith("http")
                ? message.file.fileUrl
                : `http://localhost:5006${message.file.fileUrl}`
            }
            download={message.file.fileName}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#007bff",
              textDecoration: "underline",
              marginBottom: "4px",
              display: "inline-block",
            }}
          >
            📎 {message.file.fileName}
          </a>
        )
      )}

      {/* Imágenes agrupadas */}
      {message.images?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
          {renderImages(message.images)}
        </div>
      )}

      {/* Texto */}
      {message.text && <span>{message.text}</span>}

      {/* Timestamp y Status */}
      <div style={{ display: "flex", alignSelf: "flex-end", alignItems: "center", gap: "5px", marginTop: "4px" }}>
        {isUser && message.status === 'sending' && (
          <span style={{ fontSize: '10px', color: '#888' }} title="Enviando...">...</span>
        )}
        {isUser && message.status === 'error' && (
          <FaExclamationCircle style={{ fontSize: "10px", color: "red" }} title="Error al enviar" />
        )}
        {message.timestamp && (
          <span
            style={{
              fontSize: "9px",
              color: "#555",
              opacity: 0.7,
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    from: PropTypes.string,
    status: PropTypes.string, // 'sending', 'sent', 'error'
    text: PropTypes.string,
    timestamp: PropTypes.string,
    file: PropTypes.shape({
      fileType: PropTypes.string,
      fileUrl: PropTypes.string,
      fileName: PropTypes.string,
    }),
    multipleFiles: PropTypes.arrayOf(
      PropTypes.shape({
        fileType: PropTypes.string,
        fileContent: PropTypes.string,
        fileName: PropTypes.string,
      })
    ),
    images: PropTypes.arrayOf(
      PropTypes.shape({
        fileUrl: PropTypes.string,
        fileName: PropTypes.string,
      })
    ),
  }).isRequired,
  index: PropTypes.number.isRequired,
  messageRef: PropTypes.object.isRequired,
  fontFamily: PropTypes.string,
  openImageModal: PropTypes.func.isRequired,
};

export default MessageBubble;
