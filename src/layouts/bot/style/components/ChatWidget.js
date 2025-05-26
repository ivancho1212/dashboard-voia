import React, { useState } from "react";
import { FaPaperPlane, FaImage, FaComments, FaRobot } from "react-icons/fa";
import PropTypes from "prop-types";

export default function ChatWidget({
  theme,
  primary_color,
  secondary_color,
  font_family,
  avatar_url,
  position,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const themeConfig = {
    light: {
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderColor: "#dddddd",
      inputBg: "#ffffff",
      inputText: "#000000",
      inputBorder: "#dddddd",
      buttonBg: primary_color || "#000",
      buttonColor: "#ffffff",
    },
    dark: {
      backgroundColor: "#1e1e1e",
      textColor: "#ffffff",
      borderColor: "#444444",
      inputBg: "#2a2a2a",
      inputText: "#ffffff",
      inputBorder: "#444444",
      buttonBg: primary_color || "#ffffff",
      buttonColor: "#000000",
    },
    custom: {
      backgroundColor: secondary_color || "#ffffff",
      textColor: primary_color || "#000000",
      borderColor: secondary_color || "#cccccc",
      inputBg: secondary_color || "#ffffff",
      inputText: primary_color || "#000000",
      inputBorder: secondary_color || "#cccccc",
      buttonBg: primary_color || "#000000",
      buttonColor: "#ffffff",
    },
  };

  const {
    backgroundColor,
    textColor,
    borderColor,
    inputBg,
    inputText,
    inputBorder,
    buttonBg,
    buttonColor,
  } = themeConfig[theme] || themeConfig.light;

  const widgetStyle = {
    backgroundColor,
    color: textColor,
    fontFamily: font_family,
    borderRadius: "16px",
    width: "300px",
    height: "400px",
    boxShadow: "0 2px 15px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "16px",
  };

  const avatarStyle = {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
    border: `2px solid ${textColor}`,
  };

  const avatarFloatingStyle = {
    width: "76px",
    height: "76px",
    borderRadius: "50%",
    objectFit: "cover",
    border: `2px solid ${buttonColor}`,
  };

  const inputContainerStyle = {
    position: "relative",
    marginTop: "10px",
    width: "100%",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 40px 10px 35px",
    borderRadius: "12px",
    border: `1.5px solid ${inputBorder}`,
    fontFamily: font_family,
    fontSize: "14px",
    outline: "none",
    color: inputText,
    backgroundColor: inputBg,
  };

  const iconStyleLeft = {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: inputText,
    fontSize: "16px",
    cursor: "pointer",
  };

  const iconStyleRight = {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: inputText,
    fontSize: "16px",
    cursor: "pointer",
  };

  const positionStyles = {
    "bottom-right": { bottom: "20px", right: "20px" },
    "bottom-left": { bottom: "20px", left: "20px" },
    "top-right": { top: "20px", right: "20px" },
    "top-left": { top: "20px", left: "20px" },
    "center-left": { top: "50%", left: "20px", transform: "translateY(-50%)" },
    "center-right": { top: "50%", right: "20px", transform: "translateY(-50%)" },
  };

  const wrapperStyle = {
    position: "fixed",
    zIndex: 9999,
    ...positionStyles[position],
  };

  return (
    <div style={wrapperStyle}>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
          style={{
            backgroundColor: buttonBg,
            borderRadius: "50%",
            width: "80px",
            height: "80px",
            border: "none",
            cursor: "pointer",
            color: buttonColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            overflow: "hidden",
            padding: 0,
          }}
        >
          {avatar_url ? (
            <img src={avatar_url} alt="Avatar" style={avatarFloatingStyle} />
          ) : (
            <FaRobot size={36} color={textColor} />
          )}
        </button>
      ) : (
        <div style={widgetStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {avatar_url && <img src={avatar_url} alt="Bot Avatar" style={avatarStyle} />}
            <strong style={{ fontSize: "14px", color: textColor }}>Soy el bot</strong>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: textColor,
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ flex: 1, marginTop: "15px", fontSize: "14px", color: textColor }}>
            Hola, ¿en qué puedo ayudarte?
          </div>

          <div style={inputContainerStyle}>
            <FaImage style={iconStyleLeft} />
            <input type="text" placeholder="Escribe un mensaje..." style={inputStyle} />
            <FaPaperPlane style={iconStyleRight} />
          </div>
        </div>
      )}
    </div>
  );
}

ChatWidget.propTypes = {
  theme: PropTypes.oneOf(["light", "dark", "custom"]).isRequired,
  primary_color: PropTypes.string,
  secondary_color: PropTypes.string,
  font_family: PropTypes.string,
  avatar_url: PropTypes.string,
  position: PropTypes.oneOf([
    "bottom-right",
    "bottom-left",
    "top-right",
    "top-left",
    "center-left",
    "center-right",
  ]),
};
