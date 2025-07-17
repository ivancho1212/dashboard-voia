import React from "react";
import PropTypes from "prop-types";

function MessageBubble({ message, index, messageRef, fontFamily, openImageModal }) {
  const isUser = message.from === "user";

  const containerStyle = {
    alignSelf: isUser ? "flex-end" : "flex-start",
    backgroundColor: isUser ? "#e1f0ff" : "#f0f0f0",
    color: "#1a1a1a",
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
  };

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

      {/* Timestamp */}
      {message.timestamp && (
        <span
          style={{
            fontSize: "9px",
            color: "#555",
            alignSelf: "flex-end",
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
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    from: PropTypes.string,
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
