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
import { getCapturedFields } from "services/botCapturedFieldsService";
import { createSubmission } from "services/botDataSubmissionsService";

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

  // Estado para campos capturados
  const [captureFields, setCaptureFields] = useState([]);
  // Cargar campos a captar al montar el widget
  useEffect(() => {
    async function fetchFields() {
      try {
        const res = await getCapturedFields(botId);
        // Espera que la respuesta esté en res.data
        setCaptureFields(res.data.map(f => ({ ...f, value: null })));
        console.log("🟢 Campos a captar cargados:", res.data);
      } catch (err) {
        console.error("❌ Error cargando campos a captar:", err);
      }
    }
    fetchFields();
  }, [botId]);

  // Move isOpen to the top so it's available for all hooks
  const [isOpen, setIsOpen] = useState(false);
  const [botStyle, setBotStyle] = useState(null);
  const [isDemo, setIsDemo] = useState(initialDemo);
  const [botContext, setBotContext] = useState(null);
  const [messages, setMessages] = useState([]);
  const [promptSent, setPromptSent] = useState(false);
  const promptSentRef = useRef(false);

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

          // Mostrar el prompt construido en consola para depuración
          console.log('[PROMPT CONSTRUIDO]', initialPrompt);

          // 🔹 Guardar prompt interno en botContext
          setBotContext(prev => ({ ...prev, initialPrompt }));
        }
      } catch (err) {
        console.error("❌ Error cargando datos del bot:", err);
      }
    };

    fetchBotStyleAndContext();
  }, [botId]);

  // Mostrar TypingDots y mensaje de bienvenida solo al abrir el widget
  useEffect(() => {
    if (isOpen && messages.length === 0 && !isDemo) {
      setTypingSender("ai");
      setIsTyping(true);
      const welcomeMsg = {
        from: "ai",
        text: "👋 ¡Hola! Bienvenido. ¿En qué puedo ayudarte hoy?",
      };
      const typingDelay = 1500 + Math.random() * 1000;
      setTimeout(() => {
        setMessages([normalizeMessage(welcomeMsg)]);
        setIsTyping(false);
        setTypingSender(null);
        // NO marcar promptSent aquí, solo después del primer mensaje real del usuario
      }, typingDelay);
    }
  }, [isOpen, isDemo, messages.length]);


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
      // Solo marcar promptSent si hay mensajes de usuario (no solo bienvenida)
      if (cached.messages && cached.messages.some(m => m.from === "user")) {
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

    if (!connectionRef.current) {
      connectionRef.current = createHubConnection();
    }
    const connection = connectionRef.current;

    const handleReceiveMessage = (msg) => {
      console.log("📩 Mensaje recibido:", msg);

      // 🔹 Normalizamos el mensaje
      const normalized = normalizeMessage(msg);

      // 🔹 Activar TypingDots inmediatamente
      setTypingSender("ai");
      setIsTyping(true);

      // 🔹 Simular escritura antes de mostrar el mensaje
      const typingDelay = 1500 + Math.random() * 1000; // 1.5s - 2.5s
      setTimeout(() => {
        setMessages(prev => [...prev, normalized]);
        setIsTyping(false);
        setTypingSender(null);
      }, typingDelay);
    };


    const setupConnection = async () => {
      try {
        if (!connection) return;

        if (connection.state === "Disconnected") {
          await connection.start();
        }

        if (!connection.handlersAttached) {
          connection.on("ReceiveMessage", handleReceiveMessage);
          connection.on("Typing", (data) => {
            setTypingSender(data.from);
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
              setIsTyping(false);
              setTypingSender(null);
            }, 2000);
          });
          connection.handlersAttached = true;
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

  // --- Lógica de envío de mensaje con captación de datos ---
  const sendMessage = async () => {
    if (!message.trim()) return;

    if (isDemo) {
      // ...existing code...
      return;
    }

    if (!conversationId) return;
    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      console.error("Error: La conexión de SignalR no está activa.");
      return;
    }

    setTypingSender("ai");
    setIsTyping(true);

    // --- Captación de datos ---
    let updatedFields = [...captureFields];
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const clean = (str) => str.trim().replace(/\s+/g, " ");
    const msgNorm = normalize(message);

    // Coincidencia difusa avanzada usando distancia de Levenshtein
    const levenshtein = (a, b) => {
      const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
      for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
      for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
        }
      }
      return matrix[a.length][b.length];
    };
    const fuzzyMatch = (input, target) => {
      return levenshtein(input, target) <= 2;
    };

    // 1. Extraer valores para todos los campos definidos, soportando frases combinadas y variantes
    // Construir dinámicamente patrones para todos los campos
    const fieldPatterns = updatedFields
      .filter(f => !f.value)
      .map(f => {
        const norm = normalize(f.fieldName);
        // Frases tipo "mi campo es", "campo:", "campo=" y variantes con errores ortográficos
        return {
          id: f.id,
          fieldName: f.fieldName,
          norm,
          regex: new RegExp(`(?:mi [a-záéíóúüñ]{3,15} es|[a-záéíóúüñ]{3,15}:|[a-záéíóúüñ]{3,15}=)\\s*([^,;\n]+)`, 'i'),
        };
      });

    // 2. Buscar frases combinadas y extraer en orden, evitando que el mismo texto se asigne a varios campos
    let foundAny = false;
    let tempMsg = message;
    for (let pat of fieldPatterns) {
      // Patrón normal: "mi nombre es X", "nombre: X", "nombre= X"
      const match = pat.regex.exec(tempMsg);
      if (match && match[1]) {
        const fieldWordMatch = match[0].match(/[a-záéíóúüñ]{3,15}/i);
        let fieldWord = fieldWordMatch ? normalize(fieldWordMatch[0]) : "";
        if (fuzzyMatch(fieldWord, pat.norm)) {
          let val = match[1];
          // Elimina artículos y posesivos comunes al inicio del valor
          val = val.replace(/^(mi|el|la|un|una|su|sus|de|del|al)\s+/i, "");
          for (let other of fieldPatterns) {
            if (other.id !== pat.id) {
              const idx = normalize(val).indexOf(other.norm);
              if (idx > 0) val = val.substring(0, idx).trim();
            }
          }
          updatedFields = updatedFields.map(f =>
            f.id === pat.id ? { ...f, value: clean(val) } : f
          );
          tempMsg = tempMsg.replace(match[0], '');
          foundAny = true;
        }
      }
      // Patrón inverso: "X es mi nombre", "Y es mi direccion"
      const inverseRegex = new RegExp(`([^,;\n]+) es mi ([a-záéíóúüñ]{3,15})`, 'i');
      const invMatch = inverseRegex.exec(tempMsg);
      if (invMatch && invMatch[2]) {
        let fieldWord = normalize(invMatch[2]);
        if (fuzzyMatch(fieldWord, pat.norm)) {
          let val = invMatch[1].trim();
          val = val.replace(/^(mi|el|la|un|una|su|sus|de|del|al)\s+/i, "");
          for (let other of fieldPatterns) {
            if (other.id !== pat.id) {
              const idx = normalize(val).indexOf(other.norm);
              if (idx > 0) val = val.substring(0, idx).trim();
            }
          }
          updatedFields = updatedFields.map(f =>
            f.id === pat.id ? { ...f, value: clean(val) } : f
          );
          tempMsg = tempMsg.replace(invMatch[0], '');
          foundAny = true;
        }
      }
    }

    // 3. Si no se encontró nada, intentar heurística: si solo hay un campo pendiente y el mensaje es corto, asumir que es el dato
    const pending = updatedFields.filter(f => !f.value);
    if (!foundAny && pending.length === 1) {
      const field = pending[0];
      // Solo asignar si el mensaje menciona explícitamente el nombre del campo pendiente
      const normMsg = normalize(message);
      const normField = normalize(field.fieldName);
      // Busca el nombre del campo en el mensaje (palabra completa)
      const fieldMentioned = new RegExp(`\\b${normField}\\b`, 'i').test(normMsg);
      if (fieldMentioned && /^[a-z0-9áéíóúüñ\s,#.\-]{2,60}$/i.test(message.trim())) {
        updatedFields = updatedFields.map(f =>
          f.id === field.id ? { ...f, value: clean(message) } : f
        );
        foundAny = true;
      }
    }

    // 4. Si no se encontró nada, intentar separar por delimitadores comunes (coma, y, punto y coma)
    if (!foundAny && fieldPatterns.length > 1) {
      // Ejemplo: "campo1 valor1, campo2 valor2"
      const delimiters = /,| y |;|\n/gi;
      const parts = message.split(delimiters).map(clean);
      let used = [];
      for (let part of parts) {
        // Detecta el nombre de campo en la parte
        const fieldWordMatch = part.match(/[a-záéíóúüñ]{3,15}/i);
        let fieldWord = fieldWordMatch ? normalize(fieldWordMatch[0]) : "";
        for (let pat of fieldPatterns) {
          if (!used.includes(pat.id) && fuzzyMatch(fieldWord, pat.norm)) {
            // Extraer el valor después del nombre de campo
            let val = part.replace(new RegExp(`${fieldWord}[:=]?`, 'i'), '').trim();
            // Recorta si contiene el nombre de otro campo
            for (let other of fieldPatterns) {
              if (other.id !== pat.id) {
                const idx = normalize(val).indexOf(other.norm);
                if (idx > 0) val = val.substring(0, idx).trim();
              }
            }
            if (val.length > 1) {
              updatedFields = updatedFields.map(f =>
                f.id === pat.id ? { ...f, value: clean(val) } : f
              );
              used.push(pat.id);
            }
          }
        }
      }
    }

    // Guardar en backend los campos captados
    for (let field of updatedFields) {
      if (field.value && !captureFields.find(f => f.id === field.id && f.value === field.value)) {
        // Enviar camelCase para máxima compatibilidad con backend .NET
        const payload = {
          botId: botId,
          captureFieldId: field.id,
          submissionValue: field.value,
        };
        if (userId != null && userId !== undefined) payload.userId = userId;
        if (conversationId != null && conversationId !== undefined) payload.submissionSessionId = String(conversationId);
        if (!payload.userId && !payload.submissionSessionId) {
          console.error("❌ No se puede enviar submission: falta userId y submissionSessionId");
          continue;
        }
        // Log detallado del payload antes de enviar
        console.log("[DEBUG] Payload enviado a createSubmission:", JSON.stringify(payload));
        try {
          await createSubmission(payload);
          console.log("🟢 Dato captado y guardado:", field.fieldName, field.value);
        } catch (err) {
          console.error("❌ Error guardando dato captado:", err);
        }
      }
    }
    setCaptureFields(updatedFields);

    // Solo enviar el prompt con el primer mensaje del usuario
    let sendPrompt = false;
    if (!promptSentRef.current) {
      sendPrompt = true;
      promptSentRef.current = true;
    }

    // Actualiza el payload de la IA con los valores captados
    const captureFieldsForPayload = updatedFields.map(f => ({
      id: f.id,
      fieldName: f.fieldName,
      value: f.value,
    }));

    const payload = {
      botId,
      userId,
      question: message.trim(),
      text: message.trim(), // <-- Asegura compatibilidad con backend/panel
      initialPrompt: sendPrompt ? botContext?.initialPrompt || "" : "",
      capture: {
        ...botContext?.capture,
        fields: captureFieldsForPayload,
      },
    };

    if (sendPrompt && payload.initialPrompt) {
      console.log("[PROMPT ENVIADO]", payload.initialPrompt);
    }
    console.log("📤 Enviando mensaje a IA con prompt inicial:", payload.initialPrompt);
    console.log("📤 Pregunta del usuario:", payload.question);
    console.log("📤 Campos captados:", captureFieldsForPayload);

    const userMessageForDisplay = normalizeMessage({ from: "user", text: message });
    setMessages(prev => [...prev, userMessageForDisplay]);
    setMessage("");

    try {
  await connection.invoke("SendMessage", conversationId, payload);
      if (sendPrompt) {
        setPromptSent(true);
      }
    } catch (err) {
      console.error("❌ Error enviando mensaje a SignalR:", err);
      setTypingSender("ai");
      setIsTyping(true);
      setTimeout(() => {
        const errorMessage = normalizeMessage({
          from: "ai",
          text: "Lo siento, hubo un problema al enviar tu mensaje. Por favor, intenta de nuevo.",
        });
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        setTypingSender(null);
      }, 1200);
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
            {isTyping && (typingSender === "ai" || typingSender === "admin") && (
              <div style={{ padding: "4px 8px" }}>
                <TypingDots color={primaryColor} />
              </div>
            )}

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
