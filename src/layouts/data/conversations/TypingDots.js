// dashboard-via/src/layouts/data/conversations/TypingDots.js
import React from "react";
import PropTypes from "prop-types";

const TypingDots = ({ color = "#000" }) => {
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "16px" }}>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            width: "4px",
            height: "8px",
            backgroundColor: color, // ✅ Corrección aquí
            animation: "equalizer 1s infinite ease-in-out",
            animationDelay: `${i * 0.2}s`,
            borderRadius: "2px",
          }}
        />
      ))}
      <style>
        {`
          @keyframes equalizer {
            0%, 100% {
              height: 8px;
              opacity: 0.5;
            }
            50% {
              height: 16px;
              opacity: 1;
            }
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
