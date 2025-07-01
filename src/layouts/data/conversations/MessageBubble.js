import React from "react";
import PropTypes from "prop-types";

function MessageBubble({ msg }) {
  const isUser = msg.from === "user";
  const isBot = msg.from === "bot";
  const isAdmin = msg.from === "admin";

  const backgroundColor = isUser
    ? "#e0f7fa" // celeste claro para usuario
    : isBot
    ? "#f1f1f1" // gris claro para IA
    : "#d0f0c0"; // verde suave para admin

  const alignSelf = isUser ? "flex-end" : "flex-start";

  return (
    <div
      style={{
        alignSelf,
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
      }}
    >
      {msg.text}
    </div>
  );
}

MessageBubble.propTypes = {
  msg: PropTypes.shape({
    from: PropTypes.oneOf(["user", "bot", "admin"]).isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
};

export default MessageBubble;
