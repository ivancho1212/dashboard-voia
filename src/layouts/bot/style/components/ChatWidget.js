import { TransitionGroup, CSSTransition } from "react-transition-group";
import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { FaPaperclip, FaPaperPlane, FaImage } from "react-icons/fa";
import PropTypes from "prop-types";
import { createHubConnection } from "services/signalr";
import InputArea from "./chat/InputArea";
import MessageBubble from "./chat/MessageBubble";
import MessageList from "./chat/MessageList";
import TypingDots from "./chat/TypingDots";
import ImagePreviewModal from "./chat/ImagePreviewModal";
import { getBotContext } from "services/botService";
import { createConversation } from "services/chatService";
import { generateColor } from "../../../../utils/colors";


const viaLogo = process.env.PUBLIC_URL + "/VIA.png";
const defaultAvatar = "/VIA.png";

const normalizeMessage = (msg) => {
  const id = msg.id ?? msg.tempId ?? uuidv4(); // 🔹 Siempre tener un id
  return {
    ...msg,
    id,
    tempId: msg.tempId ?? id,
    status: msg.status ?? "sent",
    from: msg.from ?? (msg.sender === "user" ? "user" : msg.sender === "admin" ? "admin" : "ai"),
    text: msg.text ?? msg.content ?? msg.message ?? msg.body ?? "",
    file: msg.file ?? null,
    multipleFiles: msg.multipleFiles ?? msg.files ?? [],
    images: msg.images ?? msg.imageGroup ?? [],
    timestamp: msg.timestamp ?? new Date().toISOString(),
    color: msg.color ?? generateColor(id),
    uniqueKey: id, // 🔹 clave persistente para eliminar duplicados
  };
};

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
  const conversationIdRef = useRef(null);

  // Move isOpen to the top so it's available for all hooks
  const [isOpen, setIsOpen] = useState(false);
  const [botStyle, setBotStyle] = useState(null);
  const [isDemo, setIsDemo] = useState(initialDemo);
  const [botContext, setBotContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isBotReady, setIsBotReady] = useState(false);
  const [promptSent, setPromptSent] = useState(false);
  const promptSentRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchBotStyleAndContext = async () => {
      try {
        // 🔹 Estilos
        const res = await fetch(`http://localhost:5006/api/Bots/${botId}`);
        const data = await res.json();
        if (data.style) {
          setBotStyle(data.style);
          - setIsDemo(false);
          console.log("✅ Estilos cargados del backend:", data.style);
        } else {
          console.warn("⚠️ Este bot no tiene estilos definidos, se usará demo.");
          - setIsDemo(true);
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

          // Creamos un payload completo para usarlo al enviar a la IA
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

          // 🔹 Guardamos el payload en el estado
          setBotContext(aiPayload);
          setIsBotReady(true); // ✅ El bot está listo para recibir mensajes
          console.log("🧠 Payload preparado para IA:", aiPayload);

          // 🔹 Guardamos el system prompt + vector info para uso interno de la IA
          const systemPrompt = systemMsg?.content || "";
          const trainingData = aiPayload.training || {};
          const vectorInfo = `
          Fuentes disponibles:
          - Documentos: ${trainingData.documents?.length || 0}
          - URLs: ${trainingData.urls?.length || 0}
          - Textos: ${trainingData.customTexts?.join(", ") || "Ninguno"}
                  `;

          const initialPrompt = `
          ${systemPrompt}

          Además, tienes acceso a datos vectorizados relacionados con este bot.
          Utiliza esos datos siempre que sean relevantes para responder.

          ${vectorInfo}
        `;

          // 🔹 Guardar prompt interno en botContext
          setBotContext(prev => ({ ...prev, initialPrompt }));
        }
      } catch (err) {
        console.error("❌ Error cargando datos del bot:", err);
        setIsBotReady(false); // Asegurarse de que no esté listo si falla
      }
    };

    fetchBotStyleAndContext();
  }, [botId]);

  // Mostrar TypingDots y mensaje de bienvenida solo al abrir el widget
  useEffect(() => {
    if (!isOpen || isDemo) return;

    // Verificar si ya existe el mensaje de bienvenida
    const welcomeId = "welcome-message";
    const hasWelcome = messages.some(m => m.id === welcomeId);

    if (!hasWelcome) {
      setTypingSender("ai");
      setIsTyping(true);

      const welcomeMsg = {
        id: welcomeId, // 🔹 ID fijo para evitar duplicados
        from: "ai",
        text: "👋 ¡Hola! Bienvenido. ¿En qué puedo ayudarte hoy?",
        status: "sent", // 🔹 ya considerado enviado
        timestamp: new Date().toISOString(),
      };

      const typingDelay = 1500 + Math.random() * 1000;
      setTimeout(() => {
        setMessages(prev => [...prev, normalizeMessage(welcomeMsg)]);
        setIsTyping(false);
        setTypingSender(null);
        setPromptSent(true);
        promptSentRef.current = true; // 🔹 mantener referencia
      }, typingDelay);
    }
  }, [isOpen, isDemo, messages]);

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
  const [message, setMessage] = useState("");
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

  // ✅ Única lógica de carga de caché al inicio, evitando duplicados
  useEffect(() => {
    const cached = loadConversationCache();
    if (cached) {
      setConversationId(cached.conversationId);

      // 🔹 eliminar duplicados por uniqueKey
      const uniqueMessages = Array.from(
        new Map(
          cached.messages.map(msg => {
            const normalized = normalizeMessage(msg);
            return [normalized.uniqueKey, normalized];
          })
        ).values()
      );

      setMessages(uniqueMessages);

      if (uniqueMessages.some(m => m.from === "user")) {
        setPromptSent(true);
        promptSentRef.current = true;
      }
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
            setPromptSent(false);
            promptSentRef.current = false;
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
    if (!convId || !msgs || msgs.length === 0) return;

    // 🔹 Solo mensajes confirmados
    const confirmedMessages = msgs.filter(m => m.id && m.status === "sent");
    if (confirmedMessages.length === 0) return;

    const existing = loadConversationCache();
    let mergedMessages = confirmedMessages;

    if (existing && existing.conversationId === convId) {
      const map = new Map();
      // 🔹 Fusionar mensajes existentes + confirmados y mantener color
      [...existing.messages, ...confirmedMessages].forEach(m => {
        const key = m.id ?? m.tempId;
        if (!m.color) m.color = generateColor(key);
        map.set(key, m);
      });
      mergedMessages = Array.from(map.values());
    } else {
      mergedMessages = confirmedMessages.map(m => ({ ...m, color: m.color ?? generateColor(m.id ?? m.tempId) }));
    }

    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ conversationId: convId, messages: mergedMessages, timestamp: Date.now() })
    );
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
        setPromptSent(false);
        promptSentRef.current = false;
        return null;
      }
      return data;
    } catch (e) {
      console.error("⚠️ Error parseando caché, limpiando:", e);
      localStorage.removeItem(CACHE_KEY);
      setConversationId(null);
      setMessages([]);
      setPromptSent(false);
      promptSentRef.current = false;
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

    const handleReceiveMessage = (msg) => {
      console.log("📩 Mensaje recibido:", msg);

      const newMessage = normalizeMessage(msg);
      if (!newMessage.color) newMessage.color = generateColor(newMessage.id);

      // Confirmación optimista
      if (newMessage.tempId && newMessage.from === "user") {
        setMessages(prev =>
          prev.map(m =>
            m.id === newMessage.tempId ? { ...newMessage, status: "sent" } : m
          )
        );
        return;
      }

      if (newMessage.from !== "user") {
        // Simulación typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        setTypingSender(newMessage.from === "bot" ? "ai" : newMessage.from);
        setIsTyping(true);

        const typingDelay = Math.min(
          3000,
          500 + (newMessage.text?.length || 0) * 50
        );

        typingTimeoutRef.current = setTimeout(() => {
          setMessages(prev => {
            const all = [...prev, newMessage];
            const map = new Map();
            all.forEach(m => map.set(m.id ?? m.tempId, m));
            return Array.from(map.values());
          });

          setIsTyping(false);
          setTypingSender(null);
        }, typingDelay);
      } else {
        setMessages(prev => {
          const all = [...prev, newMessage];
          const map = new Map();
          all.forEach(m => map.set(m.id ?? m.tempId, m));
          return Array.from(map.values());
        });
      }
    };

    const initConnection = async () => {
      if (!connectionRef.current) {
        console.log("🟡 Inicializando chat vía servicio:", { botId, userId });

        const conversationId = await createConversation(userId, botId);
        if (!conversationId) {
          setIsConnected(false);
          return;
        }

        const connection = createHubConnection(conversationId);
        await connection.start();

        connection.on("ReceiveMessage", handleReceiveMessage);

        connectionRef.current = connection;
        conversationIdRef.current = conversationId;
        setConversationId(conversationId);
        setIsConnected(true);

        console.log("✅ Conexión lista con convId:", conversationId);
      }
    };

    initConnection();
  }, [isDemo, isOpen, userId, botId]);


  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
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
        setIsBotReady(false); // Asegurarse de que no esté listo si falla
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
    if (!isBotReady) {
      console.warn("🚫 Bot no listo aún. Mensaje no enviado");
      return;
    }

    if (!message.trim()) return;

    if (isDemo) {
      // Mantener el código de demo sin cambios
      // ...
      return;
    }

    const connection = connectionRef.current;
    const convId = conversationIdRef.current; // ✅ usamos el ref, no el estado

    // Esperar hasta que la conexión y convId estén listos (máx 10 intentos)
    let retries = 0;
    while ((!isConnected || !convId || !connection || connection.state !== "Connected") && retries < 10) {
      console.log("⏳ Esperando conexión y conversationId...");
      await new Promise(res => setTimeout(res, 200));
      retries++;
    }

    if (!isConnected || !convId || !connection || connection.state !== "Connected") {
      console.warn("🚫 No se pudo enviar el mensaje, SignalR no está listo");
      const tempId = uuidv4();
      setMessages(prev => [
        ...prev,
        {
          id: tempId,
          tempId,
          from: "user",
          text: message,
          status: "error",
          timestamp: new Date().toISOString()
        }
      ]);
      setMessage("");
      return;
    }

    // ID temporal para render inmediato
    const tempId = uuidv4();
    const userMessageForDisplay = normalizeMessage({
      id: tempId,
      tempId,
      from: "user",
      text: message,
      status: "sending",
      timestamp: new Date().toISOString()
    });

    setMessages(prev => {
      const all = [...prev, userMessageForDisplay];
      const map = new Map();
      all.forEach(m => map.set(m.id ?? m.tempId, m));
      return Array.from(map.values());
    });

    const currentMessage = message;
    setMessage("");

    setTypingSender("ai");
    setIsTyping(true);

    try {
      const payload = {
        botId,
        userId,
        question: currentMessage.trim(),
        text: currentMessage.trim(),
        tempId,
        modelName: botContext?.settings?.modelName || "gpt-3.5-turbo",
        temperature: botContext?.settings?.temperature || 0.7,
        maxTokens: botContext?.settings?.maxTokens || 150
      };

      console.log("📤 Enviando payload a la IA:", payload);

      // --- Enviar a través de SignalR ---
      await connection.invoke("SendMessage", convId, payload);

      if (!promptSent) {
        setPromptSent(true);
        promptSentRef.current = true;
      }
    } catch (err) {
      console.error("❌ Error en el flujo de envío de mensaje:", err);
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId ? { ...m, status: "error" } : m
        )
      );
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
    if (!isDemo || !isOpen) return;

    const getTypingDuration = (text) => {
      const base = 500;   // mínimo 0.5s
      const perChar = 40; // 40ms por caracter
      const max = 2500;   // tope 2.5s
      return Math.min(max, base + text.length * perChar);
    };

    const demoSequence = [
      { sender: "bot", content: "¡Hola! Soy tu asistente virtual. ¿Cómo puedo ayudarte hoy?", typing: 1200, after: 800 },
      { sender: "user", content: "Hola, quiero información sobre sus servicios.", after: 1500 },
      { sender: "bot", content: "Claro, ofrecemos consultoría y desarrollo de software a medida.", typing: 1500, after: 1000 },
      { sender: "user", content: "¿Y cuál es su horario de atención?", after: 1800 },
      { sender: "bot", content: "Nuestro horario es de lunes a viernes de 8:00 a.m. a 5:00 p.m.", typing: 1800, after: 800 },
    ];

    let totalDelay = 0;
    const timeoutIds = [];
    let counter = 0;

    demoSequence.forEach((item) => {
      if (item.sender === "bot") {
        // 1. Calcular duración del "typing"
        const typingDuration = item.typing ?? getTypingDuration(item.content);

        // 2. Programar el inicio del "typing"
        const typingOnId = setTimeout(() => {
          console.log(`✍️ [TYPING ON] ${item.sender}`);
          setTypingSender(item.sender);
          setIsTyping(true);
        }, totalDelay);
        timeoutIds.push(typingOnId);

        // 3. Incrementar el delay por la duración del typing
        totalDelay += typingDuration;

        // 4. Programar la llegada del mensaje
        const messageId = setTimeout(() => {
          console.log(`💬 [MESSAGE] ${item.sender}: ${item.content}`);
          const newMsg = normalizeMessage({
            id: `demo-${counter++}-${Date.now()}`,
            sender: item.sender,
            content: item.content,
            type: "text",
            timestamp: new Date().toISOString(),
            userId: "bot-id",
            imageGroup: [],
            files: [],
          });
          setMessages((prev) => [...prev, newMsg]);
          // Apagamos el typing justo después de que el mensaje se renderiza
          setIsTyping(false);
          setTypingSender(null);
        }, totalDelay);
        timeoutIds.push(messageId);

        // 5. Añadir el delay posterior antes del siguiente mensaje
        totalDelay += item.after ?? 0;

      } else { // Mensajes del usuario
        // 1. Añadir el delay antes del mensaje del usuario
        totalDelay += item.after ?? 0;

        // 2. Programar la llegada del mensaje del usuario
        const messageId = setTimeout(() => {
          console.log(`🙋 [USER MESSAGE]: ${item.content}`);
          const newMsg = normalizeMessage({
            id: `demo-${counter++}-${Date.now()}`,
            sender: "user",
            content: item.content,
            type: "text",
            timestamp: new Date().toISOString(),
            userId: "demo-user-id",
            imageGroup: [],
            files: [],
          });
          setMessages((prev) => [...prev, newMsg]);
        }, totalDelay);
        timeoutIds.push(messageId);
      }
    });

    // Función de limpieza para todos los timeouts
    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
      console.log("♻️ Cleanup demo: typing OFF");
      setIsTyping(false);
      setTypingSender(null);
    };
  }, [isDemo, isOpen]);

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
            {isTyping && (typingSender === "ai" || typingSender === "admin") && (
              <div style={{ padding: "4px 8px" }}>
                <TypingDots color={primaryColor} />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 📝 Input + Adjuntar + Enviar */}
          <InputArea
            key={`${effectiveStyle.allowImageUpload}-${effectiveStyle.allowFileUpload}`}
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
            isInputDisabled={!isConnected || isDemo} // 🔹 Deshabilitar si demo o sin conexión
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
