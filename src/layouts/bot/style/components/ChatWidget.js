import { CSSTransition, SwitchTransition } from "react-transition-group";
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
import { getSenderColor } from "../../../../utils/colors";
import QRCode from "qrcode.react";


const viaLogo = process.env.PUBLIC_URL + "/VIA.png";
const defaultAvatar = "/VIA.png";

// Función robusta para detectar si un string es un emoji (igual que en AvatarComponent.js)
function isEmoji(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim();
  if (!trimmed) return false;
  // Verificar que no sea una URL o path
  if (trimmed.includes('/') || trimmed.includes('.') || trimmed.includes('http') || trimmed.includes('data:')) {
    return false;
  }
  // Verificar que sea razonablemente corto (emojis suelen ser ≤ 8 chars)
  if (trimmed.length > 8) return false;
  // Regex completa para emojis (incluye ZWJ y variantes)
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/u;
  return emojiRegex.test(trimmed);
}

const normalizeMessage = (msg) => {
  // Normalize IDs to strings to avoid numeric/string mismatches
  const rawId = msg.id ?? msg.tempId ?? uuidv4();
  const id = rawId !== undefined && rawId !== null ? String(rawId) : String(uuidv4());
  const tempRaw = msg.tempId ?? id;
  const tempId = tempRaw !== undefined && tempRaw !== null ? String(tempRaw) : id;
  const uniqueKey = msg.tempId ?? id; // Prioritize tempId for the key

  return {
    ...msg,
    id, // The real ID can update, that's fine. Always a string.
    tempId, // Ensure tempId is always present if possible (string)
    status: msg.status ?? "sent",
    from: msg.from ?? (msg.sender === "user" ? "user" : msg.sender === "admin" ? "admin" : "bot"),
    text: msg.text ?? msg.content ?? msg.message ?? msg.body ?? "",
    file: msg.file ?? null,
    multipleFiles: msg.multipleFiles ?? msg.files ?? [],
    images: msg.images ?? msg.imageGroup ?? [],
    timestamp: msg.timestamp ?? new Date().toISOString(),
    color: msg.color ?? getSenderColor(msg.from),
    uniqueKey, // Use the stable key
  };
};

