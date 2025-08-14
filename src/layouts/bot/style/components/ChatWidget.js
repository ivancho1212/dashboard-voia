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


const viaLogo = process.env.PUBLIC_URL + "/VIA.png";

function ChatWidget({
  style = {},
  theme: initialTheme,
  botId: propBotId,
  userId: propUserId,
  isDemo = false,
}) {
  const connectionRef = useRef(null);
  const botId = propBotId ?? 1;
  const userId = propUserId ?? 45;

  // Configuración de temas (debe ir antes de cualquier uso)
  const fallbackTextColor = "#1a1a1a";
  const fallbackBgColor = "#f5f5f5";

  // Normalizar claves de estilos desde backend (PascalCase, snake_case, camelCase)
  const normalizedStyle = {
    ...style,
    primaryColor:
      style.primaryColor || style.PrimaryColor || style.primary_color || "#000000",
    secondaryColor:
      style.secondaryColor || style.SecondaryColor || style.secondary_color || "#ffffff",
    fontFamily:
      style.fontFamily || style.FontFamily || style.font_family || "Arial",
    avatarUrl:
      style.avatarUrl || style.AvatarUrl || style.avatar_url || "",
    headerBackgroundColor:
      style.headerBackgroundColor || style.HeaderBackgroundColor || style.header_background_color || "",
    allowImageUpload:
      style.allowImageUpload ?? style.AllowImageUpload ?? style.allow_image_upload ?? false,
    allowFileUpload:
      style.allowFileUpload ?? style.AllowFileUpload ?? style.allow_file_upload ?? false,
    position:
      style.position || style.Position || "bottom-right",
    title:
      style.title || style.Title || "",
    theme:
      style.theme || style.Theme || "light",
    customCss:
      style.customCss || style.CustomCss || style.custom_css || "",
  };

  const allowImageUpload = normalizedStyle.allowImageUpload;
  const allowFileUpload = normalizedStyle.allowFileUpload;
  const themeKey = normalizedStyle.theme || initialTheme || "light";
  const primaryColor = normalizedStyle.primaryColor;
  const secondaryColor = normalizedStyle.secondaryColor;
  const headerBackgroundColor = normalizedStyle.headerBackgroundColor;

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
      headerBackground: headerBackgroundColor?.trim() || secondaryColor,
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

  const themeDefaults = themeConfig[themeKey] || themeConfig.light;
  const headerBackground = headerBackgroundColor?.trim()
    ? headerBackgroundColor
    : themeDefaults.headerBackground;
  const backgroundColor = themeDefaults.backgroundColor;
  const textColor = themeDefaults.textColor;
  const inputBg = themeDefaults.inputBg;
  const inputText = themeDefaults.inputText;
  const inputBorder = themeDefaults.inputBorder;
  const fontFamily = normalizedStyle.fontFamily;
  const avatarUrl = normalizedStyle.avatarUrl;
  const position = normalizedStyle.position;
  const title = normalizedStyle.title;

  const [isOpen, setIsOpen] = useState(false);
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
    if (isDemo || !isOpen) {
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
      setMessages((prev) => [...prev, msg]);
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
      connection
        .invoke("UserIsActive", conversationId)
        .catch((err) => console.error("Error en heartbeat inicial:", err));

      // 2. Configura el heartbeat para que se ejecute cada 30 segundos
      const intervalId = setInterval(() => {
        // Nos aseguramos de que la conexión siga activa antes de enviar
        const currentConnection = connectionRef.current; // ✅ Usar ref actual
        if (currentConnection && currentConnection.state === "Connected") {
          currentConnection
            .invoke("UserIsActive", conversationId)
            .catch((err) => console.error("Error en heartbeat periódico:", err));
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

  const [demoMessageCount, setDemoMessageCount] = useState(0);
  const maxDemoMessages = 5;

  const sendMessage = async () => {
    if (!message.trim()) return;

    if (isDemo) {
      if (demoMessageCount >= maxDemoMessages) {
        setIaWarning("Límite de mensajes en modo demo alcanzado.");
        return;
      }

      const userMsg = {
        id: Date.now(),
        sender: "user",
        content: message,
        timestamp: new Date().toISOString(),
        type: "text",
      };

      const botMsg = {
        id: Date.now() + 1,
        sender: "bot",
        content: "Respuesta simulada de la IA en modo demo.",
        timestamp: new Date().toISOString(),
        type: "text",
      };

      setMessages((prev) => [...prev, userMsg]);
      setMessage("");
      setTimeout(() => {
        setMessages((prev) => [...prev, botMsg]);
        setDemoMessageCount((prev) => prev + 1);
      }, 1000); // simula "pensamiento" de la IA

      return;
    }

    // 🔽 lógica real de producción
    if (!conversationId) return;
    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      console.error("Error: La conexión de SignalR no está activa.");
      return;
    }

    const payload = { botId, userId, question: message.trim() };

    try {
      await connection.invoke("SendMessage", conversationId, payload);
      setMessage("");
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
    }
  };


  const isColorDark = (hexColor) => {
    if (!hexColor) return false;
    const color = hexColor.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  // Mejor contraste para el título del widget
  function getContrastTextColor(bgColor) {
    if (!bgColor) return "#000000";
    let color = bgColor.replace("#", "");
    if (color.length === 3) {
      color = color[0]+color[0]+color[1]+color[1]+color[2]+color[2];
    }
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    // YIQ formula for contrast
    const yiq = (r*299 + g*587 + b*114) / 1000;
    return yiq >= 180 ? "#000000" : "#ffffff";
  }
  const headerTextColor = getContrastTextColor(headerBackground);

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

  useEffect(() => {
    if (isDemo && messages.length === 0 && isOpen) {
      const demoSequence = [
        { sender: "user", content: "Hola", delay: 2000 },
        { sender: "bot", content: "Hola, ¿en qué puedo ayudarte hoy?", delay: 3000 },
        {
          sender: "user",
          content: "Quisiera saber en qué horario puedo acercarme a la oficina de ustedes.",
          delay: 3000,
        },
        {
          sender: "bot",
          content:
            "Nuestro horario es de lunes a viernes, de 8 a.m. a 5 p.m. ¿Te gustaría agendar una cita?",
          delay: 3500,
        },
        {
          sender: "user",
          content:
            "Ah, ok ¿pero puedo saber contigo directamente si tienen solución para el arreglo de este logo?",
          delay: 3000,
        },
        {
          sender: "bot",
          content:
            "Claro, puedo orientarte. Cuéntame un poco más o comparte la imagen del logo que necesitas arreglar",
          delay: 3500,
        },
        { sender: "user", content: "O sea, ¿te puedo enviar esta imagen?", delay: 3000 },
        {
          sender: "user",
          content: "",
          type: "image",
          imageGroup: [
            {
              url: "public/VIA.png",
              name: "logo-via.png",
            },
          ],
          delay: 2000,
        },
        {
          sender: "bot",
          content:
            "Recibí tu archivo. Será revisado por un Usuario administrativo que te contactará en breve.",
          delay: 3000,
        },
        {
          sender: "admin",
          content:
            "Hola, habla Jeronimo Herrera. Estoy viendo la imagen que acabas de enviar. Con esto ya procedemos a ayudarte con la correción del logo",
          delay: 3500,
        },
        { sender: "user", content: "Muchas gracias por la ayuda.", delay: 2500 },
        { sender: "admin", content: "¡Con gusto! Feliz día.", delay: 2500 },
      ];
  
      let totalDelay = 0;
  
      demoSequence.forEach((item, i) => {
        totalDelay += item.delay;
  
        // 🧠 Simula "escribiendo" antes de los mensajes del bot o admin
        if (item.sender === "bot" || item.sender === "admin") {
          setTimeout(() => {
            setTypingSender(item.sender);
            setIsTyping(true);
          }, totalDelay - 1500);
        }
  
        // 📨 Mostrar el mensaje real
        setTimeout(() => {
          const newMsg = {
            id: Date.now() + i,
            from: item.sender,
            text: item.content,
            type: item.type || "text",
            timestamp: new Date().toISOString(),
            userId:
              item.sender === "user"
                ? "demo-user-id"
                : item.sender === "bot"
                ? "bot-id"
                : "admin-id",
            imageGroup: item.imageGroup || undefined,
            files: item.files || undefined,
          };
  
          setMessages((prev) => [...prev, newMsg]);
          setIsTyping(false);
          setTypingSender(null);
        }, totalDelay);
      });
    }
  }, [isDemo, isOpen, messages.length]);
  
  const isInputDisabled = isDemo;

  return (
    <div style={wrapperStyle}>
      {!isOpen ? (
        // 🔘 Botón flotante cuando está cerrado
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
          style={{
            backgroundColor: headerBackground,
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
              backgroundColor: headerBackground,
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
            key={`${style.allowImageUpload}-${style.allowFileUpload}`} // 🔄 Forzar re-render al cambiar los switches
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
            isInputDisabled={isDemo}
            allowImageUpload={normalizedStyle.allowImageUpload}
            allowFileUpload={normalizedStyle.allowFileUpload}
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
              <img
                src={viaLogo}
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
  style: PropTypes.object,
  userId: PropTypes.number.isRequired,
  title: PropTypes.string,
  theme: PropTypes.oneOf(["light", "dark", "custom"]).isRequired,
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  headerBackgroundColor: PropTypes.string,
  fontFamily: PropTypes.string,
  avatarUrl: PropTypes.string,
  isDemo: PropTypes.bool,
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
