import React from "react";
import PropTypes from "prop-types";

function MessageBubble({ msg }) {
  const { from, text, timestamp, multipleFiles } = msg;
  const isRight = from === "admin" || from === "bot";

  const backgroundColor = from === "user" ? "#e0f7fa" : from === "admin" ? "#d0f0c0" : "#f1f1f1";

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  const isBase64 = typeof text === "string" && text.startsWith("data:");
  const isImage = isBase64 && text.includes("image");

  const downloadFile = () => {
    const link = document.createElement("a");
    link.href = text;
    const fileType = text.match(/^data:.*\/(.*);/)[1];
    link.download = `archivo.${fileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
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
      {/* Mostrar archivos múltiples */}
      {multipleFiles?.length > 0 &&
        multipleFiles.map((file, idx) =>
          file.fileType.startsWith("image/") ? (
            <img
              key={idx}
              src={`data:${file.fileType};base64,${file.fileContent}`}
              alt={file.fileName}
              style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "4px" }}
            />
          ) : (
            <a
              key={idx}
              href={`data:${file.fileType};base64,${file.fileContent}`}
              download={file.fileName}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                marginBottom: "6px",
                color: "#007bff",
                textDecoration: "underline",
                fontSize: "13px",
              }}
            >
              📎 {file.fileName}
            </a>
          )
        )}

      {/* Mostrar archivo base64 o texto normal */}
      {text &&
        (isBase64 ? (
          isImage ? (
            <img
              src={text}
              alt="imagen"
              style={{ maxWidth: "100%", borderRadius: "8px", marginBottom: "4px" }}
            />
          ) : (
            <button
              onClick={downloadFile}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "6px 10px",
                fontSize: "13px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginBottom: "4px",
              }}
            >
              📎 Descargar archivo
            </button>
          )
        ) : (
          <div>{text}</div>
        ))}

      <div
        style={{
          fontSize: "10px",
          color: "#555",
          marginTop: "0px",
          textAlign: isRight ? "right" : "left",
        }}
      >
        {formattedTime}
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  msg: PropTypes.shape({
    from: PropTypes.oneOf(["user", "bot", "admin"]).isRequired,
    text: PropTypes.string,
    timestamp: PropTypes.string,
    multipleFiles: PropTypes.arrayOf(
      PropTypes.shape({
        fileContent: PropTypes.string.isRequired,
        fileType: PropTypes.string.isRequired,
        fileName: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
};

export default MessageBubble;

