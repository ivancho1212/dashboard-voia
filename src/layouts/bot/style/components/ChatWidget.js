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
import { getBotContext } from "services/botService";

const viaLogo = process.env.PUBLIC_URL + "/VIA.png";
const defaultAvatar = "/VIA.png";

function ChatWidget({
  style = {},
  theme: initialTheme,
  botId: propBotId,
  userId: propUserId,
  isDemo: initialDemo = false,
}) {
  const connectionRef = useRef(null);
  const botId = propBotId ?? 2;
  const userId = propUserId ?? 2;

  const [botStyle, setBotStyle] = useState(null);
  const [isDemo, setIsDemo] = useState(initialDemo);
  const [botContext, setBotContext] = useState(null);

  useEffect(() => {
    const fetchBotStyleAndContext = async () => {
      try {
        // 🔹 Estilos
        const res = await fetch(`http://localhost:5006/api/Bots/${botId}`);
        const data = await res.json();
        if (data.style) {
          setBotStyle(data.style);
          setIsDemo(false);
          console.log("✅ Estilos cargados del backend:", data.style);
        } else {
          console.warn("⚠️ Este bot no tiene estilos definidos, se usará demo.");
        }

        // 🔹 Contexto
        const context = await getBotContext(botId);
        if (context) {
          // Preparamos los mensajes para la IA
          const systemMsg = context.messages.find(m => m.role === "system");
          const otherMsgs = context.messages.filter(m => m.role !== "system");

          const messagesForAI = [];
          if (systemMsg) messagesForAI.push(systemMsg);
          messagesForAI.push(...otherMsgs);

          // Creamos un payload completo que luego usarás al enviar a la IA
          const aiPayload = {
            botId: context.botId,
            name: context.name,
            description: context.description,
            provider: context.provider,
            settings: context.settings,
            messages: messagesForAI,
            training: context.training,
            capture: context.capture,
          };

          setBotContext(aiPayload);
          console.log("🧠 Payload preparado para IA:", aiPayload);
        }
      } catch (err) {
        console.error("❌ Error cargando datos del bot:", err);
      }
    };

    fetchBotStyleAndContext();
  }, [botId]);


  // Configuración de temas
  const fallbackTextColor = "#1a1a1a";
  const fallbackBgColor = "#f5f5f5";
  const normalizedStyle = {
    ...style,
    primaryColor: style.primaryColor || style.PrimaryColor || style.primary_color || "#000000",
    secondaryColor: style.secondaryColor || style.SecondaryColor || style.secondary_color || "#ffffff",
    fontFamily: style.fontFamily || style.FontFamily || style.font_family || "Arial",
    avatarUrl: style.avatarUrl || style.AvatarUrl || style.avatar_url || "",
    headerBackgroundColor: style.headerBackgroundColor || style.HeaderBackgroundColor || style.header_background_color || "",
    allowImageUpload: style.allowImageUpload ?? style.AllowImageUpload ?? style.allow_image_upload ?? false,
    allowFileUpload: style.allowFileUpload ?? style.AllowFileUpload ?? style.allow_file_upload ?? false,
    position: style.position || style.Position || "bottom-right",
    title: style.title || style.Title || "",
    theme: style.theme || style.Theme || "light",
    customCss: style.customCss || style.CustomCss || style.custom_css || "",
  };
  const effectiveStyle = botStyle || normalizedStyle;
  const {
    allowImageUpload,
    allowFileUpload,
    theme: themeKeyRaw,
    primaryColor,
    secondaryColor,
    headerBackgroundColor,
    fontFamily,
    avatarUrl,
    position,
    title,
    customCss
  } = effectiveStyle;

  const themeKey = themeKeyRaw || initialTheme || "light";
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
      backgroundColor: primaryColor.toLowerCase() === secondaryColor.toLowerCase() ? fallbackBgColor : secondaryColor,
      headerBackground: headerBackgroundColor?.trim() || secondaryColor,
      textColor: primaryColor.toLowerCase() === secondaryColor.toLowerCase() ? fallbackTextColor : primaryColor,
      borderColor: secondaryColor,
      inputBg: primaryColor.toLowerCase() === secondaryColor.toLowerCase() ? fallbackBgColor : secondaryColor,
      inputText: primaryColor.toLowerCase() === secondaryColor.toLowerCase() ? fallbackTextColor : primaryColor,
      inputBorder: secondaryColor,
      buttonBg: primaryColor,
      buttonColor: secondaryColor.toLowerCase() === "#ffffff" || secondaryColor.toLowerCase() === "#fff" ? "#000000" : "#ffffff",
    },
  };
  const themeDefaults = themeConfig[themeKey] || themeConfig.light;
  const headerBackground = headerBackgroundColor?.trim() ? headerBackgroundColor : themeDefaults.headerBackground;
  const backgroundColor = themeDefaults.backgroundColor;
  const textColor = themeDefaults.textColor;
  const inputBg = themeDefaults.inputBg;
  const inputText = themeDefaults.inputText;
  const inputBorder = themeDefaults.inputBorder;

  // Estados React
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const debugSetMessages = (newMessages) => {
    if (newMessages.length === 0) {
      console.trace("⚠️ setMessages([]) llamado desde:", new Error().stack);
    }
    setMessages(newMessages);
  };
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageGroup, setImageGroup] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const [iaWarning, setIaWarning] = useState(null);
  const textareaRef = useRef(null);
  const [typingSender, setTypingSender] = useState(null);
  const typingTimeoutRef = useRef(null);
  const CACHE_KEY = `chat_${botId}_${userId}`;
  const CACHE_TIMEOUT = 1 * 60 * 1000;

  // 🟢 Mueve la función normalizeMessage aquí para que sea accesible
  const normalizeMessage = (msg) => ({
    id: msg.id ?? Date.now(),
    from:
      msg.from ??
      (msg.sender === "user" ? "user" : msg.sender === "admin" ? "admin" : "ai"),
    text: msg.text ?? msg.content ?? msg.message ?? msg.body ?? "",
    file: msg.file ?? null,
    multipleFiles: msg.multipleFiles ?? msg.files ?? [],
    images: msg.images ?? msg.imageGroup ?? [],
    timestamp: msg.timestamp ?? new Date().toISOString(),
  });

  // ✅ Única lógica de carga de caché al inicio.
  useEffect(() => {
    const cached = loadConversationCache();
    if (cached) {
      setConversationId(cached.conversationId);
      setMessages(cached.messages.map(normalizeMessage)); // 🔑 Normalizar siempre
      console.log("📂 Cargando conversación desde caché:", cached);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          const isExpired = Date.now() - data.timestamp > CACHE_TIMEOUT;
          if (isExpired) {
            console.log("⏰ Caché expirado en segundo plano, limpiando...");

            // 🔥 Limpiar cache Y estados React
            localStorage.removeItem(CACHE_KEY);
            setConversationId(null);
            setMessages([]);
          }
        } catch (e) {
          console.error("⚠️ Error parseando caché, limpiando:", e);
          localStorage.removeItem(CACHE_KEY);
          setConversationId(null);
          setMessages([]);
        }
      }
    }, 60 * 1000); // revisar cada minuto

    return () => clearInterval(interval);
  }, []);


  // ✅ Lógica de guardado de caché que se activa con cada cambio de mensajes.
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      saveConversationCache(conversationId, messages);
      console.log("💾 Caché de conversación actualizado. Mensajes guardados:", messages.length);
    }
  }, [messages, conversationId]);

  const messageRefs = useRef([]);
  messageRefs.current = messages.map((_, i) => messageRefs.current[i] ?? React.createRef());
  const typingRef = useRef(null);

  const saveConversationCache = (convId, msgs) => {
    if (!convId) return;
    if (!msgs || msgs.length === 0) return;

    // 🔑 Cargar el cache existente
    const existing = loadConversationCache();

    let mergedMessages = msgs;
    if (existing && existing.conversationId === convId) {
      // Fusiona mensajes anteriores con los nuevos (evita duplicados por id)
      const map = new Map();
      [...existing.messages, ...msgs].forEach(m => map.set(m.id, m));
      mergedMessages = Array.from(map.values());
    }

    const data = { conversationId: convId, messages: mergedMessages, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  };


  const loadConversationCache = () => {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    try {
      const data = JSON.parse(raw);
      const isExpired = Date.now() - data.timestamp > CACHE_TIMEOUT;
      if (isExpired) {
        console.log("⏰ Caché expirado, eliminando...");

        // 🔥 Limpiar cache y estado de React
        localStorage.removeItem(CACHE_KEY);
        setConversationId(null);
        setMessages([]);

        return null;
      }
      return data;
    } catch (e) {
      console.error("⚠️ Error parseando caché, limpiando:", e);
      localStorage.removeItem(CACHE_KEY);
      setConversationId(null);
      setMessages([]);
      return null;
    }
  };


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
    const connection = connectionRef.current;

    const handleReceiveMessage = (msg) => {
      console.log("📩 Mensaje recibido:", msg);
      const normalized = normalizeMessage(msg);

      // Simular escritura antes de mostrar el mensaje
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, normalized]);
        setIsTyping(false);
      }, 1500 + Math.random() * 1000); // 1.5s - 2.5s
    };

    const handleTyping = (sender) => {
      setTypingSender(sender);
      setIsTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTypingSender(null);
      }, 3000);
    };

    const setupConnection = async () => {
      try {
        if (!connection) return;

        if (connection.state === "Disconnected") {
          await connection.start();
        }

        if (!connection.handlersAttached) {
          connection.on("ReceiveMessage", handleReceiveMessage);
          connection.on("Typing", handleTyping);
          connection.handlersAttached = true; // marca para no volver a adjuntar
        }

        // ✅ Solo nos unimos si hay conversationId (del caché o del estado).
        if (conversationId) {
          await connection.invoke("JoinRoom", conversationId);
          return;
        }

        // Si no existe, pedimos uno nuevo
        const convId = await connection.invoke("InitializeContext", { botId, userId });
        if (convId) {
          setConversationId(convId);
          await connection.invoke("JoinRoom", convId);
        }

      } catch (err) {
        console.error("❌ Error conectando a SignalR:", err);
      }
    };

    setupConnection();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.off("ReceiveMessage", handleReceiveMessage);
        connectionRef.current.off("Typing", handleTyping);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [isOpen, botId, userId, isDemo, conversationId]);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!isOpen || !conversationId) return;
    let intervalId = null;
    let isUnmounted = false;
    const sendHeartbeat = async () => {
      try {
        const conn = connectionRef.current;
        if (!conn) return;
        if (conn.state === "Disconnected") {
          console.log("🔄 Reconectando SignalR para heartbeat...");
          await conn.start();
        }
        if (conn.state === "Connected") {
          await conn.invoke("UserIsActive", conversationId);
          console.log(`❤️ Heartbeat enviado para conversación ${conversationId}`);
        }
      } catch (err) {
        console.error("❌ Error enviando heartbeat:", err);
      }
    };
    sendHeartbeat();
    intervalId = setInterval(() => {
      if (!isUnmounted) sendHeartbeat();
    }, 30000);
    return () => {
      isUnmounted = true;
      if (intervalId) clearInterval(intervalId);
      console.log(`💔 Heartbeat detenido para conversación ${conversationId}`);
    };
  }, [isOpen, conversationId]);

  useEffect(() => {
    const handlePageClose = () => {
      if (conversationId) {
        saveConversationCache(conversationId, messages);
        const url = `http://localhost:5006/api/conversations/${conversationId}/disconnect`;
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url);
          console.log(`🚪 Enviando señal de desconexión beacon para ${conversationId}`);
        }
      }
    };
    window.addEventListener("beforeunload", handlePageClose);
    return () => {
      window.removeEventListener("beforeunload", handlePageClose);
    };
  }, [conversationId]);

  const [demoMessageCount, setDemoMessageCount] = useState(0);
  const maxDemoMessages = 5;

  const sendMessage = async () => {
    if (!message.trim()) return;

    if (isDemo) {
      if (demoMessageCount >= maxDemoMessages) {
        setIaWarning("Límite de mensajes en modo demo alcanzado.");
        return;
      }
      const userMsg = normalizeMessage({
        id: Date.now(),
        sender: "user",
        content: message,
        timestamp: new Date().toISOString(),
        type: "text",
      });
      const botMsg = normalizeMessage({
        id: Date.now() + 1,
        sender: "bot",
        content: "Respuesta simulada de la IA en modo demo.",
        timestamp: new Date().toISOString(),
        type: "text",
      });
      setMessages((prev) => {
        const newMessages = [...prev, userMsg];
        return newMessages;
      });
      setMessage("");
      setTimeout(() => {
        setMessages((prev) => {
          const newMessages = [...prev, botMsg];
          return newMessages;
        });
        setDemoMessageCount((prev) => prev + 1);
      }, 1000);
      return;
    }

    if (!conversationId) return;
    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      console.error("Error: La conexión de SignalR no está activa.");
      return;
    }

    const payload = { botId, userId, question: message.trim() };
    const userMessageForDisplay = normalizeMessage({ from: "user", text: message });

    setMessages((prev) => [...prev, userMessageForDisplay]);
    setMessage("");

    try {
      await connection.invoke("SendMessage", payload);
    } catch (err) {
      console.error("❌ Error enviando mensaje a SignalR:", err);
      const errorMessage = normalizeMessage({
        from: "ai",
        text: "Lo siento, hubo un problema al enviar tu mensaje. Por favor, intenta de nuevo.",
      });
      setMessages((prev) => [...prev, errorMessage]);
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
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
    }
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    // YIQ formula for contrast
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
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
          const newMsgRaw = {
            id: Date.now() + i,
            sender: item.sender,
            content: item.content,
            type: item.type || "text",
            timestamp: new Date().toISOString(),
            userId:
              item.sender === "user"
                ? "demo-user-id"
                : item.sender === "bot"
                  ? "bot-id"
                  : "admin-id",
            imageGroup: item.imageGroup || [],
            files: item.files || [],
          };

          const newMsg = normalizeMessage(newMsgRaw);

          setMessages((prev) => [...prev, newMsg]);

          setIsTyping(false);
          setTypingSender(null);
        }, totalDelay);
      });
    }
  }, [isDemo, isOpen, messages.length]);

  const isInputDisabled = isDemo || !conversationId;

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
              src={avatarUrl?.trim() ? avatarUrl : defaultAvatar}
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
                src={avatarUrl?.trim() ? avatarUrl : defaultAvatar}
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
            key={`${normalizedStyle.allowImageUpload}-${normalizedStyle.allowFileUpload}`}
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
            disabled={isDemo}             // ✅ cambio aquí
            isDemo={isDemo}               // ✅ pasar demo explícitamente
            allowImageUpload={effectiveStyle.allowImageUpload}
            allowFileUpload={effectiveStyle.allowFileUpload}
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
