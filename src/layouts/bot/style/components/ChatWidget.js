import { unifyMessages, isEmoji, groupConsecutiveFiles, normalizeMessage } from "../../../../utils/chatUtils";
import useWidgetInstance from "hooks/useWidgetInstance";
import useChatCache from "hooks/useChatCache";
import useConversationCache from "../../../../hooks/useConversationCache";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import "layouts/widget/WidgetStyles.css";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { FaPaperclip, FaPaperPlane, FaImage } from "react-icons/fa";
import PropTypes from "prop-types";
import { API_URL } from "config/environment";
import { createHubConnection } from "services/signalr";
import InputArea from "./chat/InputArea";
import MessageBubble from "./chat/MessageBubble";
import MessageList from "./chat/MessageList";
import TypingDots from "./chat/TypingDots";
import ImagePreviewModal from "./chat/ImagePreviewModal";
import DeviceConflictOverlay from "./chat/DeviceConflictOverlay";
import MobileConversationExpired from "./chat/MobileConversationExpired";
import { getBotContext } from "services/botService";
import { createConversation } from "services/chatService";
import { getConversationHistory } from "services/conversationsService";
import { getOrGenerateFingerprint } from "services/fingerprintService";
import { getSenderColor } from "../../../../utils/colors";
import { QRCodeCanvas } from "qrcode.react";
import useDeviceSessionLock from "hooks/useDeviceSessionLock";

// Para widgets embebidos, usar ruta absoluta del servidor del dashboard
const viaLogo = "http://localhost:3000/VIA.png";
const defaultAvatar = "http://localhost:3000/VIA.png";

const pastelColors = {
  conectado: "#b3e5fc",     // azul pastel actual
  reconectando: "#fff9c4",  // amarillo pastel
  error: "#ffcdd2",         // rosa pastel
  desconectado: "#ffcc80",  // naranja pastel
  conectadoVerde: "#b9fbc0" // verde pastel que quieres usar
};


