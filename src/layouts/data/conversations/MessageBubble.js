import React from "react";
import PropTypes from "prop-types";

function MessageBubble({ msg }) {
  const isRight = msg.from === "admin" || msg.from === "bot";

  const backgroundColor =
    msg.from === "user" ? "#e0f7fa" : msg.from === "admin" ? "#d0f0c0" : "#f1f1f1";

  const timestamp = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

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
      <div>{msg.text}</div>
      <div
        style={{
          fontSize: "10px",
          color: "#555",
          marginTop: "0px",
          textAlign: isRight ? "right" : "left", // alinea según el lado
        }}
      >
        {timestamp}
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  msg: PropTypes.shape({
    from: PropTypes.oneOf(["user", "bot", "admin"]).isRequired,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.string,
  }).isRequired,
};

export default MessageBubble;
