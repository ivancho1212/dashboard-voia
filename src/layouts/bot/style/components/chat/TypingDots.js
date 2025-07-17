import React from "react";
import PropTypes from "prop-types";

const TypingDots = ({ color = "#00bcd4" }) => {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "16px" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: "4px",
            height: "8px",
            background: color,
            animation: "equalizer 0.8s infinite ease-in-out",
            animationDelay: `${i * 0.15}s`,
            borderRadius: "2px",
          }}
        />
      ))}
      <style>
        {`
          @keyframes equalizer {
            0%, 100% { height: 8px; }
            50% { height: 16px; }
          }
        `}
      </style>
    </div>
  );
};

TypingDots.propTypes = {
  color: PropTypes.string,
};

export default TypingDots;
