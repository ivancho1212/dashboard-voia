import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { FaClock, FaExclamationCircle } from "react-icons/fa";
import { getSenderColor } from "utils/colors";

function MessageBubble({ message, index, messageRef, fontFamily, openImageModal }) {
  const isUser = message.from === "user";
  const isAI = message.from === "ai" || message.from === "bot";
  const isAdmin = message.from === "admin";
  const isSending = isUser && message.status === "sending";
  const isError = isUser && message.status === "error";

  // Por esto:
  let backgroundColor = "#f5f5f5";
  let textColor = "#1a1a1a";

  if (isUser) {
    if (isSending) backgroundColor = "#d6ecfc";
    else if (isError) backgroundColor = "#fcd6d6";
    else backgroundColor = "#b8d0ecff";
    textColor = "#1a1a1a"; // texto de usuario siempre oscuro
  } else if (isAI || isAdmin) {
    const { backgroundColor: bg, textColor: tc } = getSenderColor(message.from);
    backgroundColor = bg;
    textColor = tc;
  }

  const containerStyle = {
    alignSelf: isUser ? "flex-end" : "flex-start",
    backgroundColor,
    color: textColor,
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
    opacity: isSending ? 0.6 : 1,
  };

  // 🔹 Log cada vez que renderiza este bubble
  useEffect(() => {
    console.log(
      `[MessageBubble Render #${index}]`,
      { from: message.from, status: message.status, text: message.text },
      { backgroundColor: containerStyle.backgroundColor, color: containerStyle.color }
    );
  }, [message, index, containerStyle.backgroundColor, containerStyle.color]);

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
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tempId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    from: PropTypes.string,
    status: PropTypes.string,
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
