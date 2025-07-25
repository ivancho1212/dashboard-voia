import { TransitionGroup, CSSTransition } from "react-transition-group";
import React, { useState, useEffect, useRef } from "react";
import { FaPaperclip, FaPaperPlane, FaImage } from "react-icons/fa";
import PropTypes from "prop-types";
import { createHubConnection } from "services/signalr";
import InputArea from "./chat/InputArea";
import MessageBubble from "./chat/MessageBubble";
import MessageList from "./chat/MessageList";
import TypingDots from "./chat/TypingDots";
import ImagePreviewModal from "./chat/ImagePreviewModal";
import voiaLogo from "assets/images/VOIA-LOGO.png";

const voaiGif = "/VIA.png";

function ChatWidget({
  title = "",
  theme: initialTheme,
  primaryColor = "#000000",
  secondaryColor = "#ffffff",
  headerBackgroundColor = "#f5f5f5",
  fontFamily = "Arial",
  avatarUrl,
  position = "bottom-right",
  botId: propBotId,
  userId: propUserId,
}) {
  const connectionRef = useRef(null);
  const botId = propBotId ?? 1;
  const userId = propUserId ?? 45;

  const [isOpen, setIsOpen] = useState(false);
  const themeKey = initialTheme || "light";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageGroup, setImageGroup] = useState([]); // todas las imágenes
  const [activeImageIndex, setActiveImageIndex] = useState(0); // imagen activa

  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);

  const [iaWarning, setIaWarning] = useState(null);
  const textareaRef = useRef(null);
  const [typingSender, setTypingSender] = useState(null);
  const typingTimeoutRef = useRef(null);

  // 🧠 Refs para animación individual de mensajes
  const messageRefs = useRef([]);
  messageRefs.current = messages.map((_, i) => messageRefs.current[i] ?? React.createRef());
  const typingRef = useRef(null);

  // ✅ USEEFFECT PRINCIPAL CORREGIDO
  useEffect(() => {
    if (!isOpen) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    if (!connectionRef.current) {
      connectionRef.current = createHubConnection();
    }
    
    const connection = connectionRef.current; // ✅ Definir connection aquí

    // --- Definición de Handlers (ahora con acceso a connection) ---
    const handleReceiveMessage = (msg) => {
      console.log("📩 Mensaje recibido:", msg);
      setMessages(prev => [...prev, msg]);
      setIsTyping(false);
    };

    const handleTyping = (sender) => {
      console.log("⌨️ Usuario escribiendo:", sender);
      setTypingSender(sender);
      setIsTyping(true);
      
      // Limpiar timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Ocultar typing después de 3 segundos
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTypingSender(null);
      }, 3000);
    };

    // --- Lógica de Conexión y Listeners ---
    const setupConnection = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
          console.log("🟢 Conexión SignalR establecida");
        }

        const convId = await connection.invoke("InitializeContext", { botId, userId });
        if (convId) {
          setConversationId(convId);
          await connection.invoke("JoinRoom", convId);
          console.log(`🏠 Unido a la sala: ${convId}`);
        }

        connection.on("ReceiveMessage", handleReceiveMessage);
        connection.on("Typing", handleTyping);

      } catch (err) {
        console.error("❌ Error conectando a SignalR en Widget:", err);
      }
    };

    setupConnection();

    return () => {
      if (connectionRef.current) {
        console.log("🧹 Limpiando conexión del widget al cerrar.");
        connectionRef.current.off("ReceiveMessage", handleReceiveMessage);
        connectionRef.current.off("Typing", handleTyping);
      }
      
      // Limpiar timeout de typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isOpen, botId, userId]);

  // useEffect para hacer scroll hacia abajo con nuevos mensajes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // ✅ USEEFFECT HEARTBEAT CORREGIDO
  useEffect(() => {
    // Solo ejecutar si el widget está abierto y ya tenemos un ID de conversación
    if (isOpen && conversationId) {
      const connection = connectionRef.current; // ✅ Definir connection localmente
      
      if (!connection || connection.state !== "Connected") {
        console.warn("No SignalR connection active for heartbeat.");
        return;
      }

      console.log(`❤️ Iniciando heartbeat para conversación ${conversationId}`);
      
      // 1. Envía una señal inicial inmediata para marcar como activo
      connection.invoke("UserIsActive", conversationId).catch(err => 
        console.error("Error en heartbeat inicial:", err)
      );
      
      // 2. Configura el heartbeat para que se ejecute cada 30 segundos
      const intervalId = setInterval(() => {
        // Nos aseguramos de que la conexión siga activa antes de enviar
        const currentConnection = connectionRef.current; // ✅ Usar ref actual
        if (currentConnection && currentConnection.state === "Connected") {
          currentConnection.invoke("UserIsActive", conversationId).catch(err => 
            console.error("Error en heartbeat periódico:", err)
          );
        }
      }, 30000); // 30 segundos
      
      // 3. La función de limpieza es crucial: se ejecuta si el widget se cierra o cambia el ID
      return () => {
        console.log(`💔 Deteniendo heartbeat para ${conversationId}`);
        clearInterval(intervalId);
      };
    }
  }, [isOpen, conversationId]);

  // ✅ USEEFFECT PARA SEÑAL DE DESCONEXIÓN
  useEffect(() => {
    const handlePageClose = () => {
      // Solo enviar si tenemos un ID de conversación
      if (conversationId) {
        const url = `http://localhost:5006/api/conversations/${conversationId}/disconnect`;

        // navigator.sendBeacon es la forma más fiable de enviar una
        // petición final mientras la página se está cerrando.
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url);
          console.log(`🚪 Enviando señal de desconexión beacon para ${conversationId}`);
        }
      }
    };
    
    // El evento 'beforeunload' se dispara justo antes de que el usuario deje la página
    window.addEventListener("beforeunload", handlePageClose);

    // Limpiamos el evento cuando el componente se desmonte
    return () => {
      window.removeEventListener("beforeunload", handlePageClose);
    };
  }, [conversationId]); // Se actualiza si cambia el ID de la conversación

  const sendMessage = async () => {
    if (!message.trim() || !conversationId) return;

    const connection = connectionRef.current; // ✅ Usa la referencia
    if (!connection || connection.state !== "Connected") {
      console.error("Error: La conexión de SignalR no está activa.");
      return;
    }

    const payload = { botId, userId, question: message.trim() };

    try {
      await connection.invoke("SendMessage", conversationId, payload);
      setMessage(""); // Limpia el input después de enviar
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

  const { backgroundColor, textColor, headerBackground, inputBg, inputText, inputBorder } =
    themeConfig[themeKey] || themeConfig.light;

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
    maxHeight: "700px",
    boxShadow: "0 2px 15px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
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

  const openImageModal = (images, clickedImageUrl) => {
    // Limpiar primero
    setImageGroup([]);
    setActiveImageIndex(0);
    setIsImageModalOpen(false);

    // Esperar al siguiente frame para asegurar que el estado se "limpie"
    setTimeout(() => {
      const index = images.findIndex((img) => {
        const url = img.fileUrl.startsWith("http")
          ? img.fileUrl
          : `http://localhost:5006${img.fileUrl}`;
        return url === clickedImageUrl;
      });

      setImageGroup(images);
      setActiveImageIndex(index >= 0 ? index : 0);
      setIsImageModalOpen(true);
    }, 10); // Pequeño delay para asegurar la limpieza
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
              src={avatarUrl?.trim() ? avatarUrl : voaiGif}
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
                src={avatarUrl?.trim() ? avatarUrl : voaiGif}
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
            <div
              style={{
                fontSize: "10.5px",
                color: isColorDark(backgroundColor) ? "#e0e0e0" : "#333333",
                backgroundColor: isColorDark(backgroundColor)
                  ? "rgba(255, 255, 255, 0.07)"
                  : "rgba(0, 0, 0, 0.04)",
                padding: "10px 16px",
                borderRadius: "14px",
                width: "100%", // 🔄 hace que ocupe todo el ancho del chat
                margin: "-6px 0 10px 0", // 🔽 margen superior reducido, espacio inferior normal
                textAlign: "center", // 🔁 centrado opcional
                boxSizing: "border-box", // 🧱 asegura que padding no desborde
              }}
            >
              Nuestro asistente virtual está potenciado por IA y supervisión humana para ofrecer
              respuestas precisas y seguras.
            </div>

            <MessageList
              messages={messages}
              messageRefs={messageRefs}
              fontFamily={fontFamily}
              openImageModal={openImageModal}
              isTyping={isTyping}
              typingSender={typingSender}
              typingRef={typingRef}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
            />

            <div ref={messagesEndRef} />
          </div>

          {/* 📝 Input + Adjuntar + Enviar */}
          <InputArea
            inputText={inputText}
            inputBg={inputBg}
            inputBorder={inputBorder}
            fontFamily={fontFamily}
            message={message}
            setMessage={setMessage}
            textareaRef={textareaRef}
            sendMessage={sendMessage}
            connectionRef={connectionRef}
            conversationId={conversationId}
            userId={userId}
          />

          <div
            style={{
              textAlign: "right",
              fontSize: "11px",
              color: "#999",
              paddingBottom: "8px",
              marginRight: "15px",
              fontFamily: fontFamily || "Arial",
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "4px",
            }}
          >
            © {new Date().getFullYear()}{" "}
            <b style={{ color: primaryColor, display: "flex", alignItems: "center", gap: "4px" }}>
              VIA
              <img
                src={voiaLogo}
                alt="Logo VIA"
                style={{ width: "20px", height: "20px", objectFit: "contain" }}
              />
            </b>
            . Todos los derechos reservados.
          </div>

          <ImagePreviewModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            imageGroup={imageGroup}
            activeImageIndex={activeImageIndex}
            setActiveImageIndex={setActiveImageIndex}
          />
        </div>
      )}
    </div>
  );
}

// ✅ PropTypes
ChatWidget.propTypes = {
  botId: PropTypes.number.isRequired,
  userId: PropTypes.number.isRequired,
  title: PropTypes.string,
  theme: PropTypes.oneOf(["light", "dark", "custom"]).isRequired,
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  headerBackgroundColor: PropTypes.string,
  fontFamily: PropTypes.string,
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