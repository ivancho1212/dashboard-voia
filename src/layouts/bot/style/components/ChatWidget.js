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
import { searchVector } from "services/vectorSearchService";
import { findBestMatch } from "string-similarity";

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
        setPromptSent(true); // Prompt is considered sent after welcome
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

    const handleDataCaptureUpdate = (update) => {
      if (update && typeof update === 'object') {
        console.log("🔄 Actualizando datos capturados desde el backend:", update);
        setCaptureFields(prevFields => {
          return prevFields.map(field => {
            // Use a case-insensitive check for the field name
            const fieldNameInUpdate = Object.keys(update).find(key => key.toLowerCase() === field.fieldName.toLowerCase());
            if (fieldNameInUpdate) {
              return { ...field, value: update[fieldNameInUpdate] };
            }
            return field;
          });
        });
      }
    };


    const setupConnection = async () => {
      try {
        if (!connection) return;

        if (connection.state === "Disconnected") {
          await connection.start();
        }

        if (!connection.handlersAttached) {
          connection.on("ReceiveMessage", handleReceiveMessage);
          connection.on("DataCaptureUpdate", handleDataCaptureUpdate);
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
        connectionRef.current.off("DataCaptureUpdate", handleDataCaptureUpdate);
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

  // --- Nueva lógica de construcción de prompt y envío de mensaje ---

  /**
   * Genera un fragmento de prompt que informa a la IA sobre el estado de la captura de datos.
   * @param {Array} fields - El estado actual de los campos a capturar.
   * @returns {string} Un texto de instrucción para la IA.
   */
  const buildDataCaptureStatusPrompt = (fields) => {
    // Si no hay campos definidos para capturar, no se añade nada.
    if (!fields || fields.length === 0) {
      return "";
    }

    const captured = fields.filter(f => f.value);
    const missing = fields.filter(f => !f.value);

    // Si ya se capturaron todos los datos, la instrucción es continuar normalmente.
    if (missing.length === 0) {
      return "--- GESTIÓN DE DATOS ---\nACCIÓN: Todos los datos requeridos han sido capturados. Ignora las instrucciones de captura y responde a la solicitud del usuario de forma normal.\n-----------------------\n";
    }

    // Construir el prompt de estado
    let statusPrompt = "--- GESTIÓN DE DATOS ---\n";
    if (captured.length > 0) {
      statusPrompt += `DATOS CAPTURADOS: ${captured.map(f => `${f.fieldName}='${f.value}'`).join(', ')}.\n`;
    } else {
      statusPrompt += "DATOS CAPTURADOS: Ninguno.\n";
    }
    statusPrompt += `DATOS PENDIENTES: ${missing.map(f => f.fieldName).join(', ')}.\n`;
    const nextFieldToCapture = missing[0].fieldName;
    statusPrompt += `ACCIÓN INMEDIATA: Tu única y prioritaria tarea es preguntar por el siguiente dato pendiente: '${nextFieldToCapture}'. Formula una pregunta corta y natural. No saludes, no confirmes datos anteriores, solo haz la pregunta.\n`;
    statusPrompt += "-----------------------\n";

    return statusPrompt;
  };

  /**
   * Construye el prompt dinámico para la IA.
   * @param {string} userMessage - El mensaje actual del usuario.
   * @param {string} relevantContext - Contexto recuperado de bases de datos (Qdrant/MySQL).
   * @param {string} conversationSummary - Un resumen del historial de la conversación.
   * @param {Array} capturedFields - El estado de los campos de datos capturados.
   * @returns {string} El prompt completo y formateado.
   */
  const buildDynamicPrompt = (userMessage, relevantContext, conversationSummary, capturedFields) => {
    const systemMessage =
      botContext?.initialPrompt ||
      "Eres un asistente virtual de Voia, experto en atención al cliente. Sé amable, directo y conciso.";

    const contextInfo =
      relevantContext?.trim() || "No se encontró información específica en la base de conocimiento.";

    const historyInfo =
      conversationSummary?.trim() || "No hay historial previo en esta conversación.";

    // Generar el estado de captura de datos para inyectar en el prompt.
    const dataCaptureStatus = buildDataCaptureStatusPrompt(capturedFields);

    // Plantilla del prompt dinámico
    const prompt = `
      ${systemMessage}
      ${dataCaptureStatus}

      ---
      **Contexto Relevante (de Qdrant/MySQL):**
      ${contextInfo}
      ---
      **Historial Resumido de la Conversación:**
      ${historyInfo}
      ---
      **Pregunta del Usuario:**
      ${userMessage}
    `;

    console.log("[PROMPT CONSTRUIDO DINÁMICAMENTE]", prompt);
    return prompt;
  };

  /**
   * Busca una coincidencia en el payload de FAQs precargado usando similitud de texto.
   * @param {string} userMessage - El mensaje del usuario.
   * @param {Array} faqPayload - El array de mensajes { role, content } del botContext.
   * @returns {string|null} El contenido de la respuesta si hay un match, o null.
   */
  const searchInPayload = (userMessage, faqPayload) => {
    if (!faqPayload || faqPayload.length === 0) {
      return null;
    }

    // 1. Extraer solo las preguntas (role: 'user') del payload.
    const questions = faqPayload
      .filter((m) => m.role === "user" && m.content)
      .map((m) => m.content);

    if (questions.length === 0) {
      return null;
    }

    // 2. Encontrar la mejor coincidencia usando la librería de similitud.
    const bestMatch = findBestMatch(userMessage.toLowerCase(), questions.map(q => q.toLowerCase()));

    console.log(`🔎 Coincidencia en payload: '${bestMatch.bestMatch.target}' con score: ${bestMatch.bestMatch.rating}`);

    // 3. Si la similitud es alta, buscar la respuesta correspondiente.
    // Puedes ajustar este umbral según tus necesidades.
    const SIMILARITY_THRESHOLD = 0.8;
    if (bestMatch.bestMatch.rating > SIMILARITY_THRESHOLD) {
      const matchedQuestionIndex = faqPayload.findIndex(
        (m) => m.role === "user" && m.content.toLowerCase() === bestMatch.bestMatch.target
      );

      // La respuesta es el siguiente mensaje en el payload (debe ser del asistente)
      if (matchedQuestionIndex !== -1 && faqPayload[matchedQuestionIndex + 1]?.role === "assistant") {
        const answer = faqPayload[matchedQuestionIndex + 1].content;
        console.log("✅ Match de alta similitud encontrado en payload. Usando respuesta directa:", answer);
        return `Respuesta directa de la guía rápida: ${answer}`;
      }
    }

    return null;
  };

  /**
   * Formatea los resultados de la búsqueda vectorial en un string legible.
   * @param {Array} contextResults - Array de objetos de Qdrant.
   * @returns {string} Contexto formateado.
   */
  const formatVectorContext = (contextResults) => {
    if (!contextResults || contextResults.length === 0) {
      return "No se encontró información específica en la base de conocimiento.";
    }
    return contextResults
      .map(
        (hit, index) =>
          `Fragmento ${index + 1}: "${hit.text || 'N/A'}" (Fuente: ${hit.source || 'Desconocida'})`
      )
      .join('\n\n');
  };

  const validateFieldValue = (value, field) => {
    if (!value || !field) return false;

    // ✅ FIX: Use fieldType, but if it's missing, fall back to fieldName.
    // This makes the function robust against missing fieldType properties and prevents the TypeError.
    const type = (field.fieldType || field.fieldName || "").toLowerCase();

    console.log(`[VALIDATION] Validando valor='${value}' para campo='${field.fieldName}' con tipo inferido='${type}'`);

    if (type.includes('telefono') || type.includes('phone')) {
      // Validates that it contains at least 7 digits, ignoring non-digit characters.
      const digitCount = (value.match(/\d/g) || []).length;
      const isValid = digitCount >= 7;
      console.log(`[VALIDATION] Resultado para Telefono: ${isValid} (dígitos encontrados: ${digitCount})`);
      return isValid;
    }
    // You can add more validations here (e.g., for email, date, etc.)

    // Generic validation for other text fields (e.g., Nombre, Direccion).
    return value.length > 2;
  };

  const extractAndSubmitData = async (userMessage, currentFields, conversationHistory) => {
    let updatedFields = [...currentFields];
    const pendingFields = currentFields.filter(f => !f.value);
    if (pendingFields.length === 0) {
      return currentFields; // No fields to capture, return immediately.
    }

    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const clean = (str) => str.trim().replace(/\s+/g, " ");

    const lastAiMessage = conversationHistory.filter(m => m.from === 'ai').pop()?.text || "";
    const lastAiMessageNorm = normalize(lastAiMessage);
    let dataExtracted = false;

    // --- STRATEGY 1: Contextual Heuristic (Direct Answer to a Question) ---
    for (const field of pendingFields) {
      const fieldNorm = normalize(field.fieldName);
      if (lastAiMessageNorm.includes(fieldNorm)) {
        const trimmedMsg = userMessage.trim();
        if (trimmedMsg.length > 1 && trimmedMsg.length < 100 && !/^(si|no|ok|vale|gracias|de acuerdo)$/i.test(trimmedMsg)) {
          let extractedValue = clean(trimmedMsg);
          const introPhrases = ['soy', 'me llamo', 'mi nombre es', 'es', 'mi direccion es', 'mi dirección es', 'vivo en', 'mi telefono es', 'mi teléfono es'];
          const introRegex = new RegExp(`^(${introPhrases.join('|')})\\s+`, 'i');
          extractedValue = extractedValue.replace(introRegex, '');

          // ✅ FIX: Pass the entire field object to the validation function.
          if (validateFieldValue(extractedValue, field)) {
            updatedFields = updatedFields.map(f => f.id === field.id ? { ...f, value: extractedValue } : f);
            dataExtracted = true;
            break; // Dato válido capturado, salimos del bucle.
          } else {
            console.warn(`⚠️ Valor contextual RECHAZADO para '${field.fieldName}': '${extractedValue}' no es un formato válido para el tipo '${field.fieldType || 'indefinido'}'.`);
          }
        }
      }
    }

    // --- STRATEGY 2: Explicit Key-Value Extraction (if contextual fails or for multi-data input) ---
    if (!dataExtracted) {
      let tempMsg = ` ${userMessage} `;
      for (const field of pendingFields) {
        if (updatedFields.find(f => f.id === field.id)?.value) continue;

        const fieldNorm = normalize(field.fieldName);
        // ✅ FIX: Use a "greedy" quantifier (+) instead of a "lazy" one (+?) to capture the full value.
        const valuePattern = `([^,;.\\n]+)`; 
        let patterns = [
          new RegExp(`(?:mi\\s+)?${fieldNorm}\\s*(?:es|:|=)\\s*${valuePattern}`, 'i'), // "nombre es ivan" or "mi nombre es ivan"
          new RegExp(`${valuePattern}\\s*es\\s+mi\\s+${fieldNorm}`, 'i') // "ivan es mi nombre"
        ];

        // Add field-type specific patterns for more natural language
        if (fieldNorm.includes("nombre")) {
          patterns.push(new RegExp(`(?:soy|me\\s+llamo)\\s*${valuePattern}`, 'i'));
        }
        if (fieldNorm.includes("direccion")) {
          patterns.push(new RegExp(`(?:vivo\\s+en|resido\\s+en)\\s*${valuePattern}`, 'i'));
        }
        if (fieldNorm.includes("telefono")) {
          patterns.push(new RegExp(`(?:mi\\s+numero\\s+es|mi\\s+celular\\s+es)\\s*${valuePattern}`, 'i'));
        }

        for (const regex of patterns) {
          const match = regex.exec(tempMsg);
          if (match && match[1]) {
            const extractedValue = match[1].trim();
            // ✅ FIX: Pass the entire field object to the validation function.
            if (validateFieldValue(extractedValue, field)) {
              updatedFields = updatedFields.map(f => f.id === field.id ? { ...f, value: extractedValue } : f);
              tempMsg = tempMsg.replace(match[0], ' '); // Consume la parte del mensaje
              dataExtracted = true;
              break; // Dato válido capturado, salimos del bucle de patrones.
            } else {
              console.warn(`⚠️ Valor explícito RECHAZADO para '${field.fieldName}': '${extractedValue}' no es un formato válido para el tipo '${field.fieldType || 'indefinido'}'.`);
            }
          }
        }
      }
    }

    const submissions = [];
    for (const field of updatedFields) {
      const originalField = currentFields.find(f => f.id === field.id);
      if (field.value && (!originalField || originalField.value !== field.value)) {
        submissions.push(
          createSubmission({
            botId,
            captureFieldId: field.id,
            submissionValue: field.value,
            userId,
            submissionSessionId: conversationId.toString(),
          })
        );
        console.log(`🟢 Dato captado y preparado para guardar: ${field.fieldName} = ${field.value}`);
      }
    }

    if (submissions.length > 0) {
      await Promise.all(submissions);
      console.log("✅ Todos los datos captados fueron guardados en el backend.");
    }

    return updatedFields;
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    if (isDemo) {
      // ... (código de modo demo sin cambios)
      return;
    }

    if (!conversationId) {
      console.error("Error: ID de conversación no disponible.");
      return;
    }
    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      console.error("Error: La conexión de SignalR no está activa.");
      return;
    }

    setTypingSender("ai");
    setIsTyping(true);

    const userMessageForDisplay = normalizeMessage({ from: "user", text: message });
    setMessages((prev) => [...prev, userMessageForDisplay]);
    const currentMessage = message;
    setMessage("");


    try {
      // --- 1. Lógica de Captura de Datos ---
      // Extrae datos del mensaje actual, los guarda en la DB y nos devuelve el estado actualizado.
      const updatedFields = await extractAndSubmitData(currentMessage, captureFields, messages);
      // Actualizamos el estado de React para el siguiente renderizado.
      setCaptureFields(updatedFields);

      // --- 🟢 INICIO: Lógica de Búsqueda Híbrida ---
      let relevantContext = null;

      // 2. Buscar en el payload de FAQs (en memoria) primero.
      relevantContext = searchInPayload(currentMessage, botContext?.messages);

      // 3. Si no hay match en el payload, buscar en Qdrant (vía backend).
      if (!relevantContext) {
        console.log("ℹ️ No hubo match en payload. Procediendo con búsqueda en Qdrant...");
        try {
          const data = await searchVector(currentMessage, botId, 3);
          if (data.results && data.results.length > 0) {
            relevantContext = formatVectorContext(data.results);
          }
        } catch (err) {
          console.warn("⚠️ No se pudo obtener contexto de Qdrant:", err);
        }
      }

      // TODO: Implementar la lógica para resumir el historial de `messages`
      const conversationSummary = messages
        .slice(-5) // Tomar los últimos 5 mensajes como ejemplo
        .map((msg) => `${msg.from}: ${msg.text}`)
        .join("\n");

      // 4. Construir el prompt dinámico USANDO LOS DATOS RECIÉN ACTUALIZADOS
      const dynamicPrompt = buildDynamicPrompt(currentMessage, relevantContext, conversationSummary, updatedFields);

      // 3. Preparar el payload para la IA
      const payload = {
        botId,
        userId,
        question: currentMessage.trim(), // La pregunta original del usuario
        text: currentMessage.trim(), // Compatibilidad con backend
        initialPrompt: dynamicPrompt, // El prompt dinámico completo
        // Incluir otros parámetros de configuración si es necesario
        modelName: botContext?.settings?.modelName || "gpt-3.5-turbo",
        temperature: botContext?.settings?.temperature || 0.7,
        maxTokens: botContext?.settings?.maxTokens || 150,
        // ... otros campos del botContext que sean necesarios
      };

      console.log("📤 Enviando payload a la IA:", payload);

      // 4. Enviar a través de SignalR
      await connection.invoke("SendMessage", conversationId, payload);

      // Marcar que el prompt inicial (ahora dinámico) ha sido enviado
      if (!promptSent) {
        setPromptSent(true);
        promptSentRef.current = true;
      }
    } catch (err) {
      console.error("❌ Error en el flujo de envío de mensaje:", err);
      setTypingSender("ai");
      setIsTyping(true);
      setTimeout(() => {
        const errorMessage = normalizeMessage({
          from: "ai",
          text: "Lo siento, hubo un problema al procesar tu mensaje. Por favor, intenta de nuevo.",
        });
        setMessages((prev) => [...prev, errorMessage]);
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
