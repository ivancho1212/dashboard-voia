import React from "react";

function TypingIndicator() {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        backgroundColor: "#f0f0f0",
        color: "#1a1a1a",
        padding: "8px 12px",
        borderRadius: "12px",
        fontStyle: "italic",
        fontSize: "14px",
        opacity: 0.7,
        marginBottom: "6px",
      }}
    >
      Escribiendo...
    </div>
  );
}

export default TypingIndicator;
