import React from "react";
import TypingDots from "./TypingDots";
import PropTypes from "prop-types";

const TypingIndicator = ({ color = "#00bcd4", background = "#e0f7fa", variant = "bars" }) => {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        backgroundColor: background,
        color,
        padding: "6px 10px",
        borderRadius: "10px",
        maxWidth: "fit-content",
        fontStyle: "italic",
        fontSize: "14px",
        opacity: 0.85,
        marginBottom: "8px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      {variant === "dots" ? (
        <span style={{ display: "inline-block" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                backgroundColor: color,
                borderRadius: "50%",
                display: "inline-block",
                width: 6,
                height: 6,
                margin: "0 2px",
                animation: "typingBlink 1s infinite ease-in-out",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </span>
      ) : (
        <TypingDots color={color} />
      )}
    </div>
  );
};

TypingIndicator.propTypes = {
  color: PropTypes.string,
  background: PropTypes.string,
  variant: PropTypes.oneOf(["dots", "bars"]),
};

export default TypingIndicator;