function ChatWidget({
  style = {},
  theme: initialTheme,
  botId: propBotId,
  userId: propUserId,
  isDemo: initialDemo = false,
  widgetToken: propWidgetToken = null,
  widgetClientSecret: propWidgetClientSecret = null,
  rootRef = null,
  containerSize = null,
  previewMode = false,
  isMobileView = false,
  conversationId: propConversationId = null,
  allowMobileVersion = true,
}) {
  // Modulariza la instancia y la clave de caché
  const { botId, userId, widgetInstanceId, CACHE_KEY } = useWidgetInstance(propBotId, propUserId);

  // Inicializa conversationId y mensajes desde caché si no hay propConversationId
  const cached = useConversationCache(CACHE_KEY).loadConversationCache();
  const initialConversationId = propConversationId || (cached?.messages?.length ? cached.conversationId || cached.messages[0]?.conversationId : null);
  const [conversationId, setConversationId] = useState(initialConversationId);

  // Estado para la URL del QR y fingerprint
  const [qrUrl, setQrUrl] = useState("");
  const [fingerprint, setFingerprint] = useState("");

  // Efecto para generar la URL del QR con fingerprint SOLO si hay conversationId
  useEffect(() => {
    // Solo generar QR si fingerprint está listo
    if (!conversationId || !fingerprint) {
      setQrUrl("");
      if (!fingerprint) {
        console.warn('[ChatWidget] fingerprint aún no está listo para QR:', { userId, fingerprint });
      }
      return;
    }
    let url = `${window.location.origin}/chat/mobile?bot=${botId}&conversation=${conversationId}&userId=${userId}&fingerprint=${fingerprint}`;
    setQrUrl(url);
  }, [botId, conversationId, userId, fingerprint]);

  // Obtener fingerprint al montar el componente
  useEffect(() => {
    let mounted = true;
    getOrGenerateFingerprint().then(fp => {
      if (mounted) setFingerprint(fp);
    });
    return () => { mounted = false; };
  }, []);

  // ✅ Crear ref interno si no se pasa rootRef como prop
  const internalRootRef = useRef(null);
  const actualRootRef = rootRef || internalRootRef;

  // ⚡ Token efectivo: propWidgetClientSecret tiene prioridad sobre propWidgetToken.
  // Usamos UNA sola dependencia para el useEffect de SignalR para evitar que dos
  // efectos asíncronos en WidgetFrame (que setean tokens en momentos distintos)
  // disparen DOS conexiones SignalR en paralelo.
  const effectiveToken = propWidgetClientSecret || propWidgetToken || null;

  // Estados y hooks principales
  const connectionRef = useRef(null);
  const widgetClientSecret = propWidgetClientSecret ?? null;  // ✅ NUEVO
  const conversationIdRef = useRef(propConversationId); // Inicializar con prop
  const [isOpen, setIsOpen] = useState(isMobileView); // Si es móvil, abrir por defecto
  const [botStyle, setBotStyle] = useState(style || null);
  const [isDemo, setIsDemo] = useState(initialDemo);
  const [botContext, setBotContext] = useState(null);
  // ...ya inicializado arriba desde caché...
  const [isBotReady, setIsBotReady] = useState(initialDemo);
  const [promptSent, setPromptSent] = useState(false);
  const promptSentRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false); // ESTA LÍNEA DEBE ESTAR AQUÍ
  const [welcomeMessage, setWelcomeMessage] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { country, city, language }
  const [capturedFields, setCapturedFields] = useState([]); // 🆕 Estado para track de campos capturados
  const [isMobileConversationExpired, setIsMobileConversationExpired] = useState(false); // Estado para conversación expirada en móvil
  const [isMobileSessionActive, setIsMobileSessionActive] = useState(false); // 🆕 Pausa inactividad cuando móvil está abierto
  const welcomeShownRef = useRef(false); // 🆕 Ref para rastrear si ya mostró bienvenida en esta conversación
  const welcomeTimeoutRef = useRef(null); // 🆕 Ref para rastrear el timeout del mensaje de bienvenida
  const lastWelcomeTextRef = useRef(null); // 🆕 Ref para guardar el texto del welcome enviado, evitar duplicados del broadcast
  const pendingFileMessageRef = useRef(null); // Ref para mensaje de archivo pendiente
  const pendingReceiveQueueRef = useRef([]); // Cola de mensajes recibidos para batching
  const flushScheduledRef = useRef(false); // Control de flush programado
  const [fileInputKey, setFileInputKey] = useState(0); // Key para forzar reset del input file
  // Hook para caché y sesión modularizado
  const {
    saveConversationCache,
    loadConversationCache,
    clearCache,
    loadedConversationsRef,
  } = useConversationCache(CACHE_KEY);
  const widgetExplicitlyClosedRef = useRef(false); // 🆕 Ref para rastrear si el usuario cerró el widget explícitamente
  const qrHistoryLoadedRef = useRef(false); // 🆕 Ref para evitar cargar historial QR dos veces

  // Declarar initialMessages antes de usarlo en el estado
  const initialMessages = (() => {
    const cached = loadConversationCache();
    return cached?.messages?.length ? cached.messages : [];
  })();
  const [messages, setMessages] = useState(initialMessages);

  // El hook debe usarse solo en la web, no en móvil
  const deviceSessionLock = useDeviceSessionLock(
    conversationId,
    connectionRef.current,
    false // Siempre false para la web, el móvil no debe bloquearse a sí mismo
  );

  const [isBlockedByOtherDevice, setIsBlockedByOtherDevice] = useState(deviceSessionLock.isBlockedByOtherDevice);
  const [blockMessage, setBlockMessage] = useState(deviceSessionLock.blockMessage);

  // 🚫 Admin-level ban state (blocked by admin from dashboard)
  const [isUserBanned, setIsUserBanned] = useState(false);
  const [banContactEmail, setBanContactEmail] = useState(null);
  const isUserBannedRef = useRef(false);
  const blockingDevice = deviceSessionLock.blockingDevice;

  // Log para verificar el estado de bloqueo
  useEffect(() => {
    setIsBlockedByOtherDevice(deviceSessionLock.isBlockedByOtherDevice);
    setBlockMessage(deviceSessionLock.blockMessage);
  }, [deviceSessionLock.isBlockedByOtherDevice, deviceSessionLock.blockMessage]);

  // Para animación del mensaje de debug
  const [connectionStatus, setConnectionStatus] = useState("desconocido");

  const [showConnectionDebug, setShowConnectionDebug] = useState(false);
  const previousConnectionStatusRef = useRef(connectionStatus);
  const nodeRef = useRef(null);
  const wasBlockedRef = useRef(false); // 🔹 Ref para rastrear estado previo del bloqueo

  // 🆕 EFFECT: Guardar token en localStorage cuando esté disponible
  // Esto asegura que axiosConfig pueda encontrarlo cuando llame a getConversationHistory()
  useEffect(() => {
    // Si necesitas guardar el token, usa saveCache o una función dedicada
  }, [propWidgetToken]);

  // 🆕 EFFECT: Escuchar eventos postMessage desde móvil
  useEffect(() => {
    const handleMobileMessage = async (event) => {
      // Verificar origen si es necesario
      if (event.data && event.data.type === 'mobile-inactivity-expired') {
        
        try {
          // Limpiar todo cuando móvil expira por inactividad
          clearCache();
          sessionStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_KEY);
          setConversationId(null);
          conversationIdRef.current = null;
          setQrUrl("");
          setMessages([]);
          setPromptSent(false);
          promptSentRef.current = false;
          welcomeShownRef.current = false;
          loadedConversationsRef.current = new Set();
          setIsOpen(false);
        } catch (e) {
          console.error('❌ [Widget] Error al limpiar tras inactividad móvil:', e);
        }
      }
    };

    window.addEventListener('message', handleMobileMessage);

    return () => {
      window.removeEventListener('message', handleMobileMessage);
    };
  }, [CACHE_KEY]);

  // EFFECT: Detectar cuando la conversación es cerrada en web (móvil entra en standby)
  // O cuando está bloqueada por otro dispositivo
  useEffect(() => {
    if (!isMobileView || !conversationIdRef.current) return;

    // 🔒 CAMBIO: Cuando web se abre, CERRAR móvil automáticamente
    if (isBlockedByOtherDevice) {
      // Cerrar el widget automáticamente en móvil
      setIsOpen(false);
      setIsMobileConversationExpired(true);
    } else if (wasBlockedRef.current && !isBlockedByOtherDevice) {
      // Caso anterior: Si la sesión fue desbloqueada después de estar bloqueada
      setIsMobileConversationExpired(true);
    }

    wasBlockedRef.current = isBlockedByOtherDevice;
  }, [isBlockedByOtherDevice, isMobileView]);

  // 🆕 EFFECT: Actualizar estado de sesión móvil activa
  // Cuando web está bloqueado por móvil, pausar inactividad en web
  useEffect(() => {
    if (!isMobileView) {
      // Si NO es móvil (es web), verificar si está bloqueado por móvil
      if (isBlockedByOtherDevice) {
        setIsMobileSessionActive(true);
      } else {
        setIsMobileSessionActive(false);
      }
    } else {
      // Si ES móvil, la sesión móvil está activa cuando el widget está abierto
      if (isOpen) {
        setIsMobileSessionActive(true);
      } else {
        setIsMobileSessionActive(false);
      }
    }
  }, [isBlockedByOtherDevice, isOpen, isMobileView]);

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

        // 🔹 Obtener ubicación del usuario (desde endpoint de conversaciones)
        try {
          // 🧪 PARA TESTING: Simular diferentes ubicaciones descomenta una de estas líneas:
          // const testIP = "213.97.99.0"; // España (Madrid)
          const testIP = "190.147.2.0"; // Colombia (Bogota)
          // const testIP = "203.113.168.0"; // Japón

          const locationRes = await fetch(`http://localhost:5006/api/conversations/user-location`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'X-Forwarded-For': testIP
            }
          });

          if (locationRes.ok) {
            const locationData = await locationRes.json();
            setUserLocation({
              country: locationData.country || 'Unknown',
              city: locationData.city || 'Unknown',
              language: 'es'
            });
          } else {
            setUserLocation({
              country: 'Unknown',
              city: 'Unknown',
              language: 'es'
            });
          }
        } catch (err) {
          setUserLocation({
            country: 'Unknown',
            city: 'Unknown',
            language: 'es'
          });
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

          // 🆕 Inicializar campos capturados desde el contexto
          if (context.capture?.fields && Array.isArray(context.capture.fields)) {
            const initialFields = context.capture.fields.map(field => ({
              fieldName: field.fieldName,
              value: null, // Inicialmente no hay valor capturado
              fieldType: field.fieldType || "text",
              isRequired: field.isRequired || false
            }));
            setCapturedFields(initialFields);
          }

          // 🔹 Guardamos el payload en el estado
          setBotContext(aiPayload);
          setIsBotReady(true); // ✅ El bot está listo para recibir mensajes

          // 🔹 Guardamos el system prompt + vector info para uso interno de la IA
          const systemPrompt = systemMsg?.content || "";
          const trainingData = aiPayload.training || {};
          const vectorInfo = `Fuentes disponibles:\n- Documentos: ${trainingData.documents?.length || 0}\n- URLs: ${trainingData.urls?.length || 0}\n- Textos: ${trainingData.customTexts?.join(", ") || "Ninguno"}`;

          const initialPrompt = `${systemPrompt}\n\nAdemás, tienes acceso a datos vectorizados relacionados con este bot.\nUtiliza esos datos siempre que sean relevantes para responder.\n\n${vectorInfo}`;

          // 🔹 Guardar prompt interno en botContext
          setBotContext(prev => ({ ...prev, initialPrompt }));
        }
      } catch (err) {
        setIsBotReady(false); // Asegurarse de que no esté listo si falla
      }
    };

    fetchBotStyleAndContext();
  }, [botId]);

  // 🔹 Obtener mensaje de bienvenida personalizado
  useEffect(() => {
    if (!userLocation || !botId || initialDemo) {
      return;
    }

    const controller = new AbortController();

    const fetchWelcomeMessage = async () => {
      try {
        const params = new URLSearchParams({
          botId: botId,
          country: userLocation.country || 'Unknown',
          city: userLocation.city || 'Unknown',
          language: userLocation.language || 'es'
        });

        const url = `${API_URL}/botwelcomemessages/get-by-location?${params}`;

        const response = await fetch(url, { credentials: 'include', signal: controller.signal });

        if (response.ok) {
          const data = await response.json();

          setWelcomeMessage({
            text: data.message || '',
            country: data.country,
            city: data.city,
            matchType: data.matchType,
            source: data.source
          });
        } else {
          console.warn('⚠️ [WELCOME] Sin mensaje configurado (status:', response.status, ')');
          setWelcomeMessage({ text: '', matchType: 'none' });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('❌ [WELCOME] Error en fetch:', err);
          setWelcomeMessage({ text: '', matchType: 'none' });
        }
      }
    };

    fetchWelcomeMessage();
    return () => controller.abort();
  }, [userLocation, botId, initialDemo]);

  // 🔹 Escuchar cambios de estado de la conexión
  useEffect(() => {
    const connection = connectionRef.current;
    if (!connection) return;

    const handleReconnecting = () => {
      console.warn('⚠️  [SignalR] Reconectando...');
      setConnectionStatus("reconectando...");
      setShowConnectionDebug(true);
    };

    const handleReconnected = async () => {
      setConnectionStatus("conectado");
      setShowConnectionDebug(true);
      setTimeout(() => setShowConnectionDebug(false), 2000);
      // ⚡ Al reconectar, el servidor asigna un nuevo connectionId que NO está en el grupo.
      // Hay que volver a invocar JoinRoom para recibir mensajes del grupo.
      const convId = conversationIdRef.current;
      if (convId && connection?.state === "Connected") {
        try {
          await connection.invoke("JoinRoom", convId);
        } catch (e) {
          console.warn("⚠️ [onreconnected] No se pudo re-unir al grupo:", e?.message);
        }
      }
    };

    const handleClosed = (error) => {
      console.error('❌ [SignalR] Conexión cerrada', {
        error: error?.message || error,
        connectionState: connection?.state,
        timestamp: new Date().toISOString()
      });
      setConnectionStatus("desconectado");
      setShowConnectionDebug(true);
      setIsConnected(false);
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

  // Mostrar TypingDots y mensaje de bienvenida solo al abrir el widget EN WEB
  // En móvil: NO mostrar si ya hay historial (conversación iniciada)
  useEffect(() => {
    if (isOpen && !isDemo && !welcomeShownRef.current) {
      const welcomeId = "welcome-message";
      const hasWelcome = messages.some(m => m.id === welcomeId);

      // 🔹 NO mostrar bienvenida si:
      // 1. Ya está en los mensajes
      // 2. Hay cualquier mensaje (historial cargado desde backend)
      // 3. Es móvil Y hay más de 0 mensajes (conversación iniciada)
      if (hasWelcome || messages.length > 0) {
        welcomeShownRef.current = true;
        return;
      }

      // 🔹 Esperar a que el mensaje personalizado esté disponible
      if (!welcomeMessage) {
        return; // Esperar al próximo ciclo cuando welcomeMessage esté disponible
      }


      // 🔹 Limpiar timeout anterior si existe
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
        welcomeTimeoutRef.current = null;
      }

      // 🔹 Usar el mensaje personalizado si existe, sino el default
      const welcomeText = welcomeMessage?.text || "👋 ¡Hola! Bienvenido. ¿En qué puedo ayudarte hoy?";

      const welcomeMsg = {
        id: welcomeId,
        from: "bot",
        text: welcomeText,
        status: "sent",
        timestamp: new Date().toISOString(),
      };

      // 🔹 MARCAR COMO MOSTRADO ANTES DE SCHEDULEAR - evita duplicados
      welcomeShownRef.current = true;
      setTypingSender("bot");
      setIsTyping(true);

      const typingDelay = 1500 + Math.random() * 1000;

      welcomeTimeoutRef.current = setTimeout(async () => {
        // 🆕 Agregar el mensaje de bienvenida al estado local (SOLO UNA VEZ)
        setMessages(prev => {
          const alreadyExists = prev.some(m => m.id === welcomeId);
          if (alreadyExists) {
            return prev;
          }
          return [...prev, normalizeMessage(welcomeMsg)];
        });
        // (Eliminado log de estado de mensajes tras bienvenida)
        setPromptSent(true);
        promptSentRef.current = true;
        // 🆕 Guardar el mensaje de bienvenida en la conversación via SignalR
        // Como respuesta inicial de la IA (NO como entrada del usuario)
        try {
          const connection = connectionRef.current;
          const convId = conversationIdRef.current;
          if (connection && connection.state === "Connected" && convId) {
            lastWelcomeTextRef.current = welcomeText;
            await connection.invoke("SaveWelcomeMessage", convId, welcomeText, botId);
          }
        } catch (err) {
        }
        requestAnimationFrame(() => {
          setIsTyping(false);
          setTypingSender(null);
        });
      }, typingDelay);
    }

    return () => {
      // Limpiar timeout al desmontar o cuando cambian las dependencias
      if (welcomeTimeoutRef.current) {
        clearTimeout(welcomeTimeoutRef.current);
        welcomeTimeoutRef.current = null;
      }
    };
  }, [isOpen, isDemo, isMobileView, welcomeMessage, botId]);

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
  // Siempre usar normalizedStyle como base (garantiza defaults) y sobreescribir con botStyle
  const effectiveStyle = initialDemo ? normalizedStyle : { ...normalizedStyle, ...(botStyle || {}) };
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
      backgroundColor: (primaryColor?.toLowerCase() ?? '') === (secondaryColor?.toLowerCase() ?? '') ? fallbackBgColor : (secondaryColor || fallbackBgColor),
      headerBackground: headerBackgroundColor?.trim() || secondaryColor || fallbackBgColor,
      textColor: (primaryColor?.toLowerCase() ?? '') === (secondaryColor?.toLowerCase() ?? '') ? fallbackTextColor : (primaryColor || fallbackTextColor),
      borderColor: secondaryColor || "#dddddd",
      inputBg: (primaryColor?.toLowerCase() ?? '') === (secondaryColor?.toLowerCase() ?? '') ? fallbackBgColor : (secondaryColor || fallbackBgColor),
      inputText: (primaryColor?.toLowerCase() ?? '') === (secondaryColor?.toLowerCase() ?? '') ? fallbackTextColor : (primaryColor || fallbackTextColor),
      inputBorder: secondaryColor || "#dddddd",
      buttonBg: primaryColor || "#000000",
      buttonColor: (secondaryColor?.toLowerCase() === "#ffffff" || secondaryColor?.toLowerCase() === "#fff") ? "#000000" : "#ffffff",
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
    setMessages(newMessages);
  };

  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMobileLocked, setIsMobileLocked] = useState(false);
  const [imageGroup, setImageGroup] = useState([]);
  const [imageGroupBlobUrls, setImageGroupBlobUrls] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  // true desde que el usuario envía hasta que llega la respuesta del bot → deshabilita el input
  const [isBotProcessing, setIsBotProcessing] = useState(false);
  // true cuando la IA está pausada y un agente humano atiende la conversación
  const [isAiPaused, setIsAiPaused] = useState(false);
  const isAiPausedRef = useRef(false);
  // Eliminado: declaración duplicada de conversationId/setConversationId
  const messagesEndRef = useRef(null);
  const [iaWarning, setIaWarning] = useState(null);
  const textareaRef = useRef(null);
  const [typingSender, setTypingSender] = useState(null);

  // Safeguard to turn off typing indicator if bot is not ready, disconnected, or has a warning
  useEffect(() => {
    if ((!isBotReady || !isConnected || iaWarning) && isTyping) {
      setIsTyping(false);
      setTypingSender(null);
    }
  }, [isBotReady, isConnected, iaWarning, isTyping]);

  // Caché válido por 3.5 minutos (sincronizado con INACTIVITY_TIMEOUT + advertencia)
  const CACHE_TIMEOUT = 3.5 * 60 * 1000; // 210 segundos

  // ✅ VALIDAR conversación en caché antes de cargarla
  // Si está expirada/cerrada, limpiar y empezar nueva
  useEffect(() => {
    // En móvil, no cargar caché - sesión limpia
    if (isMobileView) {
      return;
    }

    // Si hay propConversationId (desde QR o URL), el historial vendrá del servidor
    if (propConversationId) {
      return;
    }

    const validateAndLoadCache = async () => {
      const cached = loadConversationCache();
      
      if (!cached || !cached.conversationId) {
        return;
      }

      // 🔍 VALIDAR: Verificar si la conversación sigue activa
      try {
        
        const response = await fetch(
          `${API_URL}/Conversations/${cached.conversationId}/status`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!response.ok) {
          // Si no existe (404) o error, limpiar caché
          clearCache();
          sessionStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_KEY);
          return;
        }

        const status = await response.json();
        
        // ❌ Si está cerrada o expirada, limpiar caché inmediatamente
        if (status.Status === 'closed' || status.Status === 'expired') {
          console.warn(`[CACHE] ❌ Conversación ${cached.conversationId} está ${status.Status}. Limpiando caché...`);
          clearCache();
          sessionStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_KEY);
          setConversationId(null);
          conversationIdRef.current = null;
          setQrUrl("");
          setMessages([]);
          setPromptSent(false);
          promptSentRef.current = false;
          return;
        }

        // ✅ Conversación válida, cargar desde caché
        setConversationId(cached.conversationId);
        const unifiedMessages = unifyMessages(cached.messages.map(normalizeMessage));
        const enrichedCached = unifiedMessages.map(msg => enrichWithReplyImage(msg, unifiedMessages));
        setMessages(enrichedCached);
        if (unifiedMessages.some(m => m.from === "user")) {
          setPromptSent(true);
          promptSentRef.current = true;
        }
      } catch (error) {
        console.error('[CACHE] Error validando conversación:', error);
        // En caso de error de red, limpiar caché por seguridad
        clearCache();
        sessionStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_KEY);
      }
    };

    validateAndLoadCache();
  }, [isMobileView, propConversationId]);

  // 🎯 NOTA: Carga de historial QR ahora ocurre EN initConnection para evitar race conditions
  // Mantenemos este useEffect solo como respaldo para casos edge
  useEffect(() => {
    if (!propConversationId || !isMobileView) {
      return;
    }

    // Si ya se cargó en initConnection, no hacer nada
    if (qrHistoryLoadedRef.current) {
      return;
    }

    const loadHistoryFromQR = async () => {
      try {

        const response = await getConversationHistory(propConversationId);

        // El backend devuelve: { conversationDetails, history: [...], debug: {...} }
        const historyArray = response?.history || [];



        if (historyArray && Array.isArray(historyArray) && historyArray.length > 0) {

          // 🔍 DEDUPLICACIÓN: Eliminar mensajes de archivo duplicados
          // Patrón detectado: Backend devuelve ID 420 (/uploads/...) y ID 421 (/api/files/chat/420)
          // Solución: Eliminar mensajes donde URL contiene referencia a un ID que ya existe como mensaje
          const fileMessagesById = new Map();
          const deduplicatedHistory = [];

          for (const item of historyArray) {
            if (item.type === 'file' || item.type === 'image') {
              const url = item.url || item.fileUrl || '';

              // Detectar si es referencia indirecta (e.g., /api/files/chat/420)
              const isIndirectRef = url.match(/\/api\/files\/chat\/(\d+)/);
              if (isIndirectRef) {
                const refId = parseInt(isIndirectRef[1]);
                if (fileMessagesById.has(refId)) {
                  // Este es un duplicado - es referencia a un archivo que ya tenemos
                  continue; // Skip this item
                }
              }

              fileMessagesById.set(item.id, item);
            }
            deduplicatedHistory.push(item);
          }

          if (deduplicatedHistory.length < historyArray.length) {
          }

          // 🆕 Agrupar archivos/imágenes consecutivas del mismo usuario
          const groupedHistory = groupConsecutiveFiles(deduplicatedHistory);

          // Normalizar mensajes del historial
          const historyMessages = groupedHistory.map(msg => {
            // El backend devuelve: { id, type, text, timestamp, fromRole, fromId, fromName, fromAvatarUrl, ... }
            // Corrección: Forzar 'from' a 'bot' si el mensaje es del bot en historial móvil
            let fromValue = msg.fromRole;
            if (isMobileView && (msg.fromRole === 'bot' || msg.fromName?.toLowerCase() === 'bot')) {
              fromValue = 'bot';
            }
            const normalized = normalizeMessage({
              id: msg.id,
              type: msg.type,
              ...(!(msg.isGroupedFile) && { text: msg.text }),
              content: msg.text,
              from: fromValue,
              sender: fromValue,
              timestamp: msg.timestamp,
              fromName: msg.fromName,
              fromAvatarUrl: msg.fromAvatarUrl,
              replyToText: msg.replyToText,
              replyToMessageId: msg.replyToMessageId,
              ...(msg.isGroupedFile && {
                isGroupedFile: true,
                files: msg.files
              }),
              ...(!msg.isGroupedFile && (msg.type === 'file' || msg.type === 'image') && {
                fileUrl: msg.fileUrl,
                fileName: msg.fileName,
                fileType: msg.fileType
              })
            });
            const final = {
              ...normalized,
              status: 'sent', // Los mensajes históricos siempre tienen estado 'sent'
              color: normalized.color || getSenderColor(normalized.from)
            };

            return final;
          });

          // 🔹 Deduplicar archivos dentro de cada mensaje por ID, nombre y tamaño (más robusto)
          const messagesWithUniqueFiles = historyMessages.map(msg => {
            if (msg.isGroupedFile && msg.multipleFiles?.length > 0) {
              const seenFiles = new Set();
              const uniqueFiles = [];
              for (const file of msg.multipleFiles) {
                // Usar combinación de nombre y tamaño si existe, si no solo nombre
                const fileKey = `${file.fileName || ''}|${file.size || ''}`;
                if (!seenFiles.has(fileKey)) {
                  seenFiles.add(fileKey);
                  uniqueFiles.push(file);
                } else {
                  console.warn(`⚠️ [loadHistoryFromQR] Eliminando duplicado - archivo: ${file.fileName}`);
                }
              }
              return { ...msg, multipleFiles: uniqueFiles };
            }
            return msg;
          });

          // Eliminar duplicados de MENSAJES por uniqueKey
          const deduped = new Map();

          for (const msg of messagesWithUniqueFiles) {
            const key = msg.uniqueKey;

            // Solo agregar si no existe la clave
            if (!deduped.has(key)) {
              deduped.set(key, msg);
            }
          }

          const uniqueMessages = Array.from(deduped.values());
          const enrichedQR = uniqueMessages.map(msg => enrichWithReplyImage(msg, uniqueMessages));

          // Seed AI pause state from conversation metadata (persists across reloads)
          const aiPausedOnLoad = response?.conversationDetails?.isWithAI === false;
          if (aiPausedOnLoad) {
            isAiPausedRef.current = true;
            setIsAiPaused(true);
            const systemMsg = normalizeMessage({
              id: `ai-paused-history`,
              from: "bot",
              text: "🧑‍💼 En este momento serás atendido por un agente humano.",
              status: "sent",
              timestamp: new Date().toISOString(),
            });
            setMessages([...enrichedQR, systemMsg]);
          } else {
            setMessages(enrichedQR);
          }
// --- OPTIMISTIC UI PARA ENVÍO DE ARCHIVOS/IMÁGENES DESDE MÓVIL ---
// Busca la función que maneja el envío de archivos desde el móvil (ejemplo: sendFile o sendDocument)
// Aquí se muestra un ejemplo genérico, debes adaptar el nombre de la función si es diferente:

// function sendFile(file) {
//   const tempId = uuidv4();
//   const userFileMessage = normalizeMessage({
//     tempId,
//     from: "user",
//     file: {
//       fileName: file.name,
//       fileType: file.type,
//       fileUrl: file.previewUrl || '',
//       size: file.size
//     },
//     status: "sending",
//     timestamp: new Date().toISOString()
//   });
//   setMessages(prev => [...prev, userFileMessage]);
//   // ...lógica para subir el archivo y luego actualizar el estado cuando llegue la confirmación del backend
// }

// IMPORTANTE: Asegúrate de que la función que maneja el envío de archivos desde móvil incluya este bloque para agregar el mensaje localmente.

          // 🆕 Marcar que se cargó exitosamente
          qrHistoryLoadedRef.current = true;

          // 🔹 Marcar que ya se mostró bienvenida (porque está en el historial)
          welcomeShownRef.current = true;

          if (uniqueMessages.some(m => m.from === "user")) {
            setPromptSent(true);
            promptSentRef.current = true;
          }
        } else {
          // 🆕 Marcar que se intentó cargar (para no intentar de nuevo)
          qrHistoryLoadedRef.current = true;
          // 🔹 Marcar que ya se intentó cargar (para que no intente mostrar bienvenida de nuevo)
          welcomeShownRef.current = false; // Permitir mostrar bienvenida en historial vacío
        }
      } catch (error) {
        // 🔴 MANEJO DE ERRORES HTTP: 410 (Expirada), 404 (No existe), 403 (Acceso denegado)
        const status = error?.response?.status;
        const errorMessage = error?.response?.data?.error || error?.message;

        // 🆕 Marcar que se intentó cargar (aunque falló, para no intentar infinitas veces)
        qrHistoryLoadedRef.current = true;

        // Determinar mensaje según código de error
        let userMessage = "Error al cargar la conversación";

        if (status === 410) {
          // 410 Gone: Conversación expirada
          userMessage = "La conversación ha expirado. Por favor, escanea un nuevo código QR.";
        } else if (status === 404) {
          // 404 Not Found: Conversación no existe
          userMessage = "La conversación no existe o fue eliminada.";
        } else if (status === 403) {
          // 403 Forbidden: Acceso denegado
          userMessage = "Acceso denegado a esta conversación.";
        } else if (status === 401) {
          // 401 Unauthorized: Sin autenticación
          userMessage = "Sesión expirada. Por favor, intenta de nuevo.";
        }

        // Mostrar alerta al usuario
        alert(`⚠️ ${userMessage}`);

        // Limpiar caché y cerrar widget
        clearCache();

        // Cerrar widget y resetear estado
        setIsOpen(false);
        setConversationId(null);
        conversationIdRef.current = null;
        setQrUrl("");
        setMessages([]);
        setPromptSent(false);
        promptSentRef.current = false;
      }
    };

    if (propConversationId && isMobileView) {
      loadHistoryFromQR();
    }
  }, [propConversationId, isMobileView]);

  // ❌ ELIMINADO: setInterval que limpiaba caché en tiempo real
  // El caché ahora SOLO se limpia cuando cierra por INACTIVIDAD
  // Esto evita que se cree conversación nueva mientras el widget está abierto


  // ✅ Lógica de guardado de caché que se activa con cada cambio de mensajes.
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      // Solo guardar en caché si hay conversación activa y mensajes
      if (conversationId && messages.length > 0) {
        saveConversationCache(conversationId, messages);
      }
    }
  }, [messages, conversationId]);

  // 🔴 Ref para rastrear si fue una transición de abierto a cerrado
  const wasOpenRef = useRef(false);

  // 🔴 SISTEMA DE INACTIVIDAD TRAS CIERRE MANUAL (diferente del sistema de widget abierto)
  // Cuando usuario cierra con X: espera 3 min antes de limpiar (permite reabrir y recuperar conversación)
  const MANUAL_CLOSE_INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutos igual que widget abierto
  
  useEffect(() => {
    // Solo en web, no en móvil
    if (isMobileView) {
      wasOpenRef.current = isOpen;
      return;
    }

    // Detectar transición: widget estaba abierto y ahora está cerrado
    const wasOpenBefore = wasOpenRef.current;
    wasOpenRef.current = isOpen;

    if (wasOpenBefore && !isOpen && (conversationId || messages.length > 0)) {
      // ✅ Widget cerrado manualmente - INICIAR timer de inactividad para limpieza diferida
      
      // ✅ Detener conexión SignalR después de un breve delay
      // para que el UserInactive del heartbeat cleanup tenga tiempo de enviarse
      const conn = connectionRef.current;
      if (conn) {
        setTimeout(() => {
          conn.stop().catch(() => {});
        }, 500);
      }
      
      const now = Date.now();
      const inactivityInfo = {
        closedAt: now,
        conversationId: conversationIdRef.current,
        timeout: MANUAL_CLOSE_INACTIVITY_TIMEOUT
      };
      
      localStorage.setItem('chat_inactivity_info', JSON.stringify(inactivityInfo));
      sessionStorage.setItem('chat_inactivity_info', JSON.stringify(inactivityInfo));
      
      
      // Limpiar interval anterior si existe
      if (window.__manualCloseIntervalId) {
        clearInterval(window.__manualCloseIntervalId);
      }
      
      // Polling cada 5 segundos para verificar si pasaron los 3 minutos
      window.__manualCloseIntervalId = setInterval(async () => {
        const info = JSON.parse(localStorage.getItem('chat_inactivity_info') || '{}');
        
        if (!info.closedAt) {
          // Info fue limpiada (widget reabierto), cancelar polling
          clearInterval(window.__manualCloseIntervalId);
          window.__manualCloseIntervalId = null;
          return;
        }
        
        const elapsed = Date.now() - info.closedAt;
        const remainingSeconds = Math.max(0, (MANUAL_CLOSE_INACTIVITY_TIMEOUT - elapsed) / 1000);
        
        
        // Si pasaron los 3 minutos, ejecutar limpieza
        if (elapsed >= MANUAL_CLOSE_INACTIVITY_TIMEOUT) {
          clearInterval(window.__manualCloseIntervalId);
          window.__manualCloseIntervalId = null;
          
          const currentlyOpen = wasOpenRef.current;
          const elapsedMinutes = (elapsed / 60000).toFixed(1);
          
          // Solo limpiar si el widget SIGUE CERRADO
          if (!currentlyOpen) {
            // ✅ PASO 1: Notificar al backend que conversación expiró
            if (info.conversationId) {
            try {
              
              // Intentar con SignalR primero si está conectado
              if (connectionRef.current && connectionRef.current.state === "Connected") {
                await connectionRef.current.invoke("NotifyWidgetExpired", info.conversationId);
              } else {
                // Si SignalR no está disponible, usar API REST directamente
                const response = await fetch(`http://localhost:5006/api/Conversations/${info.conversationId}/expire`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                } else {
                  console.error(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] ❌ Error en REST API: ${response.status}`);
                }
              }
            } catch (err) {
              console.error(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] ❌ Error notificando backend:`, err);
            }
          } else {
          }
          
          // ✅ PASO 2: Limpiar storage y estado
          clearCache();
          sessionStorage.removeItem(CACHE_KEY);
          localStorage.removeItem(CACHE_KEY);
          sessionStorage.removeItem('chat_inactivity_info');
          localStorage.removeItem('chat_inactivity_info');
          
          // Solo limpiar estado en memoria si el widget sigue cerrado
          setConversationId(null);
          conversationIdRef.current = null;
          setQrUrl("");
          setMessages([]);
          setPromptSent(false);
          promptSentRef.current = false;
          welcomeShownRef.current = false;
          loadedConversationsRef.current = new Set();
          
          } else {
            sessionStorage.removeItem('chat_inactivity_info');
            localStorage.removeItem('chat_inactivity_info');
          }
        }
      }, 5000); // Verificar cada 5 segundos
      
      
    } else if (isOpen && !wasOpenBefore) {
      // ✅ Widget REABIERTO - cancelar polling de limpieza si existe
      if (window.__manualCloseIntervalId) {
        clearInterval(window.__manualCloseIntervalId);
        window.__manualCloseIntervalId = null;
        
        // Limpiar info de inactividad
        const info = JSON.parse(localStorage.getItem('chat_inactivity_info') || '{}');
        if (info.closedAt) {
          const elapsedSeconds = ((Date.now() - info.closedAt) / 1000).toFixed(1);
        }
        sessionStorage.removeItem('chat_inactivity_info');
        localStorage.removeItem('chat_inactivity_info');
      }
    }

    // Cleanup al desmontar - SOLO si el componente se desmonta realmente
    return () => {
      // NO cancelar el timer aquí - dejarlo correr incluso si el componente se desmonta
      // El timer verificará el estado en localStorage cuando se ejecute
    }
  }, [isMobileView, isOpen]); // ✅ Solo depender de isOpen, no de messages o conversationId

  const messageRefs = useRef({});
  const typingRef = useRef(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  // Enriquece un mensaje con replyToImageUrl buscando el original en el array
  const enrichWithReplyImage = useCallback((msg, allMessages) => {
    if (msg.replyToImageUrl) return msg; // ya enriquecido
    if (!msg.replyToMessageId && !msg.replyToText) return msg;

    let original = null;

    // Buscar por ID primero
    if (msg.replyToMessageId) {
      original = allMessages.find(
        (m) => String(m.id) === String(msg.replyToMessageId) || String(m.tempId) === String(msg.replyToMessageId)
      );
    }

    // Fallback: buscar por nombre de archivo en replyToText
    if (!original && msg.replyToText) {
      const cleanReplyText = msg.replyToText.replace(/^(?:📎|📷|🖼️|🖼)\s*/u, "").trim();
      original = allMessages.find((m) => {
        const fileName =
          m.file?.fileName ||
          m.images?.[0]?.fileName ||
          m.multipleFiles?.[0]?.fileName;
        return fileName && fileName === cleanReplyText;
      });
    }

    if (!original) return msg;
    const imgFile =
      (original.file?.fileType?.startsWith("image/") && original.file.fileUrl ? original.file : null) ||
      (original.images?.length > 0 && original.images[0].fileUrl ? original.images[0] : null) ||
      original.multipleFiles?.find((f) => f?.fileType?.startsWith("image/") && f.fileUrl) ||
      null;
    if (!imgFile) return msg;
    return { ...msg, replyToImageUrl: imgFile.fileUrl };
  }, []);

  const handleJumpToReply = useCallback((messageId) => {
    if (!messageId) return;
    const key = String(messageId);
    const ref = messageRefs.current[key];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(key);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  }, []);


  // El overlay debe bloquear toda la UI cuando la sesión móvil está activa
  let showDeviceConflictOverlay = false;
  if (typeof isBlockedByOtherDevice !== 'undefined' && typeof isMobileView !== 'undefined') {
    showDeviceConflictOverlay = isBlockedByOtherDevice && !isMobileView;
  }
  useEffect(() => {
    // (Eliminado log de renderizado DeviceConflictOverlay)
  }, [showDeviceConflictOverlay]);

  useEffect(() => {
    if (!isOpen || isDemo) {
      if (connectionRef.current) {
        connectionRef.current.stop();
        connectionRef.current = null;
      }
      return;
    }

    const handleReceiveMessage = (msg) => {
      console.log('[VOIA-DBG] handleReceiveMessage disparado:', msg?.from, msg?.text?.slice(0, 30));
      const newMessage = normalizeMessage(msg);
      if (!newMessage.color) newMessage.color = getSenderColor(newMessage.from);
      // Liberar bloqueo de input al recibir cualquier respuesta (bot o asesor humano)
      if (newMessage.from !== "user") setIsBotProcessing(false);
      // LOG: Mensaje recibido
      // ✅ Skip welcome message if it matches the locally sent one
      if (newMessage.from === "bot" && lastWelcomeTextRef.current && newMessage.text === lastWelcomeTextRef.current) {
        lastWelcomeTextRef.current = null;
        return;
      }
      setTypingSender(currentTypingSender => {
        if (currentTypingSender && currentTypingSender === newMessage.from) {
          setIsTyping(false);
          return null;
        }
        return currentTypingSender;
      });
      const flushPending = () => {
        if (pendingReceiveQueueRef.current.length === 0) return;
        const toAdd = pendingReceiveQueueRef.current.splice(0);
        flushScheduledRef.current = false;
        setMessages(prev => {
          const allMessages = [...prev, ...toAdd];
          const enriched = toAdd.map(msg => enrichWithReplyImage(msg, allMessages));
          return [...prev, ...enriched];
        });
      };
      setMessages(prev => {
        // 1. Si llega con tempId, actualiza el mensaje local
        if (newMessage.tempId) {
          const existingMessageIndex = prev.findIndex(
            m => m.tempId === newMessage.tempId && m.status === 'sending'
          );
          if (existingMessageIndex !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[existingMessageIndex] = {
              ...updatedMessages[existingMessageIndex],
              ...newMessage,
              status: newMessage.status || 'sent'
            };
            // (Eliminado log de mensaje actualizado tempId)
            return updatedMessages;
          }
        }
        // 2. Si llega mensaje del usuario con estado 'queued', busca por texto y estado 'sent' o 'sending'
        if (newMessage.from === 'user' && newMessage.status === 'queued') {
          const idx = prev.findIndex(m => m.from === 'user' && m.text === newMessage.text && (m.status === 'sent' || m.status === 'sending'));
          if (idx !== -1) {
            const updatedMessages = [...prev];
            updatedMessages[idx] = {
              ...updatedMessages[idx],
              ...newMessage,
              status: 'queued',
              id: newMessage.id // actualiza el id si es nuevo
            };
            // (Eliminado log de mensaje usuario actualizado queued)
            return updatedMessages;
          }
        }
        // 3. Si ya existe por id (solo cuando id es válido; id vacío viene del servidor para archivos)
        if (newMessage.id && prev.some(m => m.id === newMessage.id)) return prev;

        // 4. Mensaje de archivo del usuario: manejar deduplicación con optimista
        const files = newMessage.multipleFiles || newMessage.files || [];
        const firstFileUrl = files[0]?.fileUrl ?? files[0]?.filePath ?? files[0]?.url;
        const urlForKey = (url) => {
          if (!url || typeof url !== "string") return "";
          try {
            if (url.startsWith("http")) return new URL(url).pathname;
            return (url.split("?")[0] || "").trim();
          } catch (e) {
            return (url || "").trim();
          }
        };
        const newKey = urlForKey(firstFileUrl);
        const isUserFileOnly = newMessage.from === "user" && (firstFileUrl || files.length > 0 && !newMessage.text?.trim());
        if (isUserFileOnly) {
          pendingFileMessageRef.current = null;
          const newFiles = newMessage.multipleFiles || [];
          const mergedFiles = newFiles.length ? newFiles.map((nf, i) => ({
            ...nf,
            fileContent: nf.fileContent ?? prev[prev.length - 1]?.multipleFiles?.[i]?.fileContent ?? nf.fileContent,
            preview: nf.preview ?? prev[prev.length - 1]?.multipleFiles?.[i]?.preview ?? nf.preview
          })) : newFiles;
          const toAdd = {
            ...newMessage,
            status: "sent",
            multipleFiles: mergedFiles,
            uniqueKey: newMessage.uniqueKey || `file-${uuidv4()}`
          };
          pendingReceiveQueueRef.current.push(toAdd);
          if (!flushScheduledRef.current) {
            flushScheduledRef.current = true;
            queueMicrotask(flushPending);
          }
          return prev;
        }

        // 5. Mensaje normal nuevo: encolar para batching
        pendingReceiveQueueRef.current.push(newMessage);
        if (!flushScheduledRef.current) {
          flushScheduledRef.current = true;
          queueMicrotask(flushPending);
        }
        return prev;
      });
    };

    // ✅ Define handlers OUTSIDE initConnection so they're accessible to cleanup
    const handleMessageQueued = (data) => {
      if (data.tempId) {
        setMessages(prev => prev.map(m => 
          m.tempId === data.tempId ? { ...m, status: 'queued', id: data.messageId } : m
        ));
      }
    };

    const handleMobileSessionEnded = async (data) => {
      try {
        // Limpiar todo cuando móvil cierra
        clearCache();
        sessionStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_KEY);
        setConversationId(null);
        conversationIdRef.current = null;
        setMessages([]);
        setPromptSent(false);
        promptSentRef.current = false;
        welcomeShownRef.current = false;
        loadedConversationsRef.current = new Set();
        setIsOpen(false);
      } catch (e) {
        console.error('❌ [MobileSessionEnded] Error al limpiar:', e);
      }
    };

    // ⚡ Bandera de cancelación compartida entre initConnection y el cleanup.
    // Cuando StrictMode ejecuta cleanup antes de que initConnection termine,
    // cancelled=true hace que initConnection salga antes de conectar.
    const effectId = Math.random().toString(36).slice(2, 7);
    console.log(`[VOIA-DBG][${effectId}] useEffect SignalR disparado — effectiveToken:${!!effectiveToken} isOpen:${isOpen} isMobile:${isMobileView}`);
    let cancelled = false;
    let connection;

    const initConnection = async () => {
      try {
        // Usar el valor correcto de token (widget o admin)
        const widgetToken = propWidgetToken;
        const explicitToken = propWidgetClientSecret || widgetToken;

        // ⏳ Esperar a que el token correcto esté disponible antes de conectar.
        // - En modo mobile/widget: SIEMPRE requiere token explícito (nunca usar el JWT del
        //   admin que pudiera estar en localStorage del mismo origen).
        // - En modo admin dashboard: puede usar localStorage.token como fallback.
        const isWidgetMode = isMobileView || !!propWidgetClientSecret || !!propWidgetToken;
        const hasLocalAuth = !isWidgetMode && !!localStorage.getItem('token');
        if (!explicitToken && !hasLocalAuth) {
          return;
        }

        // ✅ Prioridades para determinar qué conversationId usar:
        // 1️⃣ Si viene desde QR (propConversationId) → USAR ESE EXACTAMENTE
        // 2️⃣ Si ya existe conversación en ref (reapertura) → USAR ESE
        // 3️⃣ Si hay en caché Y NO FUE CERRADO EXPLÍCITAMENTE → USAR ESE
        // 4️⃣ Crear nueva conversación

        let convId = propConversationId;

        if (!convId) {
          convId = conversationIdRef.current;
        }

        if (!convId) {
          // 🔴 MÓVIL: NUNCA crear conversación. Solo unirse a conversaciones vigentes desde QR
          if (isMobileView) {
            throw new Error("En modo móvil no se pueden crear conversaciones. Solo se permite acceder a conversaciones vigentes desde el QR.");
          }
          // ═══ HISTORIAL: Cargar desde caché (al recargar) ═══
          const cached = loadConversationCache();

          if (cached && cached.conversationId) {
            convId = cached.conversationId;
            
            // Cargar mensajes del caché si existen
            if (cached.messages && Array.isArray(cached.messages) && cached.messages.length > 0) {
              // Dedupe solo DENTRO del caché: mismo archivo guardado 2 veces por bug. No afecta tiempo real.
              const fileUrlKey = m => {
                const url = m?.multipleFiles?.[0]?.fileUrl ?? m?.file?.fileUrl ?? m?.multipleFiles?.[0]?.filePath ?? m?.file?.filePath;
                if (!url || typeof url !== "string") return "";
                try {
                  return url.startsWith("http") ? new URL(url).pathname : (url.split("?")[0] || "").trim();
                } catch (e) {
                  return (url || "").trim();
                }
              };
              const seenFileKeys = new Set();
              const deduped = cached.messages.filter(m => {
                if (m.from !== "user" || !m.multipleFiles?.length && !m.file) return true;
                const key = fileUrlKey(m.multipleFiles?.[0] || m.file);
                if (seenFileKeys.has(key)) return false;
                seenFileKeys.add(key);
                return true;
              });
              setMessages(deduped);
              setPromptSent(true);
              promptSentRef.current = true;
              
              // ✅ DETECTAR SI HAY UN MENSAJE DEL USUARIO SIN RESPUESTA
              const lastMessage = deduped[deduped.length - 1];
              const secondLastMessage = deduped.length > 1 ? deduped[deduped.length - 2] : null;
              
              // Verificar si el último mensaje es del usuario Y no hay respuesta del bot después
              const isLastMessageFromUser = lastMessage && lastMessage.from === 'user';
              const hasNoResponse = !secondLastMessage || secondLastMessage.from === 'user'; // No hay msg previo o también es del usuario
              
              if (isLastMessageFromUser && hasNoResponse) {
                
                // Guardar el mensaje pendiente para reenviarlo después de conectar (si bot activo)
                window.__pendingMessageRetry = {
                  conversationId: convId,
                  message: lastMessage.text,
                  tempId: lastMessage.tempId || lastMessage.id,
                  timestamp: new Date().toISOString(),
                  // Incluir información del bot para verificar si está pausado
                  botId: botId
                };
              } else {
                if (isLastMessageFromUser) {
                }
              }
            }
          }

          if (!convId) {
            // ✅ Si no hay caché válido, crear nueva conversación CON NUEVA SESIÓN
            convId = await createConversation(userId, botId, widgetClientSecret, true);  // ✅ Pasar clientSecret
          } else {
            // 🚫 Si hay conversación en caché, verificar que el usuario no esté bloqueado
            // Llamamos a get-or-create con forceNewSession=false para detectar 403
            try {
              const blockCheck = await createConversation(userId, botId, widgetClientSecret, false);
              if (blockCheck && typeof blockCheck === 'object' && blockCheck.blocked) {
                console.warn("🚫 [BlockCheck] Usuario bloqueado detectado via API");
                setIsUserBanned(true);
                isUserBannedRef.current = true;
                setBanContactEmail(blockCheck.contactEmail || null);
                return;
              }
            } catch (blockErr) {
              console.warn('⚠️ [BlockCheck] Error verificando bloqueo:', blockErr);
            }
          }
        }

        // 🚫 Detectar si el usuario fue bloqueado al intentar crear conversación
        if (convId && typeof convId === 'object' && convId.blocked) {
          console.warn("🚫 Usuario bloqueado, no se puede crear conversación");
          setIsUserBanned(true);
          isUserBannedRef.current = true;
          setBanContactEmail(convId.contactEmail || null);
          return;
        }

        if (!convId) throw new Error("No se recibió conversationId");

        // ✅ CRÍTICO: Convertir a número (puede venir como string de query params)
        const convIdNum = typeof convId === 'string' ? parseInt(convId, 10) : convId;
        if (isNaN(convIdNum) || convIdNum <= 0) {
          throw new Error(`conversationId inválido: ${convId}`);
        }

        conversationIdRef.current = convIdNum;
        setConversationId(convIdNum);

        // ✅ Crear conexión SignalR con (conversationId, token) para que la URL y JoinRoom sean correctos
        connection = createHubConnection(convIdNum, explicitToken);
        connectionRef.current = connection;

        // 🆕 EN MÓVIL: Cargar historial AQUÍ para evitar race conditions
        if (isMobileView && propConversationId && !qrHistoryLoadedRef.current) {
          try {
            const response = await getConversationHistory(propConversationId);
            const historyArray = response?.history || [];

            if (historyArray && Array.isArray(historyArray) && historyArray.length > 0) {

              const groupedHistory = groupConsecutiveFiles(historyArray);
              const historyMessages = groupedHistory.map(msg => {
                const normalized = normalizeMessage({
                  id: msg.id,
                  type: msg.type,
                  ...(!(msg.isGroupedFile) && { text: msg.text }),
                  content: msg.text,
                  from: msg.fromRole,
                  sender: msg.fromRole,
                  timestamp: msg.timestamp,
                  fromName: msg.fromName,
                  fromAvatarUrl: msg.fromAvatarUrl,
                  replyToText: msg.replyToText,
                  replyToMessageId: msg.replyToMessageId,
                  ...(msg.isGroupedFile && {
                    isGroupedFile: true,
                    files: msg.files
                  }),
                  ...(!msg.isGroupedFile && (msg.type === 'file' || msg.type === 'image') && {
                    fileUrl: msg.fileUrl,
                    fileName: msg.fileName,
                    fileType: msg.fileType
                  })
                });
                return {
                  ...normalized,
                  status: 'sent',
                  color: normalized.color || getSenderColor(normalized.from)
                };
              });

              const uniqueMessages = Array.from(
                new Map(
                  historyMessages.map(msg => [msg.uniqueKey, msg])
                ).values()
              );
              const enrichedHistory = uniqueMessages.map(msg => enrichWithReplyImage(msg, uniqueMessages));

              // Seed AI pause state from conversation metadata (persists across reloads)
              const aiPausedOnLoad = response?.conversationDetails?.isWithAI === false;
              if (aiPausedOnLoad) {
                isAiPausedRef.current = true;
                setIsAiPaused(true);
                const systemMsg = normalizeMessage({
                  id: `ai-paused-history`,
                  from: "bot",
                  text: "🧑‍💼 En este momento serás atendido por un agente humano.",
                  status: "sent",
                  timestamp: new Date().toISOString(),
                });
                setMessages([...enrichedHistory, systemMsg]);
              } else {
                setMessages(enrichedHistory);
              }
              qrHistoryLoadedRef.current = true;
              welcomeShownRef.current = true;

              if (uniqueMessages.some(m => m.from === "user")) {
                setPromptSent(true);
                promptSentRef.current = true;
              }
            } else {
              qrHistoryLoadedRef.current = true;
              welcomeShownRef.current = false;
            }
          } catch (error) {
            qrHistoryLoadedRef.current = true;

            // Manejar errores HTTP
            const status = error?.response?.status;
            let userMessage = "Error al cargar la conversación";

            if (status === 410) {
              userMessage = "La conversación ha expirado. Por favor, escanea un nuevo código QR.";
            } else if (status === 404) {
              userMessage = "La conversación no existe o fue eliminada.";
            } else if (status === 403) {
              userMessage = "Acceso denegado a esta conversación.";
            } else if (status === 401) {
              userMessage = "Sesión expirada. Por favor, intenta de nuevo.";
            }

            alert(`⚠️ ${userMessage}`);

            try {
              clearCache();
              sessionStorage.removeItem(CACHE_KEY);
              localStorage.removeItem(CACHE_KEY);
              // Limpieza total de refs y estados
              setConversationId(null);
              conversationIdRef.current = null;
              setMessages([]);
              setPromptSent(false);
              promptSentRef.current = false;
              welcomeShownRef.current = false;
              loadedConversationsRef.current = new Set();
            } catch (e) {
            }

            setIsOpen(false);
            setConversationId(null);
            conversationIdRef.current = null;
            setMessages([]);
            setPromptSent(false);
            promptSentRef.current = false;
          }
        }

        // ✅ CRÍTICO: Unir lógica de JoinRoom y UserIsActive en una sola llamada
        // Esto asegura que el usuario se una a la sala y se marque como activo en un solo paso
        const joinAndActivate = async (convId) => {
          try {
            console.log(`[VOIA-DBG][${effectId}] JoinRoom(${convId}) invocando... connState=${connection?.state}`);
            await connection.invoke("JoinRoom", convId);
            console.log(`[VOIA-DBG][${effectId}] JoinRoom OK`);
            // Dar tiempo al evento userblocked de llegar antes de continuar
            await new Promise(resolve => setTimeout(resolve, 300));
            if (isUserBannedRef.current) return; // 🚫 No continuar si fue bloqueado
            await connection.invoke("UserIsActive", convId);
            console.log(`[VOIA-DBG][${effectId}] UserIsActive OK → conexión lista`);
          } catch (err) {
            const errMsg = String(err?.message || err || '');
            console.error(`[VOIA-DBG][${effectId}] JoinRoom/UserIsActive FALLÓ:`, errMsg);
            // 🚫 Si JoinRoom lanza USER_BLOCKED (o cualquier bloqueo), marcar como baneado
            if (errMsg.includes('USER_BLOCKED') || errMsg.includes('bloqueado') || isUserBannedRef.current) {
              console.warn('🚫 [JoinRoom] Usuario bloqueado por el servidor');
              setIsUserBanned(true);
              isUserBannedRef.current = true;
              setIsConnected(false);
              return;
            }
            console.error('❌ [SignalR] Error al unir y activar usuario:', err);
          }
        };

        // ✅ Si el cleanup corrió mientras cargábamos historial, salir sin conectar
        if (cancelled) { console.log(`[VOIA-DBG][${effectId}] cancelado antes de conectar`); return; }

        console.log(`[VOIA-DBG][${effectId}] conectando convId=${convIdNum} token=${explicitToken?.slice(0,12)}...`);

        // Inicializar conexión SOLO si conversationId está definido
        if (convIdNum) {
          // ✅ Registrar handlers SIEMPRE antes del state-check para evitar que
          // cualquier rama (Disconnected / Connecting / Connected) quede sin handlers.
          console.log(`[VOIA-DBG][${effectId}] registrando handlers, state=${connection.state}`);
          connection.on("receivemessage", handleReceiveMessage);
          connection.on("messagequeued", handleMessageQueued);
          connection.on("receivetyping", (_convId, sender) => {
            if (sender && sender !== "user") {
              setTypingSender(sender);
              setIsTyping(true);
            }
          });
          connection.on("receivestoptyping", () => {
            setIsTyping(false);
            setTypingSender(null);
            // Do NOT release isBotProcessing here — the receivemessage handler does it.
            // Releasing here would unlock the input before the bot message is displayed.
          });
          connection.on("mobilesessionstarted", () => {});
          connection.on("mobilesessionended", handleMobileSessionEnded);
          connection.on("widgetsessionended", () => {});
          connection.on("conversationclosed", () => { setIsConnected(false); });
          connection.on("aistatuschanged", (data) => {
            const paused = !data?.isWithAI;
            isAiPausedRef.current = paused;
            setIsAiPaused(paused);
            if (paused) {
              // Liberar el input bloqueado
              setIsBotProcessing(false);
              // Mostrar burbuja de sistema indicando que un agente humano atenderá
              const systemMsg = normalizeMessage({
                id: `ai-paused-${Date.now()}`,
                from: "bot",
                text: "🧑‍💼 En este momento serás atendido por un agente humano.",
                status: "sent",
                timestamp: new Date().toISOString(),
              });
              setMessages(prev => [...prev, systemMsg]);
            }
          });
          connection.on("userblocked", (data) => {
            setIsUserBanned(true);
            isUserBannedRef.current = true;
            if (data?.contactEmail) setBanContactEmail(data.contactEmail);
            setIsConnected(false);
          });

          // ✅ VERIFICAR ESTADO antes de iniciar conexión (prevenir error "not in Disconnected state")
          if (connection.state === 'Disconnected') {
            // Iniciar conexión y ESPERAR a que esté Connected
            await connection.start();
            if (cancelled) { connection.stop().catch(() => {}); return; }
            setConnectionStatus("conectado");

            // ✅ ESPERAR 500ms adicionales para asegurar que el backend procesó la conexión
            await new Promise(resolve => setTimeout(resolve, 500));
            if (cancelled) { connection.stop().catch(() => {}); return; }

            // ✅ Ahora sí, unirse a la sala
            await joinAndActivate(convIdNum);
            if (cancelled) return;

            // ✅ SOLO AHORA habilitar el envío de mensajes (después de unirse al grupo)
            // 🚫 Pero NO si fue bloqueado durante JoinRoom
            if (!isUserBannedRef.current) {
              setIsConnected(true);
            }
          } else if (connection.state === 'Connecting') {
            // Esperar a que termine de conectar
            await new Promise((resolve) => {
              const checkInterval = setInterval(() => {
                if (connection.state === 'Connected') {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 100);
              // Timeout de 10 segundos
              setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
              }, 10000);
            });
            
            if (connection.state === 'Connected') {
              setConnectionStatus("conectado");
              await joinAndActivate(convIdNum);
              if (!isUserBannedRef.current) {
                setIsConnected(true);
              }
            }
          } else if (connection.state === 'Connected') {
            setConnectionStatus("conectado");
            await joinAndActivate(convIdNum);
            if (!isUserBannedRef.current) {
              setIsConnected(true);
            }
          } else {
            console.warn(`⚠️ [SignalR] Estado inesperado: ${connection.state}`);
          }
          
          // ✅ REENVIAR MENSAJE PENDIENTE SI EXISTE (después de 500ms para asegurar que todo esté listo)
          setTimeout(async () => {
            if (window.__pendingMessageRetry) {
              const pendingMsg = window.__pendingMessageRetry;
              
              // Verificar si el bot está pausado
              const botStatus = botContext?.bot?.isPaused;
              if (botStatus === true) {
                delete window.__pendingMessageRetry;
                return;
              }
                            
              try {
                // 🔴 CRÍTICO: El backend espera userId como int? (nullable int)
                let retryUserId = null;
                if (userId !== null && userId !== undefined && userId !== 'anon') {
                  const parsed = parseInt(userId, 10);
                  if (!isNaN(parsed) && parsed > 0) retryUserId = parsed;
                }
                const payload = {
                  botId,
                  userId: retryUserId,
                  question: pendingMsg.message,
                  tempId: pendingMsg.tempId,
                  modelName: botContext?.settings?.modelName || "gpt-3.5-turbo",
                  temperature: botContext?.settings?.temperature || 0.7,
                  maxTokens: botContext?.settings?.maxTokens || 150,
                  userLocation: userLocation || { country: 'Unknown', city: 'Unknown', language: 'es' }
                };
                
                await connection.invoke("SendMessage", convIdNum, payload);
                
                // Limpiar el mensaje pendiente
                delete window.__pendingMessageRetry;
              } catch (retryErr) {
                console.error(`[LOG][RETRY][${new Date().toISOString()}] ❌ Error al reenviar mensaje:`, retryErr);
                // Mantener el mensaje pendiente para otro intento si es necesario
              }
            } 
          }, 500);
        }

      } catch (err) {
        // 🚫 Si fue bloqueado, no mostrar error genérico
        if (isUserBannedRef.current) {
          console.warn('🚫 [initConnection] Usuario bloqueado, suprimiendo error de conexión');
          return;
        }
        // ⚡ "stopped during negotiation" ocurre en React StrictMode cuando cleanup
        // interrumpe una conexión en curso. La conexión se reintenta automáticamente.
        const errMsg = err?.message || '';
        if (errMsg.includes('stopped during negotiation') || errMsg.includes('The connection was stopped')) {
          return; // No marcar como error — el re-mount iniciará una nueva conexión
        }
        console.error('❌ [initConnection] ERROR CRÍTICO en inicialización:', {
          message: err?.message,
          name: err?.name,
          stack: err?.stack,
          fullError: err
        });
        setConnectionStatus("error");
        setIsConnected(false);
      }
    };

    initConnection();

    return () => {
      // ⚡ Cancelar initConnection si sigue ejecutándose asincrónicamente (StrictMode).
      // La bandera es compartida por closure con initConnection.
      console.log(`[VOIA-DBG][${effectId}] cleanup — cancelled=true`);
      cancelled = true;
      if (connectionRef.current) {
        const conn = connectionRef.current;
        connectionRef.current = null;
        conn.stop().catch(() => {});
      }
    };
    // Se eliminan dependencias que causaban re-conexiones innecesarias.
    // La lógica de `handleReceiveMessage` ahora es más robusta con callbacks de estado.
  }, [isOpen, isDemo, userId, botId, effectiveToken]);
  useEffect(() => {
    if (window.parent && window.parent !== window) {
      let width, height;
      if (isOpen) {
        width = 350; // widgetStyle.width
        height = 600; // widgetStyle.maxHeight
      } else {
        width = 70;
        height = 70;
      }
      window.parent.postMessage({ type: 'preferred-size', width, height }, '*');
    }
  }, [isOpen]);
  // 🆕 EFECTO: Cargar historial cuando se conecta a conversación EXISTENTE en desktop
  // Esto asegura sincronización cuando cambias entre dispositivos
  useEffect(() => {
    // Solo en desktop (no móvil), y solo si hay conversationId establecido
    if (isMobileView || !conversationId || isDemo) return;

    // 🔹 Si ya cargamos esta conversación, no cargar de nuevo
    if (loadedConversationsRef.current.has(conversationId)) {
      return;
    }

    // 🔹 Si hay cache viejo, limpiar para obtener historial fresco del servidor
    const loadFreshHistory = async () => {
      try {
        const response = await getConversationHistory(conversationId);
        const historyArray = response?.history || [];
        // Si la conversación está expirada/cerrada en el backend, limpiar caché y estado
        if (!response || response?.error || response?.status === 410 || response?.status === 404) {
          try {
            clearCache();
            sessionStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_KEY);
          } catch (e) { }
          setConversationId(null);
          conversationIdRef.current = null;
          setMessages([]);
          setPromptSent(false);
          promptSentRef.current = false;
          loadedConversationsRef.current.clear();
          return;
        }
        // Si hay historial, procesar normalmente
        const groupedHistory = groupConsecutiveFiles(historyArray);
        const historyMessages = groupedHistory.map(msg => {
          const normalized = normalizeMessage({
            id: msg.id,
            type: msg.type,
            ...(!(msg.isGroupedFile) && { text: msg.text }),
            content: msg.text,
            from: msg.fromRole,
            sender: msg.fromRole,
            timestamp: msg.timestamp,
            fromName: msg.fromName,
            fromAvatarUrl: msg.fromAvatarUrl,
            replyToText: msg.replyToText ?? msg.ReplyToText ?? null,
            replyToMessageId: msg.replyToMessageId ?? msg.ReplyToMessageId ?? null,
            ...(msg.isGroupedFile && {
              isGroupedFile: true,
              files: msg.files
            }),
            ...(!msg.isGroupedFile && (msg.type === 'file' || msg.type === 'image') && {
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              fileType: msg.fileType
            })
          });
          return {
            ...normalized,
            status: 'sent',
            color: normalized.color || getSenderColor(normalized.from)
          };
        });
        // Deduplicar y setear
        const uniqueMessages = Array.from(
          new Map(
            historyMessages.map(msg => [msg.uniqueKey, msg])
          ).values()
        );
        const enrichedHistory = uniqueMessages.map(msg => enrichWithReplyImage(msg, uniqueMessages));

        // Seed AI pause state from conversation metadata (persists across reloads)
        const aiPausedOnLoad = response?.conversationDetails?.isWithAI === false;
        if (aiPausedOnLoad) {
          isAiPausedRef.current = true;
          setIsAiPaused(true);
          const systemMsg = normalizeMessage({
            id: `ai-paused-history`,
            from: "bot",
            text: "🧑‍💼 En este momento serás atendido por un agente humano.",
            status: "sent",
            timestamp: new Date().toISOString(),
          });
          setMessages([...enrichedHistory, systemMsg]);
        } else {
          setMessages(enrichedHistory);
        }
        if (uniqueMessages.some(m => m.from === "user")) {
          setPromptSent(true);
          promptSentRef.current = true;
        }
        // Marcar que esta conversación ya fue cargada
        loadedConversationsRef.current.add(conversationId);
      } catch (error) {
      }
    };

    // 🔹 Pequeño delay para asegurar que SignalR está conectado
    const timer = setTimeout(() => {
      loadFreshHistory();
    }, 500);

    return () => clearTimeout(timer);
  }, [conversationId, isMobileView, isDemo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // ✅ Scroll automático cuando aparece el typing indicator
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);


  useEffect(() => {
    if (!isOpen || !conversationId) return;
    let intervalId = null;
    let isUnmounted = false;
    const sendHeartbeat = async () => {
      try {
        const conn = connectionRef.current;
        if (!conn) {
          return;
        }
        if (conn.state === "Disconnected") {
          await conn.start();
        }
        if (conn.state === "Connected") {
          await conn.invoke("UserIsActive", conversationId);
        }
      } catch (err) {
        setIsBotReady(false); // Asegurarse de que no esté listo si falla
      }
    };
    // Enviar el primer heartbeat inmediatamente (sin logs)
    sendHeartbeat();
    intervalId = setInterval(() => {
      if (!isUnmounted) sendHeartbeat();
    }, 30000);
    return () => {
      isUnmounted = true;
      if (intervalId) clearInterval(intervalId);
      // ✅ Notificar al backend que el usuario ya no está activo
      // para que el dashboard apague el punto verde inmediatamente
      const conn = connectionRef.current;
      if (conn && conn.state === "Connected" && conversationId) {
        conn.invoke("UserInactive", conversationId).catch((err) => {
          console.warn(`[Heartbeat] ⚠️ Error enviando UserInactive:`, err);
        });
      } else {
      }
    };
  }, [isOpen, conversationId]);

  useEffect(() => {
    const handlePageClose = () => {
      if (conversationId) {
        // Notificar backend de desconexión
        const url = `http://localhost:5006/api/Conversations/${conversationId}/disconnect`;
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url);
        }
      }
    };
    window.addEventListener("beforeunload", handlePageClose);
    return () => {
      window.removeEventListener("beforeunload", handlePageClose);
    };
  }, [conversationId, CACHE_KEY]);

  const [demoMessageCount, setDemoMessageCount] = useState(0);
  const maxDemoMessages = 5;

  // 🔴 LÓGICA DE INACTIVIDAD
  // Backend cierra a los 15min; el widget avisa a los 10 min (encuesta) + 10s countdown
  const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos sin actividad → mostrar encuesta
  const INACTIVITY_COUNTDOWN_SEC = 30; // 30 segundos de countdown antes de cerrar
  const inactivityTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const inactivityWarningShownRef = useRef(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const [inactivityCountdown, setInactivityCountdown] = useState(null); // 10, 9, 8... 0
  const cleanupInProgressRef = useRef(false);

  // Encuesta de resolución (antes del aviso de inactividad)
  const [showResolutionSurvey, setShowResolutionSurvey] = useState(false);
  const surveyTimeoutRef = useRef(null);
  const surveyAnsweredRef = useRef(false);
  const showingSurveyRef = useRef(false); // true while survey is visible — prevents resetInactivityTimer from hiding it
  const SURVEY_TIMEOUT_MS = 60000; // 60s para que el usuario responda la encuesta
  // Refs para exponer funciones internas al JSX de la encuesta
  const submitSurveyRef = useRef(null);
  const startCloseRef = useRef(null);

  // 🐛 DEBUG: Log de estado en cada render

  // Función para resetear el timer de inactividad
  const resetInactivityTimer = useCallback(() => {
    // En vista móvil, la inactividad es manejada por MobileChat.js — no duplicar timer
    if (isMobileView) return;
    // Pausar inactividad si la sesión móvil está activa o el widget está bloqueado
    if (isMobileSessionActive || isBlockedByOtherDevice) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      return;
    }

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    inactivityWarningShownRef.current = false;
    setShowInactivityMessage(false);
    // Don't dismiss the survey if it's currently visible — user may be moving to click Yes/No
    if (!showingSurveyRef.current) {
      setShowResolutionSurvey(false);
      if (surveyTimeoutRef.current) {
        clearTimeout(surveyTimeoutRef.current);
        surveyTimeoutRef.current = null;
      }
      surveyAnsweredRef.current = false;
    }
    setInactivityCountdown(null);

    if (!isOpen) {
      return; // No contar inactividad si widget está cerrado
    }

    // Helper: iniciar el conteo regresivo de cierre (después de la encuesta)
    const startCloseCountdown = () => {
      setShowInactivityMessage(true);
      setInactivityCountdown(INACTIVITY_COUNTDOWN_SEC);
      inactivityWarningShownRef.current = true;

      closeTimerRef.current = setTimeout(async () => {
        if (cleanupInProgressRef.current) {
          return;
        }
        cleanupInProgressRef.current = true;
        
        const currentCacheKey = `chat_widget_${botId}_${userId}`;
        
        // ✅ PASO 1: Notificar al backend que conversación expiró
        if (conversationIdRef.current && connectionRef.current && connectionRef.current.state === "Connected") {
          try {
            await connectionRef.current.invoke("NotifyWidgetExpired", conversationIdRef.current);
            } catch (err) {
              // Eliminado log de inactividad
            }
        } else {
          // ...existing code...
        }
        
        // ✅ PASO 2: LIMPIAR CACHÉ - Solo cuando cierre por inactividad
        try {
          clearCache();
          sessionStorage.removeItem(currentCacheKey);
          localStorage.removeItem(currentCacheKey);
          
          // Limpieza total de refs y estados
          setConversationId(null);
          conversationIdRef.current = null;
          setMessages([]);
          setPromptSent(false);
          promptSentRef.current = false;
          welcomeShownRef.current = false;
          loadedConversationsRef.current = new Set();
          } catch (e) {
            // Eliminado log de inactividad
          }

        setIsOpen(false);
        setShowInactivityMessage(false);
        setInactivityCountdown(null);
        inactivityWarningShownRef.current = false;
        setTimeout(() => { cleanupInProgressRef.current = false; }, 1000);
      }, INACTIVITY_COUNTDOWN_SEC * 1000);
    }; // fin startCloseCountdown

    // Registrar respuesta de encuesta en backend
    const submitSurveyAnswer = async (resolved) => {
      if (!conversationIdRef.current) return;
      try {
        await fetch(`http://localhost:5006/api/Conversations/${conversationIdRef.current}/resolution`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved }),
        });
      } catch (e) { /* silencioso */ }
    };

    // Exponer al JSX para que los botones de la encuesta puedan llamarlos
    submitSurveyRef.current = submitSurveyAnswer;
    startCloseRef.current = startCloseCountdown;

    // Mostrar encuesta ANTES del aviso de inactividad
    inactivityTimerRef.current = setTimeout(() => {
      showingSurveyRef.current = true;
      setShowResolutionSurvey(true);
      surveyAnsweredRef.current = false;

      // Si el usuario no responde en SURVEY_TIMEOUT_MS, proceder sin respuesta
      surveyTimeoutRef.current = setTimeout(() => {
        showingSurveyRef.current = false;
        setShowResolutionSurvey(false);
        startCloseCountdown();
      }, SURVEY_TIMEOUT_MS);
    }, INACTIVITY_TIMEOUT);
  }, [isOpen, isMobileSessionActive, isBlockedByOtherDevice, botId, userId]);

  // Función para manejar actividad del usuario (usada por listeners y componentes hijos)
  const handleUserActivity = useCallback((e) => {
    // Si se llama sin evento (desde MessageInput), simplemente resetear
    if (!e) {
      resetInactivityTimer();
      return;
    }

    // Si se llama con evento (desde event listeners), verificar que sea dentro del widget
    // ✅ Verificar que actualRootRef.current existe antes de acceder a contains
    if (actualRootRef.current && actualRootRef.current.contains(e.target)) {
      const eventInfo = `tipo=${e.type}, target=${e.target.tagName}${e.target.id ? '#'+e.target.id : ''}`;
      resetInactivityTimer();
    } else {
      // ...existing code...
    }
  }, [resetInactivityTimer]);

  // Detectar interacción del usuario para resetear timer
  useEffect(() => {
    if (!isOpen) {
      return;
    }


    // Escuchar múltiples eventos de interacción en el documento
    const events = ['mousedown', 'keydown', 'touchstart', 'click', 'input'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true); // true = captura en fase de captura
    });

    // Iniciar el timer cuando el widget se abre
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen, resetInactivityTimer, handleUserActivity]);

  // 🆕 EFFECT: Cuando móvil se cierra, reanudar timer de inactividad
  useEffect(() => {
    if (isMobileSessionActive) {
      // Pausar - limpiar cualquier timer activo
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    } else if (isOpen) {
      // Reanudar - reiniciar el timer
      resetInactivityTimer();
    }
  }, [isMobileSessionActive, isOpen, resetInactivityTimer]);

  // 📊 LOG: Cuando se muestra/oculta el mensaje de inactividad
  useEffect(() => {
    // Eliminado log de inactividad
  }, [showInactivityMessage]);

  // 🔴 Conteo regresivo: 10, 9, 8... cuando se muestra alerta de inactividad
  useEffect(() => {
    if (!showInactivityMessage) return;
    const id = setInterval(() => {
      setInactivityCountdown(prev => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showInactivityMessage]);

  // 🔴 LÓGICA DE INACTIVIDAD CON WIDGET CERRADO
  // Si el widget está cerrado por más de 3 minutos, limpiar caché y cerrar conversación
  const inactivityClosedTimerRef = useRef(null);

  useEffect(() => {
    // Si widget está abierto o cerrado, no limpiar caché por inactividad aquí
    if (inactivityClosedTimerRef.current) {
      clearTimeout(inactivityClosedTimerRef.current);
      inactivityClosedTimerRef.current = null;
    }
    // El caché solo se limpia por cierre explícito o expiración real (evento de inactividad en el widget abierto)
    return;
  }, [isOpen, CACHE_KEY]);

  // Resetear timer cuando se envía un mensaje
  const handleResetInactivityOnMessage = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);


  // LOGS de creación de conversación y mensajes
  // Variable para guardar el mensaje pendiente
  let pendingUserMessage = null;

  // Helper para normalizar file URLs como key de deduplicación
  const fileUrlForKey = useCallback((url) => {
    if (!url || typeof url !== "string") return "";
    try {
      if (url.startsWith("http")) return new URL(url).pathname;
      return (url.split("?")[0] || "").trim();
    } catch (e) {
      return (url || "").trim();
    }
  }, []);

  // Callback cuando InputArea confirma que un archivo fue enviado
  const handleFileSent = useCallback((data) => {
    if (!data) return;
    pendingFileMessageRef.current = null;
    const newFileUrl = data.fileUrl || data.multipleFiles?.[0]?.fileUrl || data.multipleFiles?.[0]?.filePath;
    const newKey = fileUrlForKey(newFileUrl);
    setMessages(prev => {
      // Si el servidor ya envió ReceiveMessage con este fileUrl, no añadir optimista (evita duplicado)
      if (newKey) {
        const alreadyFromServer = prev.some(m => {
          if (m.from !== "user" || !m.multipleFiles?.length) return false;
          const url = m.multipleFiles[0]?.fileUrl ?? m.multipleFiles[0]?.filePath ?? m.multipleFiles[0]?.url;
          return fileUrlForKey(url) === newKey;
        });
        if (alreadyFromServer) return prev;
      }
      const tempId = uuidv4();
      const fileMsg = normalizeMessage({
        tempId,
        id: tempId,
        from: "user",
        status: "sent",
        timestamp: new Date().toISOString(),
        multipleFiles: data.multipleFiles || (data.fileUrl ? [{
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileType: data.fileType,
          fileContent: data.fileContent
        }] : [])
      });
      pendingFileMessageRef.current = fileMsg;
      return [...prev, fileMsg];
    });
    setFileInputKey(k => k + 1); // 🔄 Forzar input file fresco
    handleResetInactivityOnMessage();
    handleUserActivity?.();
  }, [fileUrlForKey, handleResetInactivityOnMessage, handleUserActivity]);

  const sendMessage = async () => {
    console.log('[VOIA-DBG] sendMessage llamado — isBotReady:', isBotReady, 'isConnected:', isConnected, 'connState:', connectionRef.current?.state);
    if (!isBotReady) { console.warn('[VOIA-DBG] sendMessage abortado: isBotReady=false'); return; }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    if (isMobileLocked) return;

    // Solo bloquear input si la IA está activa (esperando respuesta del bot)
    // Si la IA está pausada, el agente humano responde y no hay que bloquear
    if (!isAiPausedRef.current) {
      setIsBotProcessing(true);
      // Safety fallback: release lock after 30s in case the response never arrives
      setTimeout(() => setIsBotProcessing(false), 30000);
    }

    // LOG: Mensaje de usuario con origen y userId
    if (isMobileView) {
    } else {
    }

    // Optimistic UI: mostrar el mensaje del usuario inmediatamente
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
    handleResetInactivityOnMessage();
    handleUserActivity(); // Extiende el periodo de limpieza por inactividad

    // Enviar al backend si la conexión está lista
    let connection = connectionRef.current;
    let convId = conversationIdRef.current;
    let retries = 0;

    // 🔄 Esperar hasta que la conexión esté realmente lista
    while (retries < 20) { // 20 retries * 200ms = 4 segundos máximo
      connection = connectionRef.current;
      convId = conversationIdRef.current;
      if (connection && connection.state === "Connected" && convId) {
        break;
      }
      if (retries > 0 && retries % 5 === 0) {
      }
      await new Promise(res => setTimeout(res, 200));
      retries++;
    }
    if (!connection || connection.state !== "Connected" || !convId) {
      console.error('[LOG][MESSAGE] ❌ No se pudo enviar: conexión no lista después de esperar');
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: "error" } : m));
      return;
    }
    try {
      // 🔴 CRÍTICO: El backend espera userId como int? (nullable int)
      // Si userId es "anon" o no es un número válido, enviar null
      let numericUserId = null;
      if (userId !== null && userId !== undefined && userId !== 'anon') {
        const parsed = parseInt(userId, 10);
        if (!isNaN(parsed) && parsed > 0) {
          numericUserId = parsed;
        }
      }
      const payload = {
        botId,
        userId: numericUserId, // null si es anon, o número si es válido
        question: trimmedMessage,
        tempId,
        modelName: botContext?.settings?.modelName || "gpt-3.5-turbo",
        temperature: botContext?.settings?.temperature || 0.7,
        maxTokens: botContext?.settings?.maxTokens || 150,
        userLocation: userLocation || { country: 'Unknown', city: 'Unknown', language: 'es' },
        origen: isMobileView ? 'movil' : 'widget'
      };
      // LOG: Payload enviado al backend con origen y userId
      await connection.invoke("SendMessage", convId, payload);
    } catch (err) {
      // 🚫 Si el error es por usuario bloqueado, mostrar overlay
      const errMsg = String(err?.message || err || '');
      console.error('[SendMessage] Error al invocar SendMessage:', errMsg, err);
      if (errMsg.includes('USER_BLOCKED') || errMsg.includes('bloqueado')) {
        console.warn('🚫 [SendMessage] Usuario bloqueado detectado en envío:', errMsg);
        setIsUserBanned(true);
        isUserBannedRef.current = true;
        setIsConnected(false);
        return;
      }
      // Si el error es por token expirado, guardar el mensaje pendiente y renovar el token
      if (err?.response?.status === 401) {
        pendingUserMessage = {
          ...payload
        };
        // Renovar el token y reintentar
        const newToken = await renewWidgetToken(botId);
        if (newToken) {
          localStorage.setItem('token', newToken);
          // Reintentar el envío del mensaje pendiente
          try {
            // Esperar a que la conexión esté lista
            let retries = 0;
            while ((!isConnected || !conversationIdRef.current || !connectionRef.current || connectionRef.current.state !== "Connected") && retries < 10) {
              await new Promise(res => setTimeout(res, 200));
              retries++;
            }
            if (isConnected && conversationIdRef.current && connectionRef.current && connectionRef.current.state === "Connected") {
              await connectionRef.current.invoke("SendMessage", conversationIdRef.current, pendingUserMessage);
              pendingUserMessage = null;
            } else {
              console.error('[ERROR][MESSAGE][RETRY] No se pudo reenviar el mensaje pendiente tras renovar token.');
            }
          } catch (retryErr) {
            console.error('[ERROR][MESSAGE][RETRY] Error al reenviar mensaje pendiente tras renovar token:', retryErr);
          }
        }
      }
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: "error" } : m));
      setIsTyping(false);
      setTypingSender(null);
      setIsBotProcessing(false);
    }
  };

  // Función para renovar el token del widget (debe implementarse según tu backend)
  async function renewWidgetToken(botId) {
    try {
      // Aquí deberías hacer una petición al backend para obtener un nuevo token público
      // Ejemplo usando fetch:
      const response = await fetch(`/api/Bots/${botId}/public-token`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        return data.token;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

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
    borderRadius: isMobileView ? "0px" : "16px", // Sin bordes redondeados en móvil para fullscreen
    width: isMobileView ? "100%" : "350px", // 380px en desktop, fullwidth en móvil
    maxWidth: isMobileView ? "100%" : "380px", // Fullwidth en móvil
    height: "100%", // fill the available container height
    maxHeight: isMobileView ? "100%" : "600px", // Fullheight en móvil
    boxShadow: isMobileView ? "none" : "0 2px 15px rgba(0,0,0,0.15)",
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
    "bottom-right": { position: 'absolute', bottom: '0px', right: '0px' },
    "bottom-left": { position: 'absolute', bottom: '0px', left: '0px' },
    "top-right": { position: 'absolute', top: '0px', right: '0px' },
    "top-left": { position: 'absolute', top: '0px', left: '0px' },
    "center-left": { position: 'absolute', top: '50%', left: '0px', transform: 'translateY(-50%)' },
    "center-right": { position: 'absolute', top: '50%', right: '0px', transform: 'translateY(-50%)' },
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
      // 📱 MÓVIL: Ocupar todo el ancho y alto de la pantalla
      if (isMobileView) {
        return {
          position: 'fixed',
          zIndex: 99999,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100vh',
          margin: 0,
          padding: 0
        };
      }
      
      // 🖥️ WIDGET/DEMO: Usar posicionamiento normal
      const topOffset = 80; // px to avoid overlapping the dashboard nav/header
      switch (position) {
        case 'bottom-right':
          return { position: 'fixed', zIndex: 99999, right: '20px', bottom: '20px', width: '380px' };
        case 'bottom-left':
          return { position: 'fixed', zIndex: 99999, left: '20px', bottom: '20px', width: '380px' };
        case 'top-right':
          return { position: 'fixed', zIndex: 99999, right: '20px', top: `${topOffset}px`, width: '380px' };
        case 'top-left':
          return { position: 'fixed', zIndex: 99999, left: '20px', top: `${topOffset}px`, width: '380px' };
        case 'center-left':
          return { position: 'fixed', zIndex: 99999, left: '20px', top: '50%', transform: 'translateY(-50%)', width: '380px' };
        case 'center-right':
        default:
          return { position: 'fixed', zIndex: 99999, right: '20px', top: '50%', transform: 'translateY(-50%)', width: '380px' };
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
      // En móvil mantener 100vh; en desktop/demo dejar que el inner widget se auto-dimensione
      height: isMobileView ? '100vh' : 'auto',
      margin: 0,
    }
    : wrapperStyle;


  const openImageModal = (images, clickedImageUrl, blobUrlsMap = {}, startIndex = 0) => {
    // Reset state then open modal after a tiny delay so layout stabilizes
    setImageGroup([]);
    setImageGroupBlobUrls({});
    setActiveImageIndex(0);
    setIsImageModalOpen(false);

    setTimeout(() => {
      // 🔹 Si pasaron startIndex directamente, usarlo. Si no, intentar encontrar por URL
      let index = startIndex;
      if (startIndex === 0 && clickedImageUrl) {
        // Intentar encontrar por URL si startIndex es 0 (podría ser coincidencia)
        const foundIndex = images.findIndex((img) => {
          try {
            const url = img.fileUrl && String(img.fileUrl).startsWith("http")
              ? img.fileUrl
              : `http://localhost:5006${img.fileUrl}`;
            return url === clickedImageUrl;
          } catch (e) {
            return false;
          }
        });
        if (foundIndex >= 0) index = foundIndex;
      }

      setImageGroup(images || []);
      setImageGroupBlobUrls(blobUrlsMap || {});
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
        // timeoutIds.push(messageId); // Eliminar duplicado fuera de contexto

        totalDelay += item.after ?? 0;
      } else {
        totalDelay += item.after ?? 0;
        const messageId = setTimeout(() => {
          const newMsg = normalizeMessage({
            id: `demo-${counter++}-${Date.now()}`,
            from: 'user',
            text: item.content,
            type: "text",
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

  const isInputDisabled = isDemo ? true : (!isConnected || isMobileLocked || isBlockedByOtherDevice || isMobileConversationExpired || isUserBanned || isBotProcessing);

  // 🔍 DEBUG: Log del estado del input
  useEffect(() => {

  }, [isInputDisabled, isDemo, isConnected, isMobileLocked, isBlockedByOtherDevice, isMobileConversationExpired, isMobileView]);

  // --- FIN DE HOOKS ---

  return (
    <div ref={actualRootRef} style={outerStyle}>
      {/* Spinner keyframes - injected inline to avoid touching global CSS files */}
      <style>{`
        @keyframes spin { 
          from { transform: rotate(0deg);} 
          to { transform: rotate(360deg);} 
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
      {!isOpen && !isMobileView ? (
        // 🔘 Botón flotante cuando está cerrado (oculto en vista móvil)
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
          style={{
            backgroundColor: headerBackground,
            borderRadius: "50%",
            width: "70px",
            height: "70px",
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
                  e.target.style.display = "none";
                }}
              />
            )}
          </div>
        </button>
      ) : (
        // 💬 Widget abierto
        <div style={{
          ...widgetStyle,
          pointerEvents: "auto",
          margin: '0 auto',
          // 📱 MÓVIL: Ocupar todo el espacio disponible
          ...(isMobileView ? {
            width: '100%',
            height: '100vh',
            maxWidth: '100%',
            maxHeight: '100vh',
            borderRadius: 0,
            margin: 0,
            padding: 0
          } : {
            // 🖥️ WIDGET/DEMO: Usar tamaños normales
            height: previewMode ? widgetStyle.maxHeight : widgetStyle.height
          }),
          position: 'relative'
        }}>
          {/* Overlay para conversación expirada en móvil */}
          <MobileConversationExpired isExpired={isMobileConversationExpired} />

          {/* 🔥 Header */}
          <div
            style={{
              backgroundColor: headerBackground,
              width: "100%",
              height: "65px",
              // 📱 MÓVIL: Sin border-radius para ocupar esquinas completas
              borderTopLeftRadius: isMobileView ? 0 : "16px",
              borderTopRightRadius: isMobileView ? 0 : "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
              // 📱 MÓVIL: Más padding a la derecha
              paddingRight: isMobileView ? "16px" : "8px",
            }}
          >
            {/* 📌 Avatar + Título */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                // 📱 MÓVIL: Más padding a la izquierda
                paddingLeft: isMobileView ? "20px" : "16px",
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
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontSize: "13px",
                  lineHeight: "1.1",
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
              {/* QR: solo en desktop, solo si hay conversación activa y el plan lo permite */}
              {!isMobileView && allowMobileVersion && (conversationId || conversationIdRef.current) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent' }}>
                  <div style={{ textAlign: 'right', color: headerTextColor, fontSize: 10, lineHeight: 1.1, marginRight: 0, minWidth: 55, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end', height: '50px', marginTop: '10px', marginBottom: '0px', paddingTop: '0px' }}>
                    <div style={{ fontWeight: 600, fontSize: 9.5, color: headerTextColor, marginBottom: 0 }}>
                      Continúa en<br />tu móvil
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: '0px' }}>
                    <div style={{ background: '#ffffff', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                      <QRCodeCanvas
                        value={`${process.env.REACT_APP_DEV_DASHBOARD_URL || 'http://localhost:3000'}/chat/mobile?bot=${botId}&conversation=${conversationId || conversationIdRef.current || ''}`}
                        size={43}
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* Aviso de versión móvil disponible en plan superior */}

              {/* ❌ Botón cerrar - NO mostrar en vista móvil */}
              {!isMobileView && (
                <button
                  onClick={() => {
                    // ✅ Al cerrar manualmente, el useEffect de cierre manual (líneas 902-1008) 
                    // detectará la transición isOpen=true→false y activará el timer de 3 minutos
                    // NO es necesario hacer nada más aqu                   
                    // Solo cerrar el widget - el useEffect maneja el resto
                    setIsOpen(false);
                  }}
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
              )}
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

          {/*  Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "16px",
              position: "relative",
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
              isMobileView={isMobileView}
              onJumpToReply={handleJumpToReply}
              highlightedMessageId={highlightedMessageId}
              conversationId={conversationId}
            />

            <div ref={messagesEndRef} />
          </div>

          {/* ENCUESTA DE RESOLUCIÓN — aparece antes del aviso de inactividad */}
          {showResolutionSurvey && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1001,
                backgroundColor: "rgba(255,255,255,0.98)",
                border: "2px solid #66bb6a",
                borderRadius: "16px",
                padding: "24px 28px",
                textAlign: "center",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                minWidth: "260px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>🤔</div>
              <div style={{ color: "#333", fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>
                ¿Resolvimos tu consulta?
              </div>
              <div style={{ color: "#888", fontSize: "12px", marginBottom: "18px" }}>
                Tu respuesta nos ayuda a mejorar
              </div>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                <button
                  onClick={async () => {
                    surveyAnsweredRef.current = true;
                    showingSurveyRef.current = false;
                    clearTimeout(surveyTimeoutRef.current);
                    setShowResolutionSurvey(false);
                    await submitSurveyRef.current?.(true);
                    startCloseRef.current?.();
                  }}
                  style={{
                    background: "#4caf50", color: "#fff", border: "none",
                    borderRadius: "8px", padding: "10px 20px",
                    fontSize: "14px", cursor: "pointer", fontWeight: "600",
                  }}
                >
                  Sí ✓
                </button>
                <button
                  onClick={async () => {
                    surveyAnsweredRef.current = true;
                    showingSurveyRef.current = false;
                    clearTimeout(surveyTimeoutRef.current);
                    setShowResolutionSurvey(false);
                    await submitSurveyRef.current?.(false);
                    startCloseRef.current?.();
                  }}
                  style={{
                    background: "#ef5350", color: "#fff", border: "none",
                    borderRadius: "8px", padding: "10px 20px",
                    fontSize: "14px", cursor: "pointer", fontWeight: "600",
                  }}
                >
                  No ✗
                </button>
              </div>
            </div>
          )}

          {/* 🔴 MENSAJE DE INACTIVIDAD (Centrado en overlay con countdown) */}
          {showInactivityMessage && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                backgroundColor: "rgba(255, 255, 255, 0.97)",
                border: "2px solid #ef5350",
                borderRadius: "16px",
                padding: "24px 28px 28px",
                textAlign: "center",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
              }}
            >
              <div
                style={{
                  color: "#333",
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "12px",
                }}
              >
                Conversación por expirar
              </div>
              <div
                style={{
                  color: "#666",
                  fontSize: "13px",
                  marginBottom: "16px",
                  lineHeight: 1.4,
                }}
              >
                Por inactividad la conversación se cerrará. Interactúa con el chat para continuar.
              </div>
              <div
                style={{
                  color: "#b71c1c",
                  fontSize: "56px",
                  fontWeight: "700",
                  lineHeight: 1,
                  marginBottom: "4px",
                }}
              >
                {inactivityCountdown ?? INACTIVITY_COUNTDOWN_SEC}
              </div>
              <div
                style={{
                  color: "#c62828",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                segundos
              </div>
            </div>
          )}

          {/* �📝 Input + Adjuntar + Enviar */}
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
            isInputDisabled={isInputDisabled || (isBlockedByOtherDevice && !isMobileView)}
            disabledPlaceholder={isBotProcessing ? "Esperando respuesta..." : undefined}
            allowImageUpload={effectiveStyle.allowImageUpload}
            allowFileUpload={effectiveStyle.allowFileUpload}
            onFileSent={handleFileSent}
            onUserActivity={handleUserActivity}
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

          {/* Overlay de bloqueo por sesión móvil activa */}
          {isBlockedByOtherDevice && !isMobileView && (
            <DeviceConflictOverlay
              isBlocked={true}
              blockMessage={blockMessage || "Conversación abierta en móvil. Por favor, continúa desde ahí."}
            />
          )}
          {showDeviceConflictOverlay && (
            <>
              <DeviceConflictOverlay
                isBlocked={true}
                blockMessage={blockMessage || "Conversación abierta en móvil. Por favor, continúa desde ahí."}
              />
            </>
          )}

          {/* 🚫 Overlay de bloqueo por admin */}
          {isUserBanned && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.82)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
              color: '#fff',
              padding: '24px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '44px', marginBottom: '14px' }}>🚫</div>
              <div style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '10px' }}>
                Acceso restringido
              </div>
              <div style={{ fontSize: '13px', opacity: 0.85, lineHeight: 1.5, maxWidth: '280px' }}>
                Tu acceso a este chat ha sido restringido por el administrador.
              </div>
              {banContactEmail && (
                <div style={{ marginTop: '16px', fontSize: '13px', opacity: 0.9, lineHeight: 1.5 }}>
                  Si crees que esto es un error, contáctanos en:<br/>
                  <a 
                    href={`mailto:${banContactEmail}`} 
                    style={{ color: '#60cfff', textDecoration: 'underline', fontWeight: 'bold' }}
                  >
                    {banContactEmail}
                  </a>
                </div>
              )}
            </div>
          )}

          <ImagePreviewModal
            isOpen={isImageModalOpen}
            onClose={() => setIsImageModalOpen(false)}
            imageGroup={imageGroup}
            imageGroupBlobUrls={imageGroupBlobUrls}
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
  widgetClientSecret: PropTypes.string,
  title: PropTypes.string,
  theme: PropTypes.oneOf(["light", "dark", "custom"]),
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  headerBackgroundColor: PropTypes.string,
  fontFamily: PropTypes.string,
  avatarUrl: PropTypes.string,
  isDemo: PropTypes.bool,
  isMobileView: PropTypes.bool,
  allowMobileVersion: PropTypes.bool,
  conversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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