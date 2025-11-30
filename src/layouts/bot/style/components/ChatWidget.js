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


const viaLogo = process.env.PUBLIC_URL + "/VIA.png";
const defaultAvatar = "/VIA.png";

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
}) {
  // Modulariza la instancia y la clave de caché
  const { botId, userId, widgetInstanceId, CACHE_KEY } = useWidgetInstance(propBotId, propUserId);

  // Estados y hooks principales
  const connectionRef = useRef(null);
  const widgetClientSecret = propWidgetClientSecret ?? null;  // ✅ NUEVO
  const conversationIdRef = useRef(propConversationId); // Inicializar con prop
  const [isOpen, setIsOpen] = useState(isMobileView); // Si es móvil, abrir por defecto
  const [botStyle, setBotStyle] = useState(style || null);
  const [isDemo, setIsDemo] = useState(initialDemo);
  const [botContext, setBotContext] = useState(null);
  const [messages, setMessages] = useState([]);
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
  // Hook para caché y sesión modularizado
  const {
    saveConversationCache,
    loadConversationCache,
    clearCache,
    loadedConversationsRef,
  } = useConversationCache(CACHE_KEY);
  const widgetExplicitlyClosedRef = useRef(false); // 🆕 Ref para rastrear si el usuario cerró el widget explícitamente
  const qrHistoryLoadedRef = useRef(false); // 🆕 Ref para evitar cargar historial QR dos veces

  // Declarar conversationId antes de usarlo en el hook
  const [conversationId, setConversationId] = useState(propConversationId);

  // El hook debe usarse solo en la web, no en móvil
  const deviceSessionLock = useDeviceSessionLock(
    conversationId,
    connectionRef.current,
    false // Siempre false para la web, el móvil no debe bloquearse a sí mismo
  );

  const [isBlockedByOtherDevice, setIsBlockedByOtherDevice] = useState(deviceSessionLock.isBlockedByOtherDevice);
  const [blockMessage, setBlockMessage] = useState(deviceSessionLock.blockMessage);
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

  // 🔴 NUEVO: EFFECT para escuchar evento de expiración desde MobileChat
  // Cuando MobileChat expira por inactividad, envía window.parent.postMessage
  useEffect(() => {
    const handleMobileInactivityExpired = (event) => {
      // Validar que sea el evento correcto
      if (event.data?.type === 'mobile-inactivity-expired') {
        // Encapsular limpieza en función robusta
        const cleanUpAfterBackendConfirmation = () => {
          try {
            clearCache();
            sessionStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_KEY);
          } catch (e) {
            console.error('❌ Error limpiando caché:', e);
          }
          window.__cacheCleaning = true;
          setConversationId(null);
          conversationIdRef.current = null;
          setMessages([]);
          setPromptSent(false);
          promptSentRef.current = false;
          welcomeShownRef.current = false;
          setIsOpen(false);
          setIsMobileConversationExpired && setIsMobileConversationExpired(false);
          setIsMobileSessionActive && setIsMobileSessionActive(false);
          setBlockMessage && setBlockMessage("");
          setIsBlockedByOtherDevice && setIsBlockedByOtherDevice(false);
          setIaWarning && setIaWarning(null);
          setBotContext && setBotContext(null);
          setCapturedFields && setCapturedFields([]);
          setPreviewImageUrl && setPreviewImageUrl(null);
          setIsImageModalOpen && setIsImageModalOpen(false);
          setImageGroup && setImageGroup([]);
          setImageGroupBlobUrls && setImageGroupBlobUrls({});
          setActiveImageIndex && setActiveImageIndex(0);
          setTypingSender && setTypingSender(null);
          setIsTyping && setIsTyping(false);
          setWelcomeMessage && setWelcomeMessage(null);
          setBotStyle && setBotStyle(null);
          setIsBotReady && setIsBotReady(false);
          setShowConnectionDebug && setShowConnectionDebug(false);
          setConnectionStatus && setConnectionStatus("desconocido");
          setIsDemo && setIsDemo(false);
          setUserLocation && setUserLocation(null);
          setMessage && setMessage("");
          setTimeout(() => { window.__cacheCleaning = false; }, 1000);
        };

        // Aquí deberías llamar a la función SOLO tras confirmación del backend
        // Por ejemplo, tras recibir un evento SignalR o respuesta fetch:
        // Ejemplo:
        // connection.invoke('CloseConversation', conversationIdRef.current)
        //   .then(() => cleanUpAfterBackendConfirmation())
        //   .catch(err => console.error('Error cerrando conversación en backend:', err));
        //
        // Si ya tienes la confirmación, llama directamente:
        // cleanUpAfterBackendConfirmation();
      }
    };

    window.addEventListener('message', handleMobileInactivityExpired);

    return () => {
      window.removeEventListener('message', handleMobileInactivityExpired);
    };
  }, [CACHE_KEY]);

  // EFFECT: Detectar cuando la conversación es cerrada en web (móvil entra en standby)
  // O cuando está bloqueada por otro dispositivo
  useEffect(() => {
    if (!isMobileView || !conversationIdRef.current) return;

    // 🔒 CAMBIO: Cuando web se abre, CERRAR móvil automáticamente
    if (isBlockedByOtherDevice) {
      console.log('🔒 [Mobile] Web está activo en esta conversación - cerrando móvil automáticamente');
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

    const fetchWelcomeMessage = async () => {
      try {
        const params = new URLSearchParams({
          botId: botId,
          country: userLocation.country || 'Unknown',
          city: userLocation.city || 'Unknown',
          language: userLocation.language || 'es'
        });

        const url = `http://localhost:5006/api/botwelcomemessages/get-by-location?${params}`;

        const response = await fetch(url, { credentials: 'include' });

        if (response.ok) {
          const data = await response.json();

          setWelcomeMessage({
            text: data.message,
            country: data.country,
            city: data.city,
            matchType: data.matchType,
            source: data.source
          });
        } else {
          const errorData = await response.json();
        }
      } catch (err) {
      }
    };

    fetchWelcomeMessage();
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

    const handleReconnected = () => {
      console.log('✅ [SignalR] Reconectado exitosamente');
      setConnectionStatus("conectado");
      setShowConnectionDebug(true);
      // 🔹 ocultar después de 2s
      setTimeout(() => setShowConnectionDebug(false), 2000);
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
    setMessages(newMessages);
  };

  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isMobileLocked, setIsMobileLocked] = useState(false);
  const [imageGroup, setImageGroup] = useState([]);
  const [imageGroupBlobUrls, setImageGroupBlobUrls] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
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

  // ✅ Única lógica de carga de caché al inicio, evitando duplicados
  // 🔹 En móvil, NO cargar caché - sesión limpia
  useEffect(() => {
    // En móvil, no cargar historial - conversación "nueva" en ese dispositivo
    if (isMobileView) {
      return; // No cargar caché en móvil
    }

    // 🔹 SOLO cargar caché si NO hay propConversationId (conversación nueva/reapertura)
    // Si hay propConversationId (desde QR o URL), el historial vendrá del servidor
    if (propConversationId) {
      console.log('🔧 [cacheLoad] Ignorando caché - usando propConversationId del servidor');
      return;
    }

    const cached = loadConversationCache();
    if (cached) {
      setConversationId(cached.conversationId);
      // Unificar mensajes duplicados por tempId/id
      const unifiedMessages = unifyMessages(cached.messages.map(normalizeMessage));
      setMessages(unifiedMessages);
      if (unifiedMessages.some(m => m.from === "user")) {
        setPromptSent(true);
        promptSentRef.current = true;
      }
      // Evitar crear nueva conversación y welcome message si hay caché válido
      return;
    } else {
      console.log('[CACHE] No se encontró caché válido, se creará nueva conversación.');
      // Aquí sí se puede crear la conversación y el mensaje de bienvenida
    }
  }, [isMobileView, propConversationId]);

  // 🎯 NOTA: Carga de historial QR ahora ocurre EN initConnection para evitar race conditions
  // Mantenemos este useEffect solo como respaldo para casos edge
  useEffect(() => {
    if (!propConversationId || !isMobileView) return;

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
            const normalized = normalizeMessage({
              id: msg.id,
              type: msg.type,
              // 🔹 NO pasar texto si es un archivo agrupado - solo para mensajes de texto y archivos individuales
              ...(!(msg.isGroupedFile) && { text: msg.text }),
              content: msg.text,
              from: msg.fromRole, // fromRole -> from
              sender: msg.fromRole,
              timestamp: msg.timestamp,
              fromName: msg.fromName,
              fromAvatarUrl: msg.fromAvatarUrl,
              // 🆕 Pasar datos de archivo agrupado
              ...(msg.isGroupedFile && {
                isGroupedFile: true,
                files: msg.files
              }),
              // Datos de archivo individual (si no es grupo)
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

          // 🔹 Deduplicar archivos dentro de cada mensaje por ID
          const messagesWithUniqueFiles = historyMessages.map(msg => {
            if (msg.isGroupedFile && msg.multipleFiles?.length > 0) {
              const seenFileIds = new Set();
              const uniqueFiles = [];

              for (const file of msg.multipleFiles) {
                // Deduplicar por ID del archivo
                if (!seenFileIds.has(file.id)) {
                  seenFileIds.add(file.id);
                  uniqueFiles.push(file);
                } else {
                  console.warn(`⚠️ [loadHistoryFromQR] Eliminando duplicado - archivo ID ${file.id}: ${file.fileUrl}`);
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

          setMessages(uniqueMessages);

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
      console.log('[LOG][CACHE] Guardando conversación en caché:', {
        conversationId,
        messages
      });
      saveConversationCache(conversationId, messages);
    }
  }, [messages, conversationId]);

  // 🔴 Ref para rastrear si fue una transición de abierto a cerrado
  const wasOpenRef = useRef(false);

  // 🔴 SAFETY: Si el widget se cierra manualmente, solo limpiar estado en memoria (NO caché ni backend)
  // Al reabrir, si hay caché válido y no ha expirado, se recupera la conversación anterior
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
      if (cleanupInProgressRef.current) {
        console.log(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] Proceso de limpieza ya iniciado, se cancela duplicado.`);
        return;
      }
      cleanupInProgressRef.current = true;
      // Limpiar solo el estado en memoria
      setConversationId(null);
      conversationIdRef.current = null;
      setMessages([]);
      setPromptSent(false);
      promptSentRef.current = false;
      welcomeShownRef.current = false;
      // NO limpiar caché ni cerrar conversación en backend aquí
      try {
        clearCache();
        sessionStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_KEY);
        console.log(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] Caché y storage borrados por cierre manual. CACHE_KEY:`, CACHE_KEY);
      } catch (e) {
        console.log(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] Falló al borrar caché/storage por cierre manual.`, e);
      }
      console.log(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] Widget cerrado manualmente por el usuario.`);
      setTimeout(() => { cleanupInProgressRef.current = false; }, 1000);
    }
  }, [isMobileView, isOpen, conversationId, messages.length, CACHE_KEY]);

  const messageRefs = useRef([]);
  messageRefs.current = messages.map((_, i) => messageRefs.current[i] ?? React.createRef());
  const typingRef = useRef(null);


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
      const newMessage = normalizeMessage(msg);
      if (!newMessage.color) newMessage.color = getSenderColor(newMessage.from);
      // LOG: Mensaje recibido
      console.log('[LOG][MESSAGE] Mensaje recibido:', newMessage);
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
        // 3. Si ya existe por id, no agregar
        const messageExists = prev.some(m => m.id === newMessage.id);
        if (messageExists) {
          // (Eliminado log de mensaje duplicado)
          return prev;
        }
        console.log('💬 [SignalR] Mensaje nuevo agregado:', newMessage);
        return [...prev, newMessage];
      });
    };

    let connection;
    // Declare handler here so cleanup (return) can reference it without being undefined
    let handleMessageQueued;
    let handleMobileSessionChanged;

    const initConnection = async () => {
      try {
        // Usar el valor correcto de widgetToken
        const widgetToken = propWidgetToken;
        connection = createHubConnection(widgetToken, widgetClientSecret);
        connectionRef.current = connection;

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
          // ✅ Si no hay conversación desde QR ni en ref, intentar cargar del caché
          // PERO SOLO SI NO FUE CERRADO EXPLÍCITAMENTE
          const cached = loadConversationCache();

          if (cached && cached.conversationId && !widgetExplicitlyClosedRef.current) {
            convId = cached.conversationId;
          } else if (widgetExplicitlyClosedRef.current && cached?.conversationId) {
            widgetExplicitlyClosedRef.current = false; // Resetear la bandera después de usar
            convId = null; // Forzar a crear nueva
          } else {
          }

          if (!convId) {
            // ✅ Si no hay caché válido, crear nueva conversación CON NUEVA SESIÓN
            convId = await createConversation(userId, botId, widgetClientSecret, true);  // ✅ Pasar clientSecret
          }
        }

        if (!convId) throw new Error("No se recibió conversationId");

        // ✅ CRÍTICO: Convertir a número (puede venir como string de query params)
        const convIdNum = typeof convId === 'string' ? parseInt(convId, 10) : convId;
        if (isNaN(convIdNum) || convIdNum <= 0) {
          throw new Error(`conversationId inválido: ${convId}`);
        }

        conversationIdRef.current = convIdNum;
        setConversationId(convIdNum);


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

              setMessages(uniqueMessages);
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
              console.log(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] Caché, storage y estados borrados por cierre manual. CACHE_KEY:`, CACHE_KEY);
            } catch (e) {
              console.log(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] Falló al borrar caché/storage por cierre manual.`, e);
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
            await connection.invoke("JoinRoom", convId);
            await connection.invoke("UserIsActive", convId);
          } catch (err) {
            console.error('❌ [SignalR] Error al unir y activar usuario:', err);
          }
        };

        // Inicializar conexión SOLO si conversationId está definido
        if (convIdNum) {
          await connection.start();
          setConnectionStatus("conectado");
          setIsConnected(true);

          // ✅ Usar nueva función unificada
          await joinAndActivate(convIdNum);
        }

      } catch (err) {
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
        setMessages(uniqueMessages);
        if (uniqueMessages.some(m => m.from === "user")) {
          setPromptSent(true);
          promptSentRef.current = true;
        }
        // Marcar que esta conversación ya fue cargada
        loadedConversationsRef.current.add(conversationId);
      } catch (error) {
        console.error('❌ [loadFreshHistory] Error:', error.message);
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


  useEffect(() => {
    if (!isOpen || !conversationId) return;
    let intervalId = null;
    let isUnmounted = false;
    const sendHeartbeat = async () => {
      try {
        const conn = connectionRef.current;
        if (!conn) return;
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
    intervalId = setInterval(() => {
      if (!isUnmounted) sendHeartbeat();
    }, 30000);
    return () => {
      isUnmounted = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, conversationId]);

  useEffect(() => {
    const handlePageClose = () => {
      if (conversationId) {
        // Notificar backend de desconexión
        const url = `http://localhost:5006/api/conversations/${conversationId}/disconnect`;
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

  // 🔴 LÓGICA DE INACTIVIDAD (3 minutos = 180,000 ms)
  const INACTIVITY_TIMEOUT = 1 * 60 * 1000; // 1 minuto
  const inactivityTimerRef = useRef(null);
  const closeTimerRef = useRef(null);
  const inactivityWarningShownRef = useRef(false);
  const [showInactivityMessage, setShowInactivityMessage] = useState(false);
  const cleanupInProgressRef = useRef(false);

  // Función para resetear el timer de inactividad
  const resetInactivityTimer = useCallback(() => {
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

    if (!isOpen) return; // No contar inactividad si widget está cerrado

    inactivityTimerRef.current = setTimeout(() => {
      setShowInactivityMessage(true);
      inactivityWarningShownRef.current = true;
      console.log(`[LOG][INACTIVITY][${new Date().toISOString()}] Inactividad detectada. Mostrando mensaje de advertencia.`);

      // Después de 30 segundos más, cerrar el widget automáticamente
      closeTimerRef.current = setTimeout(() => {
        if (cleanupInProgressRef.current) {
          console.log(`[LOG][INACTIVITY][${new Date().toISOString()}] Proceso de limpieza ya iniciado, se cancela duplicado.`);
          return;
        }
        cleanupInProgressRef.current = true;
        // ✅ LIMPIAR CACHÉ - Solo cuando cierre por inactividad
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
          console.log(`[LOG][INACTIVITY][${new Date().toISOString()}] Caché, storage y estados borrados por inactividad. CACHE_KEY:`, CACHE_KEY);
        } catch (e) {
          console.log(`[LOG][INACTIVITY][${new Date().toISOString()}] Falló al borrar caché/storage por inactividad.`, e);
        }

        setIsOpen(false);
        setShowInactivityMessage(false);
        inactivityWarningShownRef.current = false;
        console.log(`[LOG][INACTIVITY][${new Date().toISOString()}] Widget cerrado automáticamente por inactividad.`);
        setTimeout(() => { cleanupInProgressRef.current = false; }, 1000);
      }, 30 * 1000); // 30 segundos adicionales
    }, INACTIVITY_TIMEOUT);
  }, [isOpen, CACHE_KEY, isMobileSessionActive, isBlockedByOtherDevice]);

  // Detectar interacción del usuario para resetear timer
  useEffect(() => {
    if (!isOpen) return;

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    // Escuchar múltiples eventos de interacción
    const events = ['mousedown', 'keydown', 'touchstart', 'click', 'input'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity);
    });

    // Iniciar el timer cuando el widget se abre
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [isOpen, resetInactivityTimer]);

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
  const sendMessage = async () => {
    if (!isBotReady) return;

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    if (isMobileLocked) return;

    // LOG: Mensaje de usuario
    console.log('[LOG][MESSAGE] Usuario envía mensaje:', trimmedMessage);

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

    // Enviar al backend si la conexión está lista
    const connection = connectionRef.current;
    const convId = conversationIdRef.current;
    let retries = 0;
    while ((!isConnected || !convId || !connection || connection.state !== "Connected") && retries < 10) {
      await new Promise(res => setTimeout(res, 200));
      retries++;
    }
    if (!isConnected || !convId || !connection || connection.state !== "Connected") {
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: "error" } : m));
      return;
    }
    try {
      const payload = {
        botId,
        userId,
        question: trimmedMessage,
        tempId,
        modelName: botContext?.settings?.modelName || "gpt-3.5-turbo",
        temperature: botContext?.settings?.temperature || 0.7,
        maxTokens: botContext?.settings?.maxTokens || 150,
        userLocation: userLocation || { country: 'Unknown', city: 'Unknown', language: 'es' }
      };
      // LOG: Payload enviado al backend
      console.log('[LOG][MESSAGE] Payload enviado al backend:', payload);
      await connection.invoke("SendMessage", payload);
    } catch (err) {
      setMessages(prev => prev.map(m => m.tempId === tempId ? { ...m, status: "error" } : m));
      setIsTyping(false);
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
      // let the inner widget size itself; avoid forcing 100% height which can compress it
      height: 'auto',
      // keep a small margin so it doesn't stick to edges
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

  const isInputDisabled = isDemo ? true : (!isConnected || isMobileLocked || isBlockedByOtherDevice || isMobileConversationExpired);

  // 🔍 DEBUG: Log del estado del input
  useEffect(() => {

  }, [isInputDisabled, isDemo, isConnected, isMobileLocked, isBlockedByOtherDevice, isMobileConversationExpired, isMobileView]);

  // --- FIN DE HOOKS ---

  return (
    <div ref={rootRef} style={outerStyle}>
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
          height: previewMode ? widgetStyle.maxHeight : widgetStyle.height,
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
              {/* QR fijo en header: se muestra solo en desktop si hay conversationId. No en móvil */}
              {/* Mostrar QR solo en web y si hay conversación activa */}
              {!isMobileView && (conversationId || conversationIdRef.current) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'transparent' }}>
                  <div style={{ textAlign: 'right', color: headerTextColor, fontSize: 10, lineHeight: 1.1, marginRight: 0, minWidth: 55, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-end', height: '50px', marginTop: '10px', marginBottom: '0px', paddingTop: '0px' }}>
                    <div style={{ fontWeight: 600, fontSize: 9.5, color: headerTextColor, marginBottom: 0 }}>
                      Continúa en<br />tu móvil
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginLeft: '0px' }}>
                    <div style={{ background: '#ffffff', padding: 4, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                      <QRCodeCanvas
                        value={`${window.location.origin}/chat/mobile?bot=${botId}&conversation=${conversationId || conversationIdRef.current || ''}`}
                        size={43}
                      />
                    </div>
                  </div>
                </div>
              )}
              {/* ❌ Botón cerrar - NO mostrar en vista móvil */}
              {!isMobileView && (
                <button
                  onClick={() => {

                    // 🔴 MARCAR que el widget fue cerrado explícitamente
                    widgetExplicitlyClosedRef.current = true;

                    // 🔴 RESETEAR COMPLETAMENTE EL ESTADO cuando el usuario cierra
                    setIsOpen(false);
                    setConversationId(null);
                    conversationIdRef.current = null;
                    setMessages([]);
                    setPromptSent(false);
                    promptSentRef.current = false;

                    // Limpiar caché de sessionStorage
                    try {
                      clearCache();
                      sessionStorage.removeItem(CACHE_KEY);
                      localStorage.removeItem(CACHE_KEY);
                      console.log(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] Caché y storage borrados por cierre manual. CACHE_KEY:`, CACHE_KEY);
                    } catch (e) {
                      console.log(`[LOG][MANUAL_CLOSE][${new Date().toISOString()}] Falló al borrar caché/storage por cierre manual.`, e);
                    }


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
            />

            <div ref={messagesEndRef} />
          </div>

          {/* � MENSAJE DE INACTIVIDAD (Centrado en overlay) */}
          {showInactivityMessage && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 1000,
                backgroundColor: "#ffebee",
                border: "2px solid #ef5350",
                borderRadius: "12px",
                padding: "24px",
                maxWidth: "80%",
                textAlign: "center",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                animation: "pulse 1s infinite",
              }}
            >
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "12px",
                }}
              >
                ⚠️
              </div>
              <div
                style={{
                  color: "#d32f2f",
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Parece que no has respondido
              </div>
              <div
                style={{
                  color: "#c62828",
                  fontSize: "13px",
                  fontWeight: "500",
                }}
              >
                El chat se cerrará en 30 segundos...
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
            isInputDisabled={isInputDisabled || (isBlockedByOtherDevice && !isMobileView)} // 🔹 Deshabilitar si demo, sin conexión o sesión móvil o bloqueado por móvil
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
  conversationId: PropTypes.string,
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