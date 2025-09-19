import React from "react";
import TypingDots from "./TypingDots";
import PropTypes from "prop-types";

const TypingIndicator = ({ color = "#00bcd4", background = "#e0f7fa" }) => {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        backgroundColor: background,
        color,
        padding: "8px 12px",
        borderRadius: "16px",
        maxWidth: "fit-content",
        marginBottom: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}
    >
      <TypingDots color={color} />
    </div>
  );
};

TypingIndicator.propTypes = {
  color: PropTypes.string,
  background: PropTypes.string,
};

export default TypingIndicator;