function ChatWidget({
  style = {},
  theme: initialTheme,
  botId: propBotId,
  userId: propUserId,
  isDemo: initialDemo = false,
  widgetToken: propWidgetToken = null,
  // optional ref from WidgetFrame to measure preferred size
  rootRef = null,
  // optional explicit containerSize applied by parent (px)
  containerSize = null,
  previewMode = false,
}) {
  const connectionRef = useRef(null);
  const botId = propBotId ?? 2;
  const userId = propUserId ?? null;
  const conversationIdRef = useRef(null);

  // Move isOpen to the top so it's available for all hooks
  const [isOpen, setIsOpen] = useState(false);
  const [botStyle, setBotStyle] = useState(style || null);
  const [isDemo, setIsDemo] = useState(initialDemo);
  const [botContext, setBotContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isBotReady, setIsBotReady] = useState(initialDemo);
  const [promptSent, setPromptSent] = useState(false);
  const promptSentRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false); // ESTA LÍNEA DEBE ESTAR AQUÍ

  // Para animación del mensaje de debug
  const [connectionStatus, setConnectionStatus] = useState("desconocido");

  const [showConnectionDebug, setShowConnectionDebug] = useState(false);
  const previousConnectionStatusRef = useRef(connectionStatus);
  const nodeRef = useRef(null);
  // Estado de debug
  useEffect(() => {
    if (connectionStatus !== previousConnectionStatusRef.current) {
      // Mostrar mensaje temporal al cambiar el estado
      setShowConnectionDebug(true);

      const timeout = setTimeout(() => setShowConnectionDebug(false), 3000);

      previousConnectionStatusRef.current = connectionStatus;
      return () => clearTimeout(timeout);
    }
  }, [connectionStatus]);

  const pastelColors = {
    conectado: "#b3e5fc",     // azul pastel actual
    reconectando: "#fff9c4",  // amarillo pastel
    error: "#ffcdd2",         // rosa pastel
    desconectado: "#ffcc80",  // naranja pastel
    conectadoVerde: "#b9fbc0" // verde pastel que quieres usar
  };

  useEffect(() => {
    if (initialDemo) return;

    const fetchBotStyleAndContext = async () => {
      try {
        // 🔹 Estilos
        const res = await fetch(`http://localhost:5006/api/Bots/${botId}`);
        const data = await res.json();
        if (data.style) {
          setBotStyle(data.style);
          // No cambiar isDemo si initialDemo es true
          if (!initialDemo) {
            setIsDemo(false);
          }
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

  // 🔹 Escuchar cambios de estado de la conexión
  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection) return;

    const handleReconnecting = () => {
      setConnectionStatus("reconectando...");
      setShowConnectionDebug(true);
    };

    const handleReconnected = () => {
      setConnectionStatus("conectado");
      setShowConnectionDebug(true);
      // 🔹 ocultar después de 2s
      setTimeout(() => setShowConnectionDebug(false), 2000);
    };

    const handleClosed = () => {
      setConnectionStatus("desconectado");
      setShowConnectionDebug(true);
    };

    connection.onreconnecting(handleReconnecting);
    connection.onreconnected(handleReconnected);
    connection.onclose(handleClosed);

    return () => {
      connection.off("reconnecting", handleReconnecting);
      connection.off("reconnected", handleReconnected);
      connection.off("close", handleClosed);
    };
  }, [connectionRef.current]);

  // Mostrar TypingDots y mensaje de bienvenida solo al abrir el widget
  useEffect(() => {
    if (isOpen && !isDemo) {
      const welcomeId = "welcome-message";
      const hasWelcome = messages.some(m => m.id === welcomeId);

      if (!hasWelcome) {
        setTypingSender("bot");
        setIsTyping(true);

        const welcomeMsg = {
          id: welcomeId,
          from: "ai",
          text: "👋 ¡Hola! Bienvenido. ¿En qué puedo ayudarte hoy?",
          status: "sent",
          timestamp: new Date().toISOString(),
        };

        const typingDelay = 1500 + Math.random() * 1000;
        setTimeout(() => {
          setMessages(prev => [...prev, normalizeMessage(welcomeMsg)]);
          requestAnimationFrame(() => {
            setIsTyping(false);
            setTypingSender(null);
          });
          setPromptSent(true);
          promptSentRef.current = true;
        }, typingDelay);
      }
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
  const effectiveStyle = initialDemo ? normalizedStyle : (botStyle || normalizedStyle);
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
  const [isMobileLocked, setIsMobileLocked] = useState(false);
  const [imageGroup, setImageGroup] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const [iaWarning, setIaWarning] = useState(null);
  const textareaRef = useRef(null);
  const [typingSender, setTypingSender] = useState(null);

  useEffect(() => {
    console.log(`[TYPING STATE CHANGED] isTyping: ${isTyping}, typingSender: ${typingSender}`);
  }, [isTyping, typingSender]);

  // Safeguard to turn off typing indicator if bot is not ready, disconnected, or has a warning
  useEffect(() => {
    if ((!isBotReady || !isConnected || iaWarning) && isTyping) {
      console.log("🚫 Bot not ready/connected or warning present, turning off typing indicator.");
      setIsTyping(false);
      setTypingSender(null);
    }
  }, [isBotReady, isConnected, iaWarning, isTyping]);
  // Generar un id de instancia del widget por pestaña (sessionStorage) para aislar sesiones
  const [widgetInstanceId] = useState(() => {
    try {
      const existing = sessionStorage.getItem('widget_instance_id');
      if (existing) return existing;
      const newId = uuidv4();
      sessionStorage.setItem('widget_instance_id', newId);
      return newId;
    } catch (e) {
      // si sessionStorage falla (modo SSR improbable), generar id temporal
      return uuidv4();
    }
  });

  // La clave del cache incluye el widgetInstanceId para evitar compartir conversaciones entre pestañas/usuarios
  const CACHE_KEY = `chat_${botId}_${userId || 'anon'}_${widgetInstanceId}`;
  // Mantener la conversación en caché solo por un intervalo corto (p. ej. 2 minutos)
  // Esto permite restaurar al recargar accidentalmente pero evita compartir la misma conversación
  // entre diferentes usuarios del mismo equipo.
  const CACHE_TIMEOUT = 2 * 60 * 1000; // 2 minutos

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
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        const isExpired = Date.now() - data.timestamp > CACHE_TIMEOUT;
        if (isExpired) {
          console.log("⏰ Caché expirado en segundo plano, limpiando...");
          sessionStorage.removeItem(CACHE_KEY);
          setConversationId(null);
          setMessages([]);
          setPromptSent(false);
          promptSentRef.current = false;
        }
      } catch (e) {
        console.error("⚠️ Error parseando caché, limpiando:", e);
        try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
        setConversationId(null);
        setMessages([]);
      }
    }, 30 * 1000); // revisar cada 30s

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
    if (!convId || !msgs?.length) return;

    const confirmedMessages = msgs.filter(m => m.id && m.status === "sent");
    if (!confirmedMessages.length) return;

    const existing = loadConversationCache();
    let mergedMessages;

    if (existing && existing.conversationId === convId) {
      const map = new Map();
      [...existing.messages, ...confirmedMessages].forEach(m => {
        const key = m.id ?? m.tempId;
        const withColor = { ...m, color: m.color ?? getSenderColor(m.from) };
        map.set(key, withColor);
      });
      mergedMessages = Array.from(map.values());
    } else {
      mergedMessages = confirmedMessages.map(m => ({
        ...m,
        color: m.color ?? getSenderColor(m.from),
      }));
    }

    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ conversationId: convId, messages: mergedMessages, timestamp: Date.now() })
      );
    } catch (e) {
      console.warn('⚠️ No se pudo guardar en sessionStorage, intentando localStorage como fallback', e);
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ conversationId: convId, messages: mergedMessages, timestamp: Date.now() })
        );
      } catch (e2) {
        console.error('❌ Error guardando caché de conversación:', e2);
      }
    }
  };

  const loadConversationCache = () => {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const isExpired = Date.now() - data.timestamp > CACHE_TIMEOUT;
      if (isExpired) {
        console.log("⏰ Caché expirado, eliminando...");
        try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
        try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
        setConversationId(null);
        setMessages([]);
        setPromptSent(false);
        promptSentRef.current = false;
        return null;
      }
      return data;
    } catch (e) {
      console.error("⚠️ Error parseando caché, limpiando:", e);
      try { sessionStorage.removeItem(CACHE_KEY); } catch (_) {}
      try { localStorage.removeItem(CACHE_KEY); } catch (_) {}
      setConversationId(null);
      setMessages([]);
      setPromptSent(false);
      promptSentRef.current = false;
      return null;
    }
  };

