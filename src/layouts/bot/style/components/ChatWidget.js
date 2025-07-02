import React, { useState, useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";
import { FaPaperclip, FaPaperPlane, FaImage } from "react-icons/fa";
import PropTypes from "prop-types";
import voaiGif from "../../../../assets/images/voai.gif";
import connection from "services/signalr";
import { createConversation } from "services/botConversationsService";

function ChatWidget({
  title = "Voia",
  theme: initialTheme,
  primaryColor = "#000000",
  secondaryColor = "#ffffff",
  headerBackgroundColor = "#f5f5f5",
  fontFamily = "Arial",
  avatarUrl,
  position = "bottom-right",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const themeKey = initialTheme || "light";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const botId = 1;
  const userId = 45;
  const conversationId = `bot-${botId}-user-${userId}`;
  const [iaWarning, setIaWarning] = useState(null);

  const waitForConnection = async (retries = 5) => {
    while (connection.state !== "Connected" && retries > 0) {
      console.log("⌛ Esperando conexión SignalR...");
      await new Promise((res) => setTimeout(res, 300));
      retries--;
    }

    if (connection.state !== "Connected") {
      throw new Error("❌ No se pudo establecer conexión con SignalR.");
    }
  };

  // ✅ SignalR Setup
  useEffect(() => {
    const startConnection = async () => {
      try {
        if (connection.state !== "Connected") {
          await connection.start();
          console.log("✅ Conectado a SignalR");
        }

        await waitForConnection();
        await connection.invoke("JoinRoom", conversationId);
      } catch (err) {
        console.error("❌ Error conectando a SignalR:", err);
      }
    };

    startConnection();

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [...prev, { from: msg.from, text: msg.text }]);

      if (msg.text.includes("aún no está conectado")) {
        setIaWarning("Este bot aún no está conectado a una IA. Pronto estará disponible.");
      }

      setIsTyping(false);
    };

    const handleTyping = () => {
      setIsTyping(true);
    };

    const handleClose = (error) => {
      console.warn("🔌 Conexión cerrada:", error);
    };

    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("Typing", handleTyping);
    connection.onclose(handleClose);

    return () => {
      connection.off("ReceiveMessage", handleReceiveMessage);
      connection.off("Typing", handleTyping);
      connection.off("onclose", handleClose);
    };
  }, [conversationId]);

  // ✅ Enviar mensaje
  const sendMessage = async () => {
    if (!message.trim()) return;

    const msg = message.trim();
    setMessage("");
    setIsTyping(true);

    const payload = { botId, userId, question: msg };

    // 🔌 Asegúrate de tener conexión
    if (connection.state !== "Connected") {
      console.warn("🔌 SignalR no está conectado todavía.");
      try {
        await connection.start();
        await waitForConnection();
        await connection.invoke("JoinRoom", conversationId);
      } catch (error) {
        console.error("❌ Error reconectando SignalR:", error);
        return;
      }
    }

    // ✅ Crear conversación si no existe
    try {
      await createConversation({ userId, botId });
      console.log("✅ Conversación creada o ya existente");
    } catch (error) {
      console.warn(
        "⚠️ Conversación ya existente o error al crearla:",
        error?.response?.data || error.message
      );
    }

    // 🚀 Enviar mensaje
    try {
      await connection.invoke("SendMessage", conversationId, payload);
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
    }
  };

  // ✅ Configuración de temas
  const fallbackTextColor = "#1a1a1a";
  const fallbackBgColor = "#f5f5f5";

  const themeConfig = {
    light: {
      backgroundColor: "#ffffff",
      headerBackground: "#f5f5f5",
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
      headerBackground: "#2a2a2a",
      textColor: "#ffffff",
      borderColor: "#444444",
      inputBg: "#2a2a2a",
      inputText: "#ffffff",
      inputBorder: "#444444",
      buttonBg: primaryColor,
      buttonColor: "#000000",
    },
    custom: {
      backgroundColor:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackBgColor
          : secondaryColor,
      headerBackground:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackBgColor
          : secondaryColor,
      textColor:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackTextColor
          : primaryColor,
      borderColor: secondaryColor,
      inputBg:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackBgColor
          : secondaryColor,
      inputText:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackTextColor
          : primaryColor,
      inputBorder: secondaryColor,
      buttonBg: primaryColor,
      buttonColor:
        secondaryColor.toLowerCase() === "#ffffff" || secondaryColor.toLowerCase() === "#fff"
          ? "#000000"
          : "#ffffff",
    },
  };

  const {
    backgroundColor,
    textColor,
    headerBackground,
    borderColor,
    inputBg,
    inputText,
    inputBorder,
    buttonBg,
    buttonColor,
  } = themeConfig[themeKey] || themeConfig.light;

  // ✅ Calcular color de texto del header según fondo
  const isColorDark = (hexColor) => {
    if (!hexColor) return false;
    const color = hexColor.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  const headerBg = headerBackgroundColor || headerBackground;
  const headerTextColor = isColorDark(headerBg) ? "#ffffff" : "#000000";

  // ✅ Estilos
  const widgetStyle = {
    backgroundColor,
    color: textColor,
    fontFamily,
    borderRadius: "16px",
    width: "90vw",
    maxWidth: "400px",
    height: "70vh",
    maxHeight: "650px",
    boxShadow: "0 2px 15px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
  };

  const avatarFloatingStyle = {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    objectFit: "contain",
    border: `2px solid ${primaryColor}`,
  };

  const avatarHeaderStyle = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "contain",
    border: `1px solid ${primaryColor}`,
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
    fontFamily,
    fontSize: "14px",
    outline: "none",
    color: inputText,
    backgroundColor: inputBg,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
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

  // ✅ Manejo de archivos adjuntos
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    if (file.size > maxSizeInBytes) {
      alert(`El archivo no debe superar los ${maxSizeInMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const payload = {
        botId,
        userId,
        fileName: file.name,
        fileType: file.type,
        fileContent: reader.result, // 🔥 base64
      };

      connection
        .invoke("SendFile", conversationId, payload)
        .catch((err) => console.error("❌ Error enviando archivo:", err));
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={wrapperStyle}>
      {!isOpen ? (
        // 🔘 Botón flotante cuando está cerrado
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
          style={{
            backgroundColor: headerBackgroundColor,
            borderRadius: "50%",
            width: "80px",
            height: "80px",
            border: "none",
            cursor: "pointer",
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
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={avatarUrl || voaiGif}
              alt="Avatar"
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </div>
        </button>
      ) : (
        // 💬 Widget abierto
        <div style={widgetStyle}>
          {/* 🔥 Header */}
          <div
            style={{
              backgroundColor: headerBackgroundColor || "#f5f5f5",
              width: "100%",
              height: "100px",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {/* 📌 Avatar + Título */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingLeft: "16px",
              }}
            >
              <img
                src={avatarUrl || voaiGif}
                alt="Avatar"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <span
                style={{
                  fontSize: "18px",
                  color: headerTextColor,
                  fontFamily: fontFamily || "Arial",
                  fontWeight: "600",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {title}
              </span>
            </div>

            {/* ❌ Botón cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              style={{
                background: "transparent",
                border: "none",
                color: headerTextColor,
                fontSize: "18px",
                cursor: "pointer",
                paddingRight: "20px",
              }}
            >
              ✕
            </button>
          </div>
          {iaWarning && (
            <div
              style={{
                color: "white",
                backgroundColor: "red",
                padding: "10px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {iaWarning}
            </div>
          )}

          {/* 📜 Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "16px",
            }}
          >
            <div style={{ fontSize: "14px", color: textColor }}>Hola, ¿en qué puedo ayudarte?</div>

            {messages.map((msg, index) => {
              const isUser = msg.from === "user";

              const messageStyle = {
                alignSelf: isUser ? "flex-end" : "flex-start",
                backgroundColor: isUser ? "#e1f0ff" : "#f0f0f0",
                color: "#1a1a1a",
                padding: "8px 12px",
                borderRadius: "12px",
                maxWidth: "80%",
                wordBreak: "break-word",
                fontSize: "14px",
                fontFamily,
                // 🔥 Cambios aquí:
                border: "none", // ❌ Quitamos el borde
                boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)", // ✅ Sombra suave
              };

              return (
                <div key={index} style={messageStyle}>
                  {msg.text}
                </div>
              );
            })}

            {isTyping && (
              <div
                style={{
                  alignSelf: "flex-start",
                  backgroundColor:
                    primaryColor.toLowerCase() === secondaryColor.toLowerCase()
                      ? fallbackBgColor
                      : secondaryColor,
                  color:
                    primaryColor.toLowerCase() === secondaryColor.toLowerCase()
                      ? fallbackTextColor
                      : primaryColor,
                  padding: "8px 12px",
                  borderRadius: "12px",
                  maxWidth: "60%",
                  fontFamily,
                  fontSize: "14px",
                  fontStyle: "italic",
                  opacity: 0.7,
                  // 🔥 Le aplicamos también sombra
                  border: "none",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
                }}
              >
                Escribiendo...
              </div>
            )}
          </div>

          {/* 📝 Input + Adjuntar + Enviar */}
          <div
            style={{
              position: "relative",
              padding: "10px 10px", // Margen externo (opcional, puedes ajustar)
            }}
          >
            {/* 📎 Adjuntar dentro del input */}
            <label
              style={{
                position: "absolute",
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
            >
              <FaPaperclip style={{ color: inputText, fontSize: "18px" }} />
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </label>

            {/* 📝 Input */}
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              style={{
                width: "100%",
                padding: "10px 42px 10px 42px", // 👈 espacio a ambos lados para íconos
                borderRadius: "12px",
                border: `1.5px solid ${inputBorder}`,
                fontFamily,
                fontSize: "14px",
                outline: "none",
                color: inputText,
                backgroundColor: inputBg,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
              }}
            />

            {/* 🚀 Enviar dentro del input */}
            <FaPaperPlane
              onClick={sendMessage}
              style={{
                position: "absolute",
                right: "20px",
                top: "50%",
                transform: "translateY(-55%)",
                color: inputText,
                fontSize: "18px",
                cursor: "pointer",
              }}
            />
          </div>
          <div
            style={{
              textAlign: "right",
              fontSize: "11px",
              color: "#999",
              paddingBottom: "8px",
              marginRight: "15px",
              fontFamily: fontFamily || "Arial",
            }}
          >
            © {new Date().getFullYear()} <b style={{ color: primaryColor }}>VoIA</b>. Todos los
            derechos reservados.
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Esto va después de la función
ChatWidget.propTypes = {
  title: PropTypes.string,
  theme: PropTypes.oneOf(["light", "dark", "custom"]).isRequired,
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  headerBackgroundColor: PropTypes.string, // 👈 Agrega si usas este color también
  fontFamily: PropTypes.string, // 👈 ✅ Este es el que está faltando
  avatarUrl: PropTypes.string,
  position: PropTypes.oneOf([
    "bottom-right",
    "bottom-left",
    "top-right",
    "top-left",
    "center-left",
    "center-right",
  ]),
};

export default ChatWidget;
