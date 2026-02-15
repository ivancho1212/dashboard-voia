import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useImperativeHandle,
  forwardRef,
  useMemo,
} from "react";
import PropTypes from "prop-types";
import SoftTypography from "components/SoftTypography";
import Divider from "@mui/material/Divider";
import MessageBubble from "./MessageBubble";
import Controls from "./Controls";
import InputChat from "./InputChat";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import TypingIndicator from "./TypingIndicator";
import { CSSTransition } from "react-transition-group";
import { injectTypingAnimation } from "./typingAnimation";
import CheckIcon from "@mui/icons-material/Check";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import TextField from "@mui/material/TextField";
import { Box, Tooltip, Typography } from "@mui/material";
import Button from "@mui/material/Button";
import Loader from "../../../components/Loader";

import TagChip from "components/TagChip";
import {
  getTagsByConversationId,
  createConversationTag,
  updateConversationTag,
  deleteConversationTag,
} from "services/conversationTagsService";
import { updateConversationIsWithAI } from "services/conversationsService";

// Runtime debug toggle. Set `window.__VOIA_DEBUG = true` in the browser console
// to enable verbose ChatPanel debug logging without changing source.
const DEBUG = typeof window !== 'undefined' && window.__VOIA_DEBUG === true;

const ChatPanel = forwardRef(
  (
    {
      conversationId,
      messages = [],
      userName,
      isTyping,
      typingSender,
      typingConversationId,
      onToggleIA,
      iaPaused,
      onSendAdminMessage,
      onStatusChange,
      onBlock,
      status,
      blocked,
      replyTo,
      onReply,
      onCancelReply,
      messageRefs,
      onJumpToReply,
      highlightedMessageId,
      onAdminTyping,
      onAdminStopTyping,
    },
    ref
  ) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [inputValue, setInputValue] = useState("");
    const bottomRef = useRef(null);
    const typingRef = useRef(null);
    const [isUserAtBottom, setIsUserAtBottom] = useState(true);
    const lastMessageIdRef = useRef(null);
    const [hasNewMessageBelow, setHasNewMessageBelow] = useState(false);
    // ✅ Mensajes ahora solo desde estado global (sin duplicación)  
    const hubConnectionRef = useRef(null);
    // Importar SignalR
    const { createHubConnection } = require("services/signalr");
  const [debugDayDividers, setDebugDayDividers] = useState(0);
  const [bannerLabel, setBannerLabel] = useState("");
  const [topVisibleDayLabel, setTopVisibleDayLabel] = useState("");
  const [suppressDividers, setSuppressDividers] = useState(false);
  // Modo de visualización de fechas: 'inline-small' (predeterminado) o 'floating-toast'
  // Cambia con: window.__VOIA_DATE_MODE = 'floating-toast' en la consola del navegador
  const DATE_MODE = typeof window !== 'undefined' ? (window.__VOIA_DATE_MODE || 'inline-small') : 'inline-small';
  const [floatingDateLabel, setFloatingDateLabel] = useState("");
  const floatingDateTimerRef = useRef(null);
  const bannerDebounceRef = useRef(null);
  const bannerPendingRef = useRef(null); // candidate label between debounced ticks
  const bannerStableCountRef = useRef(0); // how many consecutive identical ticks we've seen
  const lastVisibleLabelRef = useRef(null); // last label we observed during finalize
  const observerRef = useRef(null);
  const suppressTimeoutRef = useRef(null);
  const userScrolledRef = useRef(false);
  const dayDividerRefs = useRef({});
  const dayDividerLabelMapRef = useRef(new Map());
  const bannerShownAtRef = useRef(null); // timestamp when banner was shown
  const bannerClearTimerRef = useRef(null);
  const MIN_BANNER_VISIBLE_MS = 300; // minimum time banner stays visible once shown
  const BANNER_SHOW_THRESHOLD = 1; // how many stable ticks to show
  const BANNER_CLEAR_THRESHOLD = 2; // how many stable empty ticks to clear

      // Helper: format day label in Spanish (pulled out so multiple effects can use it)
      const formatDayLabel = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const now = new Date();
        const startOfDay = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Hoy";
        if (diffDays === 1) return "Ayer";

        const getStartOfWeek = (dt) => {
          const copy = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
          const day = (copy.getDay() + 6) % 7; // Monday as start
          copy.setDate(copy.getDate() - day);
          return copy;
        };

        const startOfThisWeek = getStartOfWeek(now);
        if (d >= startOfThisWeek) {
          return d.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^[a-z]/, (m) => m.toUpperCase());
        }

        const prevWeekStart = new Date(startOfThisWeek);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        if (d >= prevWeekStart && d < startOfThisWeek) {
          return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }

        if (d.getFullYear() === now.getFullYear()) {
          return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      };
    const [pendingTag, setPendingTag] = useState(null); // { title, description }
    const [showPendingEditor, setShowPendingEditor] = useState(false);
    const [conversationTags, setConversationTags] = useState([]);
    const [expandedTagIndex, setExpandedTagIndex] = useState(null);
    const isTagLimitReached = conversationTags.length >= 6;
    const [loadingConversationId, setLoadingConversationId] = useState(null);
    const [loadingOlder, setLoadingOlder] = useState(false);

    const inputRef = useRef(null);
    const scrollToBottom = () => {
      // Scroll hacia arriba (top) para mostrar el mensaje más reciente
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const [hasMounted, setHasMounted] = useState(false);
    const lastLoggedForConvRef = useRef(null); // avoid duplicate heavy logs across StrictMode double-mounts

      useImperativeHandle(ref, () => ({
      isInputFocused: () => inputRef.current === document.activeElement,
    }));

      // Marcar como montado para que los useLayoutEffect que dependen de hasMounted
      useEffect(() => {
        setHasMounted(true);
        // Suscribirse a SignalR solo si hay conversationId
        if (conversationId) {
          const connection = createHubConnection(conversationId);
          hubConnectionRef.current = connection;
          connection.start().then(async () => {
            // Unirse explícitamente al grupo 'admin' para recibir todos los mensajes
            try {
              await connection.invoke("JoinAdmin");
            } catch (e) {
              console.warn("[SignalR] No se pudo unir al grupo admin:", e);
            }
            // ✅ NO suscribirse a eventos de mensajes aquí - ya se manejan en index.js
            // Esto evita la duplicación de imágenes y problemas de scroll
            console.log("📡 [ChatPanel] SignalR conectado, usando mensajes del estado global");
          });
        }
        return () => {
          setHasMounted(false);
          const conn = hubConnectionRef.current;
          if (!conn) return;
          hubConnectionRef.current = null;
          // ✅ No hay eventos SignalR que desconectar aquí
          if (conn.state === "Connected" || conn.state === "Connecting") {
            conn.stop().catch(() => {});
          }
        };
      }, [conversationId]);

    useEffect(() => {
      if (iaPaused && inputRef.current) inputRef.current.focus();
    }, [iaPaused]);

    useEffect(() => {
      if (replyTo && inputRef.current) inputRef.current.focus();
    }, [replyTo]);

    useLayoutEffect(() => {
      if (!hasMounted) return; // ⛔ NO HACER NADA HASTA QUE MONTADO

      injectTypingAnimation();

      const container = document.getElementById("chat-container");
      if (!container) return;

      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      const SCROLL_THRESHOLD = 150;
      const atBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < SCROLL_THRESHOLD;
      const isNew = lastMessage.id !== lastMessageIdRef.current;
      if (!isNew) return;

      lastMessageIdRef.current = lastMessage.id;

      if (lastMessage.from === "admin") {
        scrollToBottom();
        setHasNewMessageBelow(false);
        return;
      }

      if (atBottom) {
        scrollToBottom();
        setHasNewMessageBelow(false);
      } else {
        setHasNewMessageBelow(true);
      }
        // banner is computed by IntersectionObserver (see effect below)
    }, [messages, hasMounted]);

    useEffect(() => {
      if (!highlightedMessageId || !messageRefs.current[highlightedMessageId]) return;

      const el = messageRefs.current[highlightedMessageId];
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      const timeout = setTimeout(() => {
        if (typeof onJumpToReply === "function") {
          onJumpToReply(null);
        }
      }, 5000);

      return () => clearTimeout(timeout);
    }, [highlightedMessageId, onJumpToReply, messageRefs]);

    // Cleanup floating date timer on unmount or when mode changes
    useEffect(() => {
      return () => {
        if (floatingDateTimerRef.current) {
          clearTimeout(floatingDateTimerRef.current);
        }
      };
    }, []);

    const handleOpenMenu = (event) => setAnchorEl(event.currentTarget);
    const handleCloseMenu = () => setAnchorEl(null);

    useEffect(() => {
      const container = document.getElementById("chat-container");
      if (!container) return;

      container.style.overflow = anchorEl ? "hidden" : "auto";

      return () => {
        if (container) container.style.overflow = "auto";
      };
    }, [anchorEl]);

    // Debug: log processedMessages and count day dividers to help verify grouping rendering
    useEffect(() => {
      try {
        if (!Array.isArray(messages)) return;
        const dividers = messages.filter(m => m && m.__dayDivider).length;
  setDebugDayDividers(dividers);
  if (DEBUG) console.debug("📚 [ChatPanel] messages count:", messages.length, "dayDividers:", dividers);
      } catch (e) {
        /* ignore */
      }
    }, [messages]);

    // computeBannerLabel kept as a noop: banner computation is handled via
    // an IntersectionObserver (see effect below). The original boundingClientRect
    // logic is replaced to improve robustness for long conversations.
    const computeBannerLabel = () => {};

    const handleChangeStatus = (newStatus) => {
      onStatusChange(newStatus);

      if (newStatus === "pendiente") {
        setShowPendingEditor(true);
        setPendingTag({ title: "", description: "" });
      } else {
        setShowPendingEditor(false);
        setPendingTag(null);
      }

      handleCloseMenu();
    };

    const handleToggleBlock = () => {
      onBlock();
      handleCloseMenu();
    };

    const handleSendMessage = async () => {
      console.log("📝 Mensaje enviado:", inputValue);
      console.log("📎 Respondiendo a:", replyTo);

      if (inputValue.trim()) {
        const messageId = crypto.randomUUID();

        const replyInfo = replyTo
          ? {
            replyToMessageId: replyTo.id,
            replyToText: replyTo.text || replyTo.fileName || "mensaje",
          }
          : null;

        try {
          // 1. Pausar IA en backend
          await updateConversationIsWithAI(conversationId, false); // 👈 función que debes implementar

          // 2. Enviar mensaje
          onSendAdminMessage(
            inputValue.trim(),
            conversationId,
            messageId,
            replyTo ? replyTo.id : null,
            replyTo ? replyTo.text || replyTo.fileName || "mensaje" : null
          );

          setInputValue("");
          if (onCancelReply) onCancelReply();

          setTimeout(() => {
            scrollToBottom();
          }, 50);
        } catch (error) {
          console.error("❌ Error al pausar IA:", error);
        }
      }
    };

    const typingTimeout = useRef(null);
    const typingActiveRef = useRef(false); // To track if typing is currently active

    const handleInputChange = (text) => {
      setInputValue(text);

      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }

      if (text.trim()) {
        // If not already typing, send typing start
        if (!typingActiveRef.current) {
          onAdminTyping(conversationId);
          typingActiveRef.current = true;
        }
        // Set a timeout to send stop typing if no more input
        typingTimeout.current = setTimeout(() => {
          onAdminStopTyping(conversationId); // New prop to send stop typing
          typingActiveRef.current = false;
        }, 1000); // Send stop typing after 1 second of inactivity
      } else {
        // If input is empty and typing was active, send stop typing immediately
        if (typingActiveRef.current) {
          onAdminStopTyping(conversationId);
          typingActiveRef.current = false;
        }
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case "resuelta":
          return <DoneAllIcon />;
        case "activo":
        default:
          return <CheckIcon />;
      }
    };

    const getBackgroundColor = (status) => {
      switch (status?.toLowerCase()) {
        case "pendiente":
          return "rgb(252, 166, 55)"; // naranja
        case "resuelta":
          return "rgb(70, 181, 94)"; // verde
        default:
          return "rgb(100, 100, 100)"; // gris
      }
    };

    const getBlockedIcon = () => <BlockIcon />;
    const processedMessages = useMemo(() => {
      // 🔍 DEBUG: Log mensajes recibidos en ChatPanel
      console.log(`🎯 [ChatPanel] Procesando ${messages.length} mensajes para conversación ${conversationId}`);
      
      // ✅ Deduplicación inteligente para evitar imágenes duplicadas
      const msgMap = new Map();
      const duplicateTracker = new Map(); // Para trackear duplicados por contenido
      
      messages.forEach((msg, idx) => {
        if (!msg) return;
        
        const messageId = String(msg.id || msg.tempId || `temp-${idx}`);
        const hasFiles = (Array.isArray(msg.files) && msg.files.length > 0) || 
                         (Array.isArray(msg.images) && msg.images.length > 0) ||
                         (!!(msg.file?.fileUrl || msg.fileUrl));
        
        // 🔍 DEBUG: Log mensajes con archivos
        if (hasFiles) {
          console.log(`📎 [ChatPanel] Mensaje ${messageId} tiene archivos:`, {
            files: msg.files?.length || 0,
            images: msg.images?.length || 0,
            file: !!msg.file,
            fileUrl: !!msg.fileUrl
          });
        }
        
        // 🚫 FIX: Detectar si este mensaje con archivos ya está representado en el mapa
        // Caso especial: SignalR envía 1 evento con files:[{img1},{img2}] pero el historial
        // devuelve 2 mensajes separados cada uno con 1 archivo. Deduplicar por fileUrl.
        if (hasFiles) {
          // Extraer fileUrls de este mensaje
          const currentFileUrls = new Set();
          if (Array.isArray(msg.files)) msg.files.forEach(f => { if (f.fileUrl || f.url) currentFileUrls.add(f.fileUrl || f.url); });
          if (Array.isArray(msg.images)) msg.images.forEach(f => { if (f.fileUrl || f.url) currentFileUrls.add(f.fileUrl || f.url); });
          if (msg.fileUrl) currentFileUrls.add(msg.fileUrl);
          if (msg.file?.fileUrl) currentFileUrls.add(msg.file.fileUrl);
          
          if (currentFileUrls.size > 0) {
            // Buscar si algún mensaje existente ya contiene estos fileUrls
            let isDuplicate = false;
            for (const [existingId, existingMsg] of msgMap.entries()) {
              const existingFileUrls = new Set();
              if (Array.isArray(existingMsg.files)) existingMsg.files.forEach(f => { if (f.fileUrl || f.url) existingFileUrls.add(f.fileUrl || f.url); });
              if (Array.isArray(existingMsg.images)) existingMsg.images.forEach(f => { if (f.fileUrl || f.url) existingFileUrls.add(f.fileUrl || f.url); });
              if (existingMsg.fileUrl) existingFileUrls.add(existingMsg.fileUrl);
              if (existingMsg.file?.fileUrl) existingFileUrls.add(existingMsg.file.fileUrl);
              
              // Si hay intersección de fileUrls, es un duplicado
              for (const url of currentFileUrls) {
                if (existingFileUrls.has(url)) {
                  isDuplicate = true;
                  // Preferir el mensaje con ID numérico (viene de DB) sobre el temporal/SignalR
                  const currentIdIsNumeric = /^\d+$/.test(messageId);
                  const existingIdIsNumeric = /^\d+$/.test(existingId);
                  if (currentIdIsNumeric && !existingIdIsNumeric) {
                    // Reemplazar el mensaje SignalR con el del historial (tiene ID real)
                    msgMap.delete(existingId);
                    msgMap.set(messageId, msg);
                  }
                  break;
                }
              }
              if (isDuplicate) break;
            }
            if (isDuplicate) return;
          }
        }
        
        // ✅ Agregar mensaje nuevo
        msgMap.set(messageId, msg);
      });
      
      // 📊 LOG: Resumen de deduplicación 
      console.log(`🎯 [ChatPanel] Deduplicación completada:`, {
        original: messages.length,
        deduplicados: msgMap.size,
        eliminados: messages.length - msgMap.size,
        conArchivos: Array.from(msgMap.values()).filter(m => 
          (m.files?.length > 0) || (m.images?.length > 0) || m.file?.fileUrl || m.fileUrl
        ).length
      });
      
      // Normalizar timestamps ANTES de ordenar (soporta todas las variantes del backend)
      const messagesWithNormalizedTimestamps = Array.from(msgMap.values()).map((msg, idx) => {
        const originalTimestamp = msg.timestamp || msg.Timestamp || msg.createdAt || msg.CreatedAt;
        let normalized = originalTimestamp || new Date(0).toISOString();
        
        // 🔧 FIX: Agregar "Z" si el timestamp es ISO pero no tiene timezone
        if (typeof normalized === 'string' && normalized.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
          if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('-', 10)) {
            normalized = normalized + 'Z';
          }
        }
        
        // 🔍 DEBUG: Log primeros 5 mensajes con timestamps RAW
        if (idx < 5 && (DEBUG || (typeof window !== 'undefined' && window.__VOIA_DEBUG_SORT === true))) {
          console.log(`🔍 [ChatPanel] Mensaje ${idx} timestamps RAW:`, {
            id: msg.id,
            text: (msg.text || '').substring(0, 30),
            timestamp: msg.timestamp,
            Timestamp: msg.Timestamp,
            createdAt: msg.createdAt,
            CreatedAt: msg.CreatedAt,
            normalized,
            fromRole: msg.fromRole
          });
        }
        
        return {
          ...msg,
          timestamp: normalized
        };
      });
      
      // Ordenar ascendente por fecha normalizada (más antiguo arriba, más reciente abajo - flujo cronológico)
      const allMessages = messagesWithNormalizedTimestamps.sort((a, b) => {
        const ta = new Date(a.timestamp).getTime();
        const tb = new Date(b.timestamp).getTime();
        return ta - tb;
      });
      
      // Debug: mostrar orden de mensajes para diagnóstico
      if (DEBUG || (typeof window !== 'undefined' && window.__VOIA_DEBUG_SORT === true)) {
        console.debug("📋 [ChatPanel] Orden cronológico de mensajes:", 
          allMessages.slice(0, 10).map((m, idx) => `${idx + 1}. [${m.fromRole || 'unknown'}] ${(m.text || '').substring(0, 30)}... (${m.timestamp})`).join("\n")
        );
      }
      // Normalize messages (same as antes) then insert day dividers.
      const normalized = allMessages.map((msg) => {
        // If the backend/client already inserted a day-divider object, pass it through unchanged.
        if (msg && msg.__dayDivider) return msg;
        let normalizedText = msg.text || msg.question || msg.content || "";
        
        // ✅ FIX: Limpiar texto placeholder de archivos ("📎 archivo.jpg") cuando el mensaje tiene archivos
        // El backend guarda MessageText="📎 filename" en SendGroupedImages/SendFile pero no debe mostrarse
        const hasAnyFiles = (Array.isArray(msg.files) && msg.files.length > 0) || 
                           (Array.isArray(msg.images) && msg.images.length > 0) || 
                           msg.fileUrl || msg.file?.fileUrl;
        if (hasAnyFiles && normalizedText) {
          // Si el texto es solo un placeholder de archivo, limpiarlo
          const isFilePlaceholder = /^📎\s/.test(normalizedText) || 
                                   /^Se enviaron múltiples imágenes/.test(normalizedText) ||
                                   normalizedText === "Imagen o Archivo";
          if (isFilePlaceholder) {
            normalizedText = "";
          }
        }

        // Prioritize msg.files if it exists (for real-time messages)
        let files = Array.isArray(msg.files) ? [...msg.files] : [];

        // Fallback for history/legacy messages if msg.files is not present
        if (files.length === 0) {
          if (msg.file?.fileUrl) {
            files.push({ ...msg.file, url: msg.file.fileUrl });
          }
          if (Array.isArray(msg.images)) {
            msg.images.forEach((img) => {
              if (img.fileUrl) files.push({ ...img, url: img.fileUrl });
            });
          }
          if (msg.fileUrl && msg.fileName) {
            files.push({
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              fileType: msg.fileType || "application/octet-stream",
              url: msg.fileUrl,
            });
          }
        }

        let resolvedReplyTo = null;
        if (msg.replyToMessageId) {
          const original = messages.find((m) => m.id?.toString() === msg.replyToMessageId?.toString());
          if (original) {
            const firstFile =
              (Array.isArray(original.files) && original.files.length > 0 ? original.files[0] : null) ||
              original.file ||
              (Array.isArray(original.images) && original.images.length > 0 ? original.images[0] : null);

            resolvedReplyTo = {
              id: original.id,
              text: original.text || (firstFile ? null : msg.replyToText),
              fromName: original.fromRole === "admin" ? "Admin" : `Sesión ${conversationId}`,
              fromRole: original.fromRole || original.from || "user",
              fileName: firstFile?.fileName,
              fileUrl: firstFile?.fileUrl || firstFile?.url,
              fileType: firstFile?.fileType,
            };
          }
        }

        // Detectar mensajes del usuario público por publicUserId
        const publicUserId = msg.publicUserId || msg.fromPublicUserId;
        let rawFrom = msg.fromRole ?? msg.from ?? "user";
        try { rawFrom = String(rawFrom); } catch (e) { rawFrom = "user"; }
        let normalizedFromRole = (rawFrom || "").toLowerCase();
        if (publicUserId) {
          normalizedFromRole = "user";
        } else if (normalizedFromRole !== "admin" && normalizedFromRole !== "bot" && normalizedFromRole !== "user") {
          normalizedFromRole = "user";
        }

        // ensure legacy 'url' fields are normalized to 'fileUrl' so MessageBubble can consume them
        const normalizedFiles = files.map((f) => ({
          ...f,
          fileUrl: f.fileUrl || f.url || f.filePath || f.path || f.FileUrl || f.urlPath,
          fileName: f.fileName || f.FileName || f.name,
          fileType: f.fileType || f.FileType || f.type || "application/octet-stream",
        }));

        // ✅ DEBUG: Log file messages to help diagnose visibility issues
        if (normalizedFiles.length > 0) {
          console.log(`📎 [ChatPanel RENDER] Mensaje ${msg.id} tiene ${normalizedFiles.length} archivo(s):`, 
            normalizedFiles.map(f => ({ fileName: f.fileName, fileType: f.fileType, fileUrl: f.fileUrl }))
          );
        }

        return {
          ...msg,
          fromName: publicUserId
            ? `Usuario público ${publicUserId}`
            : normalizedFromRole === "admin"
            ? "Admin"
            : normalizedFromRole === "bot"
            ? "VIA"
            : `Sesión ${conversationId}`,
          text: normalizedText,
          fromRole: normalizedFromRole,
          files: normalizedFiles.length > 0 ? normalizedFiles : undefined,
          replyTo: resolvedReplyTo ?? msg.replyTo ?? null,
        };
      });

      // Helper: format day label in Spanish
      const formatDayLabel = (date) => {
        if (!date) return "";
        const d = new Date(date);
        const now = new Date();
        const startOfDay = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return "Hoy";
        if (diffDays === 1) return "Ayer";

        // Determine week start (Monday) for locale-agnostic week grouping
        const getStartOfWeek = (dt) => {
          const copy = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
          // JS getDay(): 0=Sunday, 1=Monday,... We'll treat Monday as start of week
          const day = (copy.getDay() + 6) % 7; // 0 -> Monday
          copy.setDate(copy.getDate() - day);
          return copy;
        };

        const startOfThisWeek = getStartOfWeek(now);
        const startOfMsgWeek = getStartOfWeek(d);

        // If message is in the same week as today (but not today/yesterday), show weekday name
        if (d >= startOfThisWeek) {
          return d.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^[a-z]/, (m) => m.toUpperCase());
        }

        // If message is in the previous week, show short date (dd MMM)
        const prevWeekStart = new Date(startOfThisWeek);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        if (d >= prevWeekStart && d < startOfThisWeek) {
          // e.g. "20 oct"
          return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }

        // Older: include year if different from current year
        if (d.getFullYear() === now.getFullYear()) {
          return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        }
        return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      };

      // Build new array with day dividers inserted before the first message of each day.
      // If a message is already a __dayDivider (from server/client), preserve it.
      const out = [];
      let lastDayKey = null;
      normalized.forEach((m) => {
        if (m && m.__dayDivider) {
          // Use the divider's timestamp as the day's anchor if available
          const ts = m.timestamp || null;
          lastDayKey = ts ? new Date(ts).toDateString() : lastDayKey;
          out.push(m);
          return;
        }
        const ts = m.timestamp || m.Timestamp || null;
        const dayKey = ts ? new Date(ts).toDateString() : "";
        if (dayKey !== lastDayKey) {
          lastDayKey = dayKey;
          out.push({ __dayDivider: true, key: `day-${dayKey}-${Math.random().toString(36).slice(2,7)}`, label: formatDayLabel(ts) });
        }
        out.push(m);
      });

      return out;
    }, [messages, conversationId]);

    // Debug: summary of processedMessages (labels and ranges)
    // Guard so we don't spam the console during React.StrictMode double-mounts in dev.
    useEffect(() => {
      try {
        if (!Array.isArray(processedMessages)) return;
        // Only log once per conversationId (or when conversationId changes)
        if (lastLoggedForConvRef.current === conversationId) return;
        lastLoggedForConvRef.current = conversationId;

        const dividerLabels = processedMessages.filter(m => m && m.__dayDivider).map(d => d.label);
        const firstMsg = processedMessages.find(m => m && !m.__dayDivider);
        const lastMsg = [...processedMessages].reverse().find(m => m && !m.__dayDivider);
        if (DEBUG) console.debug('🧭 [ChatPanel] processedMessages summary', {
          total: processedMessages.length,
          dividers: dividerLabels.length,
          dividerLabels: dividerLabels.slice(0, 10),
          firstTs: firstMsg?.timestamp || firstMsg?.Timestamp,
          lastTs: lastMsg?.timestamp || lastMsg?.Timestamp,
        });
      } catch (e) { /* ignore */ }
    }, [processedMessages, conversationId]);


    // Al cambiar de conversación, asegurarnos de posicionar al final (comportamiento esperado al abrir)
    useEffect(() => {
      if (!hasMounted) return;
      // pequeño retardo para dejar que el DOM pinte imágenes/elementos
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        setIsUserAtBottom(true);
        // consider the initial auto-scroll as stabilization so observer may start
        // reacting to entries shortly after this (some delay to let DOM settle)
        setTimeout(() => { userScrolledRef.current = true; }, 120);
      }, 50);
    }, [conversationId, hasMounted]);

    // When switching conversations, briefly suppress inline dividers until
    // the banner computation stabilizes to avoid a flicker/duplicate.
    useEffect(() => {
      // enable suppression immediately when conversation changes
      setSuppressDividers(true);
      // mark that the user hasn't yet interacted with the scroll area for this convo
      userScrolledRef.current = false;
      setBannerLabel('');
      setTopVisibleDayLabel('');
      if (suppressTimeoutRef.current) clearTimeout(suppressTimeoutRef.current);
      // fallback: remove suppression after 500ms in case computeBannerLabel
      // doesn't run or is delayed.
      suppressTimeoutRef.current = setTimeout(() => {
        setSuppressDividers(false);
        suppressTimeoutRef.current = null;
      }, 500);

      return () => {
        if (suppressTimeoutRef.current) {
          clearTimeout(suppressTimeoutRef.current);
          suppressTimeoutRef.current = null;
        }
      };
    }, [conversationId]);

    // Cleanup any pending banner debounce on unmount
    useEffect(() => {
      return () => {
        if (bannerDebounceRef.current) {
          clearTimeout(bannerDebounceRef.current);
          bannerDebounceRef.current = null;
        }
      };
    }, []);

    // Use IntersectionObserver to detect which message is nearest the top of the
    // chat container. This is more reliable than manual boundingClientRect checks
    // for long lists and when the DOM changes asynchronously (images, lazy content).
    useEffect(() => {
      const container = document.getElementById('chat-container');
      if (!container) return;

      // Clean up any previous observer
      if (observerRef.current) {
        try { observerRef.current.disconnect(); } catch (e) { /* ignore */ }
        observerRef.current = null;
      }

      // Create the observer; root is the chat container so entry.boundingClientRect
      // is comparable to rootBounds.
      const obs = new IntersectionObserver((entries) => {
        try {
          // don't react to intersection events until the view has stabilized
          // (userScrolledRef becomes true after initial auto-scroll or user interaction)
          if (!userScrolledRef.current) return;
          const rootRect = (entries[0] && entries[0].rootBounds) || container.getBoundingClientRect();

          // Prefer day-divider entries when visible: they map directly to labels
          let candidate = null;
          let bestTop = Infinity;

          // Try day-dividers first
          for (const entry of entries) {
            if ((entry.intersectionRatio || 0) < 0.12) continue;
            if (dayDividerLabelMapRef.current && dayDividerLabelMapRef.current.has(entry.target)) {
              const rect = entry.boundingClientRect;
              const topRel = rect.top - rootRect.top;
              if (topRel >= -8 && topRel < bestTop) {
                bestTop = topRel;
                candidate = entry.target;
                break; // prefer the first suitable day-divider nearest top
              }
            }
          }

          // If no day-divider candidate, fallback to message entries
          if (!candidate) {
            for (const entry of entries) {
              if ((entry.intersectionRatio || 0) < 0.12) continue;
              if (dayDividerLabelMapRef.current && dayDividerLabelMapRef.current.has(entry.target)) continue; // already considered
              const rect = entry.boundingClientRect;
              const topRel = rect.top - rootRect.top;
              if (topRel >= -8 && topRel < bestTop) {
                bestTop = topRel;
                candidate = entry.target;
              }
            }
          }

          // if none matched the >= -8 rule, pick the smallest topRel among entries
          if (!candidate) {
            entries.forEach((entry) => {
              const rect = entry.boundingClientRect;
              const topRel = rect.top - rootRect.top;
              if (topRel < bestTop) {
                bestTop = topRel;
                candidate = entry.target;
              }
            });
          }

          // Resolve the label from the candidate element. If it's a day-divider
          // element we stored its label in dayDividerLabelMapRef; otherwise try
          // to map back to a message id via messageRefs.
          let label = '';
          if (candidate) {
            if (dayDividerLabelMapRef.current && dayDividerLabelMapRef.current.has(candidate)) {
              label = dayDividerLabelMapRef.current.get(candidate) || '';
            } else {
              const foundId = Object.keys(messageRefs.current || {}).find(k => messageRefs.current[k] === candidate || (messageRefs.current[k] && messageRefs.current[k].current === candidate));
              if (foundId) {
                const foundMsg = processedMessages.find(m => String(m.id) === String(foundId));
                const ts = foundMsg ? (foundMsg.timestamp || foundMsg.Timestamp || foundMsg.createdAt) : null;
                if (ts) label = formatDayLabel(ts);
              }
            }
          }

          // Use the same debounced/stable logic used previously to avoid flicker
          bannerPendingRef.current = label;
          if (bannerDebounceRef.current) clearTimeout(bannerDebounceRef.current);
          bannerDebounceRef.current = setTimeout(() => {
            const pending = bannerPendingRef.current;
            if (pending === lastVisibleLabelRef.current) {
              bannerStableCountRef.current += 1;
            } else {
              bannerStableCountRef.current = 1;
            }
            lastVisibleLabelRef.current = pending;

            if (pending) {
              if (bannerStableCountRef.current >= BANNER_SHOW_THRESHOLD) {
                if (bannerClearTimerRef.current) {
                  clearTimeout(bannerClearTimerRef.current);
                  bannerClearTimerRef.current = null;
                }
                setBannerLabel(pending);
                setTopVisibleDayLabel(pending);
                setSuppressDividers(false);
                bannerShownAtRef.current = Date.now();
              }
            } else {
              if (bannerStableCountRef.current >= BANNER_CLEAR_THRESHOLD) {
                const now = Date.now();
                const shownAt = bannerShownAtRef.current;
                const stillRecentlyShown = shownAt && (now - shownAt) < MIN_BANNER_VISIBLE_MS;
                if (!stillRecentlyShown) {
                  setBannerLabel('');
                  setTopVisibleDayLabel('');
                  setSuppressDividers(false);
                } else {
                  const remaining = MIN_BANNER_VISIBLE_MS - (now - shownAt) + 20;
                  if (bannerClearTimerRef.current) clearTimeout(bannerClearTimerRef.current);
                  bannerClearTimerRef.current = setTimeout(() => {
                    setBannerLabel('');
                    setTopVisibleDayLabel('');
                    setSuppressDividers(false);
                    bannerClearTimerRef.current = null;
                  }, Math.max(remaining, 20));
                }
              }
            }

            bannerDebounceRef.current = null;
          }, 120);
        } catch (e) {
          console.warn('IntersectionObserver callback failed', e);
        }
      }, {
        root: container,
        threshold: [0, 0.01, 0.25, 0.5, 0.75, 1]
      });

      // Observe day-divider elements first (prefer these as banner sources)
      processedMessages.forEach((m, idx) => {
        if (!m) return;
        if (m.__dayDivider) {
          const divId = m.id || m.key || `day-${idx}`;
          const el = dayDividerRefs.current && dayDividerRefs.current[divId];
          if (el && el instanceof Element) {
            try { obs.observe(el); } catch (e) { /* ignore */ }
          }
          return;
        }

        // Observe message elements (non-divider messages). Some refs may be components
        // or elements; try both patterns.
        const el = messageRefs.current && (messageRefs.current[m.id] || (messageRefs.current[m.id] && messageRefs.current[m.id].current));
        if (el && el instanceof Element) {
          try { obs.observe(el); } catch (e) { /* ignore */ }
        }
      });

      observerRef.current = obs;

      return () => {
        try { obs.disconnect(); } catch (e) { /* ignore */ }
        if (bannerDebounceRef.current) { clearTimeout(bannerDebounceRef.current); bannerDebounceRef.current = null; }
        if (bannerClearTimerRef.current) { clearTimeout(bannerClearTimerRef.current); bannerClearTimerRef.current = null; }
      };
    }, [processedMessages, conversationId]);

    useEffect(() => {
      const fetchTags = async () => {
        if (!conversationId) return;
        try {
          const tags = await getTagsByConversationId(conversationId);
          setConversationTags(tags || []);
        } catch (error) {
          console.error("❌ Error obteniendo las etiquetas:", error);
          setConversationTags([]);
        }
      };

      fetchTags();
    }, [conversationId]);

    useLayoutEffect(() => {
      const container = document.getElementById("chat-container");
      if (!container || !bottomRef.current) return;

      const images = container.querySelectorAll("img");
      let loaded = 0;

      const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        setIsUserAtBottom(true);
      };

      const handleImageLoad = () => {
        loaded++;
        if (loaded === images.length) {
          scrollToBottom();
        }
      };

      if (images.length === 0) {
        scrollToBottom();
        return;
      }

      images.forEach((img) => {
        if (img.complete) {
          loaded++;
        } else {
          img.addEventListener("load", handleImageLoad);
          img.addEventListener("error", handleImageLoad);
        }
      });

      if (loaded === images.length) {
        scrollToBottom();
      }

      return () => {
        images.forEach((img) => {
          img.removeEventListener("load", handleImageLoad);
          img.removeEventListener("error", handleImageLoad);
        });
      };
    }, [conversationId, messages.length]);

    useLayoutEffect(() => {
      const container = document.getElementById("chat-container");
      if (!container || !bottomRef.current) return;

      const observer = new ResizeObserver(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
        setIsUserAtBottom(true);
      });

      observer.observe(container);

      return () => {
        observer.disconnect();
      };
    }, [conversationId]);

    


    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, position: "relative" }}>
        {/* HEADER */}
        <Box
          sx={{
            position: "relative",
            px: 2,
            pb: 2,
            borderBottom: "1px solid #eee",
            bgcolor: "white",
            zIndex: 1,
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" height={25}>
            <SoftTypography
              variant="caption"
              fontWeight="medium"
              noWrap
              sx={{
                maxWidth: "60%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontSize: "1rem",
              }}
            >
              Chat con {userName}
            </SoftTypography>

            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
              {conversationTags.length > 0
                ? conversationTags.map((tag, index) => (
                  <TagChip
                    key={index}
                    tag={tag}
                    index={index}
                    isExpanded={expandedTagIndex === index}
                    onToggle={() =>
                      setExpandedTagIndex((prev) => (prev === index ? null : index))
                    }
                    backgroundColor={getBackgroundColor(status)}
                    onDelete={async (tagToDelete) => {
                      try {
                        await deleteConversationTag(tagToDelete.id);
                        const updatedTags = await getTagsByConversationId(conversationId);
                        setConversationTags(updatedTags || []);
                        setExpandedTagIndex(null);
                      } catch (error) {
                        console.error('Error eliminando etiqueta:', error);
                      }
                    }}
                  />
                ))
                : null}
              {blocked && (
                <Tooltip title="Usuario bloqueado">
                  <Chip
                    icon={getBlockedIcon()}
                    color="error"
                    size="small"
                    sx={{
                      height: 32,
                      width: 32,
                      borderRadius: "50%",
                      padding: 0,
                      minWidth: 0,
                      backgroundColor: "#ef9a9a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      "& .MuiChip-icon": {
                        color: "#fff !important",
                        fontSize: "10px !important",
                        margin: 0,
                        padding: 0,
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      },
                      "& .MuiChip-label": {
                        display: "none",
                      },
                    }}
                  />
                </Tooltip>
              )}

              <IconButton size="small" onClick={handleOpenMenu}>
                <MoreVertIcon fontSize="small" />
              </IconButton>

              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                <MenuItem disabled>Estado actual: {status}</MenuItem>

                <Tooltip
                  title={
                    isTagLimitReached
                      ? "Límite de 6 etiquetas alcanzado"
                      : "Añadir etiqueta de Pendiente"
                  }
                >
                  <span>
                    <MenuItem
                      onClick={() => handleChangeStatus("pendiente")}
                      disabled={isTagLimitReached}
                    >
                      Añadir etiqueta de Pendiente
                    </MenuItem>
                  </span>
                </Tooltip>

                <MenuItem
                  onClick={() => handleChangeStatus("resuelta")}
                  disabled={status?.toLowerCase() === "resuelta"}
                >
                  Marcar como Resuelta
                </MenuItem>

                <Divider />
                <MenuItem onClick={handleToggleBlock}>
                  {blocked ? "Desbloquear Usuario" : "Bloquear Usuario"}
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>

        {/* PANEL DE TAGS */}
        {showPendingEditor && (
          <Box
            sx={{
              position: "absolute",
              top: 92,
              right: 20,
              width: 300,
              zIndex: 10,
              p: 2,
              backgroundColor: "#ffffff",
              borderRadius: 2,
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "#0bbbb8",
                mb: 0.5,
                fontWeight: "bold",
                textTransform: "uppercase",
                fontSize: "12px",
              }}
            >
              Crear Etiqueta
            </Typography>

            <TextField
              placeholder="Nombre de la etiqueta"
              size="small"
              fullWidth
              value={pendingTag?.label || ""}
              inputProps={{ maxLength: 100 }}
              onChange={(e) => setPendingTag((prev) => ({ ...prev, label: e.target.value }))}
              InputProps={{
                sx: {
                  width: "100% !important",
                  fontSize: "12px",
                  color: "#333",
                  px: 1,
                },
              }}
              sx={{
                mb: 1,
                backgroundColor: "#fafafa",
                borderRadius: 1,
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#ccc" },
                  "&:hover fieldset": { borderColor: "#aaa" },
                },
                "& input::placeholder": {
                  color: "#999",
                },
              }}
            />

            <Box display="flex" justifyContent="flex-end" gap={1}>
              <IconButton
                size="small"
                color="error"
                onClick={() => {
                  setShowPendingEditor(false);
                  setPendingTag(null);
                }}
                sx={{ fontSize: "16px", p: "2px" }}
              >
                ❌
              </IconButton>
              <IconButton
                size="small"
                color="success"
                onClick={async () => {
                  if (!pendingTag.label?.trim()) return;
                  try {
                    await createConversationTag({
                      conversationId,
                      label: pendingTag.label.trim(),
                      highlightedMessageId: null,
                    });
                    const updatedTags = await getTagsByConversationId(conversationId);
                    setConversationTags(updatedTags || []);
                    setShowPendingEditor(false);
                    setPendingTag(null);
                  } catch (error) {
                    console.error("❌ Error guardando etiqueta:", error);
                  }
                }}
                sx={{ fontSize: "16px", p: "2px" }}
              >
                ✔️
              </IconButton>
            </Box>
          </Box>
        )}

        {/* MENSAJES */}
        {/* banner is rendered inside the chat container as a floating pill (see below) */}

        <div
          id="chat-container"
          onScroll={(e) => {
            const el = e.target;
            setIsUserAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 150);
            // mark that the user has interacted / scrolled
            userScrolledRef.current = true;
            // Si estamos cerca del top, solicitar más mensajes antiguos
            // NOTE: umbral aumentado temporalmente a 300 para asegurar el disparo en layouts con padding
            if (el.scrollTop < 300 && typeof onLoadMoreOlderMessages === "function" && !loadingOlder) {
              (async () => {
                try {
                  setLoadingOlder(true);
                  const oldScrollHeight = el.scrollHeight;
                  const added = await onLoadMoreOlderMessages(conversationId);
                  // si añadimos mensajes, ajustamos scroll para mantener la vista en la misma posición
                  if (added && added > 0) {
                    // dejar un pequeño delay para que el DOM se actualice (imágenes, etc.)
                    setTimeout(() => {
                      const newScrollHeight = el.scrollHeight;
                      el.scrollTop = newScrollHeight - oldScrollHeight + el.scrollTop;
                    }, 50);
                  }
                } catch (e) {
                  console.error('Error cargando mensajes antiguos', e);
                } finally {
                  setLoadingOlder(false);
                }
              })();
            }
            // Banner label is updated by IntersectionObserver; no-op here.
          }}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            backgroundColor: "#f9f9f9",
            position: "relative",
          }}
        >
          {/* Floating banner removed: dates are now shown inline before first message of each day (WhatsApp-style) */}
          {/* Indicador cuando se están cargando páginas antiguas */}
          {loadingOlder && (
            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 1 }}>
              <Loader message="Cargando mensajes antiguos..." size="small" />
            </Box>
          )}

          {loadingConversationId === `${conversationId}` ? (
            <>
              <div style={{ marginBottom: 10, color: "#888" }}></div>
              <Loader message="Cargando..." />
            </>
          ) : (
            processedMessages.map((msg, idx) => {
                // Skip day dividers entirely; instead, render date labels inline before first message of each day
                if (msg.__dayDivider) {
                  return null; // Skip rendering __dayDivider objects; use inline labels instead
                }

              try { if (DEBUG) console.debug(`� [ChatPanel][render] message idx=${idx} id=${msg.id} ts=${msg.timestamp || msg.Timestamp || msg.createdAt} fromRole=${msg.fromRole}`); } catch (e) { /* ignore */ }
              
              // Determine if this message is the first of its day. If so, show date label (WhatsApp-style)
              const msgDate = msg.timestamp || msg.Timestamp || msg.createdAt;
              const msgDayKey = msgDate ? new Date(msgDate).toDateString() : '';
              const prevMsg = idx > 0 ? processedMessages[idx - 1] : null;
              const prevDate = prevMsg && !prevMsg.__dayDivider ? (prevMsg.timestamp || prevMsg.Timestamp || prevMsg.createdAt) : null;
              const prevDayKey = prevDate ? new Date(prevDate).toDateString() : '';
              const isFirstOfDay = msgDayKey && (msgDayKey !== prevDayKey);
              
              // Format day label for this message (Hoy, Ayer, etc.)
              const formatDayLabelForMsg = (date) => {
                if (!date) return "";
                const d = new Date(date);
                const now = new Date();
                const startOfDay = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
                const diffDays = Math.floor((startOfDay(now) - startOfDay(d)) / (1000 * 60 * 60 * 24));
                if (diffDays === 0) return "Hoy";
                if (diffDays === 1) return "Ayer";

                const getStartOfWeek = (dt) => {
                  const copy = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
                  const day = (copy.getDay() + 6) % 7;
                  copy.setDate(copy.getDate() - day);
                  return copy;
                };

                const startOfThisWeek = getStartOfWeek(now);
                if (d >= startOfThisWeek) {
                  return d.toLocaleDateString('es-ES', { weekday: 'long' }).replace(/^[a-z]/, (m) => m.toUpperCase());
                }

                const prevWeekStart = new Date(startOfThisWeek);
                prevWeekStart.setDate(prevWeekStart.getDate() - 7);
                if (d >= prevWeekStart && d < startOfThisWeek) {
                  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                }

                if (d.getFullYear() === now.getFullYear()) {
                  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                }
                return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
              };
              
              return (
                <React.Fragment key={msg.id || idx}>
                  {isFirstOfDay && DATE_MODE === 'inline-small' && (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2, mb: 1.5 }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 2, py: '6px', bgcolor: 'transparent', color: '#999', fontSize: '12px', fontWeight: '400' }}>
                        <Box component="span">{formatDayLabelForMsg(msgDate)}</Box>
                      </Box>
                    </Box>
                  )}
                  {msg.__unreadStart && (
                    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', my: 1 }}>
                      <Box sx={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ position: 'absolute', left: 0, right: 0, height: '1px', backgroundColor: '#ffd082', top: '50%', transform: 'translateY(-50%)' }} />
                        <Box sx={{ position: 'relative', px: 2, bgcolor: '#fff8e1', zIndex: 1, color: '#7a4a00', fontSize: '12px', fontWeight: '600', borderRadius: 1 }}>
                          Mensajes no leídos
                        </Box>
                      </Box>
                    </Box>
                  )}
                  <MessageBubble
                    msg={msg}
                    onReply={() => onReply(msg)}
                    onJumpToReply={onJumpToReply}
                    ref={(el) => {
                      if (el && msg.id) messageRefs.current[msg.id] = el;
                    }}
                    isHighlighted={highlightedMessageId === msg.id}
                    isAIActive={!iaPaused}
                  />
                </React.Fragment>
              );
            })
          )}

          {isTyping && typingSender && typingConversationId == conversationId && (
            <CSSTransition
              in
              appear
              timeout={300}
              classNames="fade"
              nodeRef={typingRef}
              unmountOnExit
            >
              <div ref={typingRef}>
                <TypingIndicator sender={typingSender} />
              </div>
            </CSSTransition>
          )}


          <div ref={bottomRef} />

          {hasMounted && hasNewMessageBelow && (
            <Box
              onClick={() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                setHasNewMessageBelow(false);
              }}
              sx={{
                position: "fixed",
                bottom: 130,
                right: 60,
                backgroundColor: "#00bcd4",
                color: "white !important",
                px: 2,
                py: 1,
                borderRadius: "16px",
                cursor: "pointer",
                boxShadow: 3,
                fontSize: "0.8rem",
                zIndex: 1300,
              }}
            >
              ⬇ Nuevo mensaje
            </Box>
          )}
        </div>

        {/* INPUT */}
        <Box sx={{ pt: 1, pb: 2, borderTop: "1px solid #eee", bgcolor: "white", zIndex: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Controls onToggle={onToggleIA} iaPaused={iaPaused} />
            {iaPaused && (
              <Box flex={1}>
                <InputChat
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}   // 👈 ya no necesitas (e) => ... porque la función espera directamente el texto
                  onSend={handleSendMessage}
                  replyTo={replyTo}
                  onCancelReply={onCancelReply}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    ); // 👈 este cierra el return y el componente
  } // 👈 este cierra la definición de la función ChatPanel si la tienes como function
);
// 👇 Esto SIEMPRE va FUERA del componente
ChatPanel.propTypes = {
  conversationId: PropTypes.number.isRequired,
  messages: PropTypes.array.isRequired,
  userName: PropTypes.string.isRequired,
  isTyping: PropTypes.bool.isRequired,
  typingSender: PropTypes.string,
  onToggleIA: PropTypes.func.isRequired,
  iaPaused: PropTypes.bool.isRequired,
  onSendAdminMessage: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
  status: PropTypes.string.isRequired,
  blocked: PropTypes.bool.isRequired,
  replyTo: PropTypes.object,
  onReply: PropTypes.func,
  onCancelReply: PropTypes.func,
  messageRefs: PropTypes.object,
  onJumpToReply: PropTypes.func,
  highlightedMessageId: PropTypes.string,
  onAdminTyping: PropTypes.func.isRequired,
  onAdminStopTyping: PropTypes.func, // ✅ agregado
    typingConversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ✅ agregar
  onLoadMoreOlderMessages: PropTypes.func, // (conversationId) => Promise<number>
};

// Wrap with React.memo to avoid re-renders when props are referentially stable.
export default React.memo(ChatPanel);