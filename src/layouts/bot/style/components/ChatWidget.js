import React, { useState, useEffect } from "react"; // <-- import useEffect
import socket from "../../../../services/socket"; // ajusta según tu estructura
import { FaPaperPlane, FaImage } from "react-icons/fa";
import PropTypes from "prop-types";
import voaiGif from "../../../../assets/images/voai.gif";

function ChatWidget({
  theme: initialTheme,
  primary_color,
  secondary_color,
  font_family,
  avatar_url,
  position,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState(() => initialTheme || "light");
  useEffect(() => {
    if (initialTheme && initialTheme !== theme) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.connect();

    socket.on("bot_response", (msg) => {
      // Verifica si el mensaje indica éxito y extrae la respuesta de texto
      if (msg.success) {
        setMessages((prev) => [...prev, { from: "bot", text: msg.response }]);
      } else {
        // Maneja error
        setMessages((prev) => [
          ...prev,
          { from: "bot", text: "Error: " + (msg.error || "unknown") },
        ]);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() === "") return;

    // Aquí defines los datos necesarios para enviar al backend
    const payload = {
      botId: "1",
      userId: 1, // <- Asegúrate que aquí sea el usuario que existe en BD
      message: message.trim(),
    };

    socket.emit("user_message", payload);

    setMessages((prev) => [...prev, { from: "user", text: message.trim() }]);
    setMessage("");
  };

  const [primaryColor, setPrimaryColor] = useState(primary_color || "#000000");
  const [secondaryColor, setSecondaryColor] = useState(secondary_color || "#ffffff");

  useEffect(() => {
    if (primary_color && primary_color !== primaryColor) {
      setPrimaryColor(primary_color);
    }
    if (secondary_color && secondary_color !== secondaryColor) {
      setSecondaryColor(secondary_color);
    }
  }, [primary_color, secondary_color]);

  const themeConfig = {
    light: {
      backgroundColor: "#ffffff",
      textColor: "#000000",
      borderColor: "#dddddd",
      inputBg: "#ffffff",
      inputText: "#000000",
      inputBorder: "#dddddd",
      buttonBg: primaryColor,
      buttonColor: "#ffffff",
    },
    dark: {
      backgroundColor: "#1e1e1e",
      textColor: "#ffffff",
      borderColor: "#444444",
      inputBg: "#2a2a2a",
      inputText: "#ffffff",
      inputBorder: "#444444",
      buttonBg: primaryColor,
      buttonColor: "#000000",
    },
    custom: {
      backgroundColor: secondaryColor,
      textColor: primaryColor,
      borderColor: secondaryColor,
      inputBg: secondaryColor,
      inputText: primaryColor,
      inputBorder: secondaryColor,
      buttonBg: primaryColor,
      buttonColor: "#ffffff",
    },
  };

  const { backgroundColor, textColor, inputBg, inputText, inputBorder, buttonBg, buttonColor } =
    themeConfig[theme] || themeConfig.light;

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

  const avatarFloatingStyle = {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    objectFit: "contain",
    border: "none",
  };

  const avatarHeaderStyle = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "contain",
    border: "none",
  };

  const inputContainerStyle = {
    position: "relative",
    marginTop: "10px",
    width: "100%",
  };

  const inputStyle = {
    width: "80%",
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
          aria-expanded={isOpen}
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
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              backgroundColor: "#eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img src={avatar_url || voaiGif} alt="Avatar" style={avatarFloatingStyle} />
          </div>
        </button>
      ) : (
        <div style={widgetStyle}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={avatar_url || voaiGif} alt="Avatar" style={avatarHeaderStyle} />
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

          {/* Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              marginTop: "15px",
              marginBottom: "10px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <div style={{ fontSize: "14px", color: textColor }}>Hola, ¿en qué puedo ayudarte?</div>

            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
                  backgroundColor: msg.from === "user" ? primaryColor : "#eee",
                  color: msg.from === "user" ? "#fff" : "#000",
                  padding: "8px 12px",
                  borderRadius: "12px",
                  maxWidth: "80%",
                  wordBreak: "break-word",
                }}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={inputContainerStyle}>
            <FaImage style={iconStyleLeft} />
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={inputStyle}
            />
            <FaPaperPlane style={iconStyleRight} onClick={sendMessage} />
          </div>
        </div>
      )}
    </div>
  );
}
export default ChatWidget;

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