useEffect(() => {
    if (!isOpen || isDemo) {
      if (connectionRef.current) {
        console.log("🧹 Limpiando conexión SignalR existente (cerrado o demo).");
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    const handleReceiveMessage = (msg) => {
      console.log("📩 Mensaje recibido (procesado):", msg);
      const newMessage = normalizeMessage(msg);
      if (!newMessage.color) newMessage.color = getSenderColor(newMessage.from);

      // ✅ Apagar el indicador de typing si el mensaje es del que está escribiendo
      setTypingSender(currentTypingSender => {
        if (currentTypingSender && currentTypingSender === newMessage.from) {
          setIsTyping(false);
          return null;
        }
        return currentTypingSender;
      });

      setMessages(prev => {
        // Si el mensaje entrante tiene un tempId, intenta encontrar y actualizar el mensaje existente.
        if (newMessage.tempId) {
          const existingMessageIndex = prev.findIndex(
            m => m.tempId === newMessage.tempId && m.status === 'sending'
          );

          if (existingMessageIndex !== -1) {
            // Se encontró el mensaje temporal, se actualiza en su lugar.
            const updatedMessages = [...prev];
            updatedMessages[existingMessageIndex] = { 
              ...updatedMessages[existingMessageIndex], 
              ...newMessage,
              status: 'sent' // Forzar el estado a 'sent' en la confirmación
            };
            console.log('✅ Mensaje actualizado:', updatedMessages[existingMessageIndex]);
            return updatedMessages;
          }
        }

        // Para mensajes nuevos (o si no se encontró uno temporal para actualizar),
        // verifica si ya existe por su ID final para evitar duplicados.
        const messageExists = prev.some(m => m.id === newMessage.id && m.id !== newMessage.tempId);
        if (messageExists) {
          console.log('🚫 Mensaje duplicado detectado y omitido:', newMessage);
          return prev; // No agregar duplicado
        }

        // Si no, es un mensaje nuevo para nosotros, agrégalo.
        console.log('➕ Agregando nuevo mensaje:', newMessage);
        return [...prev, newMessage];
      });
    };

  let connection;
  // Declare handler here so cleanup (return) can reference it without being undefined
  let handleMessageQueued;
  let handleMobileSessionChanged;

  const initConnection = async () => {
      console.log("🟡 Inicializando chat vía servicio:", { botId, userId });
      try {
        const convId = await createConversation(userId, botId);
        if (!convId) throw new Error("No se recibió conversationId");

        conversationIdRef.current = convId;
        setConversationId(convId);

        // Fetch conversation history so widget displays messages that arrived while closed.
        // NOTE: If the client already has a valid local cache for this conversation, skip fetching
        // history from the server — the widget should prefer local cache when a conversation is active
        // and only the administrative panel should request full server history.
        try {
          const cached = loadConversationCache();
          if (cached && cached.conversationId === convId && Array.isArray(cached.messages) && cached.messages.length > 0) {
            console.log('ℹ️ Local cache present for conversation, skipping server history fetch.');
          } else {
            const histRes = await fetch(`http://localhost:5006/api/conversations/history/${convId}`);
            if (histRes.ok) {
              const histJson = await histRes.json();
              const history = histJson.history || [];

              // Normalize and merge into state, avoiding duplicates by uniqueKey (id/tempId)
              const normalized = history.map(h => normalizeMessage({
                id: h.id,
                from: h.fromRole === 'user' ? 'user' : (h.fromRole === 'admin' ? 'admin' : 'bot'),
                text: h.text || h.fileName || '',
                timestamp: h.timestamp,
                status: 'sent'
              }));

              setMessages(prev => {
                const map = new Map();
                prev.forEach(m => map.set(m.uniqueKey, m));
                normalized.forEach(m => map.set(m.uniqueKey, m));
                return Array.from(map.values());
              });
            }
          }
        } catch (e) {
          console.warn('No se pudo cargar el historial de conversación (o se omitió por cache):', e);
        }

  connection = createHubConnection(convId, propWidgetToken || undefined);
        connectionRef.current = connection;

        // ✅ REGISTRO DE EVENTOS CORRECTO
        connection.on("ReceiveMessage", handleReceiveMessage);

        // Handle ack that the message was queued (contains conversationId, messageId, tempId)
        handleMessageQueued = (payload) => {
          try {
            console.log("📬 MessageQueued recibido:", payload);
            const { conversationId: cqId, messageId, tempId } = payload || {};
            if (cqId !== conversationIdRef.current) return;

            setMessages(prev => prev.map(m => {
              if (m.tempId && tempId && m.tempId === tempId) {
                // Update the temp message with the real id and mark as queued
                return { ...m, id: messageId ? String(messageId) : m.id, status: 'queued' };
              }
              return m;
            }));
          } catch (e) {
            console.error("Error manejando MessageQueued:", e);
          }
        };

        connection.on("MessageQueued", handleMessageQueued);

        connection.on("ReceiveTyping", (convId, sender) => {
          if (convId === conversationIdRef.current) {
            console.log(`💬 ${sender} está escribiendo en la conversación ${convId}`);
            setTypingSender(sender);
            setIsTyping(true);
          }
        });

        connection.on("ReceiveStopTyping", (convId, sender) => {
          // Usamos una función de callback para asegurar que tenemos el valor más reciente de typingSender
          setTypingSender(currentTypingSender => {
            if (convId === conversationIdRef.current && currentTypingSender === sender) {
              console.log(`🛑 ${sender} ha dejado de escribir en la conversación ${convId}`);
              setIsTyping(false);
              return null; // Resetea el sender
            }
            return currentTypingSender; // No hay cambios si no coincide
          });
        });

        // Mobile session lock/unlock (server should broadcast MobileSessionChanged(conversationId, blocked))
        handleMobileSessionChanged = (convId, blocked) => {
          try {
            console.log("🔁 MobileSessionChanged recibido:", convId, blocked);
            if (convId === conversationIdRef.current) {
              setIsMobileLocked(Boolean(blocked));
            }
          } catch (e) {
            console.error("Error manejando MobileSessionChanged:", e);
          }
        };
        connection.on("MobileSessionChanged", handleMobileSessionChanged);

        await connection.start();
        setConnectionStatus("conectado");
        setIsConnected(true);
        
        await connection.invoke("JoinRoom", convId);
        console.log("✅ Conexión lista y unido al grupo:", convId);

        await connection.invoke("UserIsActive", convId);
        console.log(`❤️ Heartbeat inicial enviado para conversación ${convId}`);

      } catch (err) {
        console.error("❌ Error en la conexión de chat:", err);
        setConnectionStatus("error");
        setIsConnected(false);
      }
    };

    initConnection();

        return () => {
      console.log("🧹 Limpiando conexión SignalR.");
      if (connectionRef.current) {
        connectionRef.current.off("ReceiveMessage", handleReceiveMessage);
            connectionRef.current.off("MessageQueued", handleMessageQueued);
        // ✅ Limpiar listeners correctos
        connectionRef.current.off("ReceiveTyping");
        connectionRef.current.off("ReceiveStopTyping");
        connectionRef.current.off("MobileSessionChanged", handleMobileSessionChanged);
        connectionRef.current.stop();
        connectionRef.current = null;
      }
    };
    // Se eliminan dependencias que causaban re-conexiones innecesarias.
    // La lógica de `handleReceiveMessage` ahora es más robusta con callbacks de estado.
  }, [isOpen, isDemo, userId, botId, propWidgetToken]);


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

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (isMobileLocked) {
      console.warn("🔒 Mensaje bloqueado: la sesión está activa en un dispositivo móvil.");
      return;
    }

    if (isDemo) {
      const userMessage = normalizeMessage({
        from: "user",
        text: trimmedMessage,
      });
      setMessages((prev) => [...prev, userMessage]);
      setMessage("");

      setTypingSender("bot");
      setIsTyping(true);

      setTimeout(() => {
        const botMessage = normalizeMessage({
          from: "bot",
          text: "Esta es una respuesta automática en modo demo.",
        });
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        setTypingSender(null);
      }, 1000);

      return;
    }

    const connection = connectionRef.current;
    const convId = conversationIdRef.current; // ✅ usamos el ref

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
        normalizeMessage({
          tempId,
          from: "user",
          text: trimmedMessage,
          status: "error",
          timestamp: new Date().toISOString()
        })
      ]);
      setMessage("");
      return;
    }

    // ID temporal para render inmediato
    const tempId = uuidv4();
    const userMessageForDisplay = normalizeMessage({
      tempId,
      from: "user",
      text: trimmedMessage,
      status: "sending",
      timestamp: new Date().toISOString()
    });

    setMessages(prev => [...prev, userMessageForDisplay]);

    setMessage("");

    try {
      const payload = {
        botId,
        userId,
        question: trimmedMessage,
        text: trimmedMessage,
        tempId,
        modelName: botContext?.settings?.modelName || "gpt-3.5-turbo",
        temperature: botContext?.settings?.temperature || 0.7,
        maxTokens: botContext?.settings?.maxTokens || 150
      };

      console.log("📤 Enviando payload a la IA:", payload);

      await connection.invoke("SendMessage", convId, payload);

      // Marcar que el prompt inicial se envió
      if (!promptSent) {
        setPromptSent(true);
        promptSentRef.current = true;
      }

    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
      setMessages(prev =>
        prev.map(m =>
          m.uniqueKey === tempId ? { ...m, status: "error" } : m
        )
      );
      setIsTyping(false); // Turn off typing on error
      setTypingSender(null);
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
    width: "100%", // use percentage relative to iframe/container
    maxWidth: "400px",
    height: "100%", // fill the available container height
    maxHeight: "700px",
    boxShadow: "0 2px 15px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
    boxSizing: "border-box",
  };

  const positionStyles = {
    "bottom-right": { bottom: "20px", right: "20px" },
    "bottom-left": { bottom: "20px", left: "20px" },
    "top-right": { top: "20px", right: "20px" },
    "top-left": { top: "20px", left: "20px" },
    "center-left": { top: "50%", left: "20px", transform: "translateY(-50%)" },
    "center-right": { top: "50%", right: "20px", transform: "translateY(-50%)" },
  };

  // Position styles for the small launcher button when the widget is closed.
  const launcherPositionStyles = {
    "bottom-right": { position: 'absolute', bottom: '20px', right: '20px' },
    "bottom-left": { position: 'absolute', bottom: '20px', left: '20px' },
    "top-right": { position: 'absolute', top: '20px', right: '20px' },
    "top-left": { position: 'absolute', top: '20px', left: '20px' },
    "center-left": { position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)' },
    "center-right": { position: 'absolute', top: '50%', right: '20px', transform: 'translateY(-50%)' },
  };

  // The wrapper inside the iframe should not be fixed or use viewport units.
  // Positioning of the iframe itself should be decided by the host page (parent).
  

  const wrapperStyle = {
    position: "relative",
    zIndex: 9999,
    // Let clicks pass through wrapper unless inner elements set pointerEvents:auto
    pointerEvents: "none",
    width: containerSize && containerSize.width ? `${containerSize.width}px` : '100%',
    height: containerSize && containerSize.height ? `${containerSize.height}px` : '100%'
  };

  // If we're rendering inside the dashboard preview, position the widget fixed
  // so it doesn't get caught by the page layout (nav) and so top positions sit under the nav.
  const previewFixedStyle = previewMode
    ? (function () {
        const topOffset = 80; // px to avoid overlapping the dashboard nav/header
        switch (position) {
          case 'bottom-right':
            return { position: 'fixed', zIndex: 99999, right: '20px', bottom: '20px', width: widgetStyle.maxWidth };
          case 'bottom-left':
            return { position: 'fixed', zIndex: 99999, left: '20px', bottom: '20px', width: widgetStyle.maxWidth };
          case 'top-right':
            return { position: 'fixed', zIndex: 99999, right: '20px', top: `${topOffset}px`, width: widgetStyle.maxWidth };
          case 'top-left':
            return { position: 'fixed', zIndex: 99999, left: '20px', top: `${topOffset}px`, width: widgetStyle.maxWidth };
          case 'center-left':
            return { position: 'fixed', zIndex: 99999, left: '20px', top: '50%', transform: 'translateY(-50%)', width: widgetStyle.maxWidth };
          case 'center-right':
          default:
            return { position: 'fixed', zIndex: 99999, right: '20px', top: '50%', transform: 'translateY(-50%)', width: widgetStyle.maxWidth };
        }
      })()
    : {};

  // Outer style to use when rendering in preview mode (dashboard):
  // apply fixed positioning and a sensible width so the widget doesn't get compressed
  const outerStyle = previewMode
    ? {
        // previewFixedStyle already computes fixed position + width
        ...previewFixedStyle,
        // ensure the container receives pointer events in preview so the widget is interactive
        pointerEvents: 'auto',
        // let the inner widget size itself; avoid forcing 100% height which can compress it
        height: 'auto',
        // keep a small margin so it doesn't stick to edges
        margin: 0,
      }
    : wrapperStyle;

  
  const openImageModal = (images, clickedImageUrl) => {
    // Reset state then open modal after a tiny delay so layout stabilizes
    setImageGroup([]);
    setActiveImageIndex(0);
    setIsImageModalOpen(false);

    setTimeout(() => {
      const index = images.findIndex((img) => {
        try {
          const url = img.fileUrl && String(img.fileUrl).startsWith("http")
            ? img.fileUrl
            : `http://localhost:5006${img.fileUrl}`;
          return url === clickedImageUrl;
        } catch (e) {
          return false;
        }
      });

      setImageGroup(images || []);
      setActiveImageIndex(index >= 0 ? index : 0);
      setIsImageModalOpen(true);
    }, 10); // small delay to ensure the modal opens after DOM updates
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
        const typingDuration = item.typing ?? getTypingDuration(item.content);

        const typingOnId = setTimeout(() => {
          setTypingSender(item.sender);
          setIsTyping(true);
        }, totalDelay);
        timeoutIds.push(typingOnId);

        totalDelay += typingDuration;

        const messageId = setTimeout(() => {
          const newMsg = normalizeMessage({
            id: `demo-${counter++}-${Date.now()}`,
            from: item.sender === 'bot' ? 'bot' : 'user',
            text: item.content,
            type: "text",
            timestamp: new Date().toISOString(),
            imageGroup: [],
            files: [],
          });
          setMessages((prev) => [...prev, newMsg]);
          setIsTyping(false);
          setTypingSender(null);
        }, totalDelay);
        timeoutIds.push(messageId);

        totalDelay += item.after ?? 0;
      } else {
        totalDelay += item.after ?? 0;
        const messageId = setTimeout(() => {
          const newMsg = normalizeMessage({
            id: `demo-${counter++}-${Date.now()}`,
            from: 'user',
            text: item.content,
            type: 'text',
            timestamp: new Date().toISOString(),
            imageGroup: [],
            files: [],
          });
          setMessages((prev) => [...prev, newMsg]);
        }, totalDelay);
        timeoutIds.push(messageId);
      }
    });

    return () => {
      timeoutIds.forEach((id) => clearTimeout(id));
      setIsTyping(false);
      setTypingSender(null);
    };
  }, [isDemo, isOpen]);

  const isInputDisabled = isDemo ? false : (!isConnected || isMobileLocked);

  return (
  <div ref={rootRef} style={outerStyle}>
      {/* Spinner keyframes - injected inline to avoid touching global CSS files */}
      <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
      {!isOpen ? (
        // 🔘 Botón flotante cuando está cerrado (oculto en previewMode)
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
            pointerEvents: "auto", // Asegurar que el botón reciba clicks
            // Position according to configured position inside the iframe container
            ...(launcherPositionStyles[position] || launcherPositionStyles['bottom-right'])
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
            {isEmoji(avatarUrl) ? (
              <span 
                style={{ 
                  fontSize: "32px", 
                  lineHeight: 1,
                  userSelect: "none",
                  fontFamily: "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Android Emoji', 'EmojiOne Color', 'Twemoji Mozilla', sans-serif"
                }}
              >
                {avatarUrl}
              </span>
            ) : (
              <img
                src={avatarUrl?.trim() ? avatarUrl : defaultAvatar}
                alt="Avatar"
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  console.log("❌ Error cargando avatar launcher:", avatarUrl);
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>
        </button>
    ) : (
  // 💬 Widget abierto
  <div style={{ ...widgetStyle, pointerEvents: "auto", margin: '0 auto', height: previewMode ? widgetStyle.maxHeight : widgetStyle.height }}>
          {/* 🔥 Header */}
          <div
            style={{
              backgroundColor: headerBackground,
              width: "100%",
              height: "86px",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              paddingRight: "8px",
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
              <div
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
              >
                {isEmoji(avatarUrl) ? (
                  <span 
                    style={{ 
                      fontSize: "26px", 
                      lineHeight: 1,
                      userSelect: "none",
                      fontFamily: "'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Android Emoji', 'EmojiOne Color', 'Twemoji Mozilla', sans-serif"
                    }}
                  >
                    {avatarUrl}
                  </span>
                ) : (
                  <img
                    src={avatarUrl?.trim() ? avatarUrl : defaultAvatar}
                    alt="Avatar"
                    style={{
                      width: "46px",
                      height: "46px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      console.log("❌ Error cargando avatar header:", avatarUrl);
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: "16px",
                  color: headerTextColor,
                  fontFamily: fontFamily || "Arial",
                  fontWeight: "600",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {title}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '12px' }}>
              {/* QR fijo en header: se muestra si hay conversationId. Diseño más compacto y integrado */}
              {conversationId && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'transparent' }}>
                  <div style={{ textAlign: 'right', color: headerTextColor, fontSize: 12, lineHeight: 1.05 }}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: headerTextColor }}>Continuar en móvil</div>
                    <div style={{ fontSize: 9, opacity: 0.85 }}>Escanea el código</div>
                  </div>
                  {/* separador vertical sutil */}
                  <div style={{ width: 1, height: 48, background: 'rgba(0,0,0,0.06)', borderRadius: 1 }} />
                  <div style={{ width: 64, height: 64, background: '#ffffff', padding: 6, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                    {
                      // Use conversationIdRef if conversationId state becomes briefly null during recreation
                    }
                    <QRCode value={`${window.location.origin}/chat/mobile?conversation=${conversationId || conversationIdRef.current || ''}`} size={52} />
                  </div>
                </div>
              )}

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
                }}
              >
                ✕
              </button>
            </div>
          </div>
          <SwitchTransition>
            <CSSTransition
              key={showConnectionDebug ? connectionStatus : "hidden"}
              timeout={300}
              nodeRef={nodeRef}
              unmountOnExit
              mountOnEnter
              onEnter={() => {
                const node = nodeRef.current;
                if (!node) return;
                node.style.opacity = 0;
                node.style.transform = "translateY(-5px)";
                requestAnimationFrame(() => {
                  node.style.transition = "all 0.3s ease";
                  node.style.opacity = 1;
                  node.style.transform = "translateY(0)";
                });
              }}
              onExit={() => {
                const node = nodeRef.current;
                if (!node) return;
                node.style.opacity = 1;
                node.style.transform = "translateY(0)";
                requestAnimationFrame(() => {
                  node.style.transition = "all 0.3s ease";
                  node.style.opacity = 0;
                  node.style.transform = "translateY(-5px)";
                });
              }}
            >
              <div ref={nodeRef}>
                {showConnectionDebug && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#000",
                      backgroundColor:
                        connectionStatus === "conectado"
                          ? pastelColors.conectadoVerde
                          : connectionStatus.includes("reconectando")
                            ? pastelColors.reconectando
                            : connectionStatus.includes("error")
                              ? pastelColors.error
                              : pastelColors.desconectado,
                      padding: "4px 8px",
                      textAlign: "center",
                      marginBottom: "4px",
                    }}
                  >
                    Estado de conexión: {connectionStatus}
                  </div>
                )}
              </div>
            </CSSTransition>
          </SwitchTransition>

          {iaWarning && (
            <div
              style={{
                color: "#333",
                backgroundColor: "#ffe0b2",
                padding: "10px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: "500",
                borderRadius: "6px",
                marginBottom: "4px",
                transition: "all 0.3s ease",
              }}
            >
              {iaWarning}
            </div>
          )}

          {iaWarning && (
            <div
              style={{
                color: "#333",
                backgroundColor: "#ffe0b2",
                padding: "10px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: "500",
                borderRadius: "6px",
                marginBottom: "4px",
                transition: "all 0.3s ease",
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
                color: isColorDark(backgroundColor) ? "#e0e0e0" : "#a3a0a0ff",
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
            isInputDisabled={isInputDisabled} // 🔹 Deshabilitar si demo, sin conexión o sesión móvil
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

          {/* QR ya se muestra de forma fija en el header; ya no usamos modal */}

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
  userId: PropTypes.number,
  widgetToken: PropTypes.string,
  title: PropTypes.string,
  theme: PropTypes.oneOf(["light", "dark", "custom"]),
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
  previewMode: PropTypes.bool,
  // Optional refs/sizing used by the widget-frame handshake
  rootRef: PropTypes.any,
  containerSize: PropTypes.object,
};

export default ChatWidget;