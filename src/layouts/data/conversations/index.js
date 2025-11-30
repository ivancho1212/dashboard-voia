import TrashView from './TrashView';
import Button from '@mui/material/Button';
import { useEffect, useState, useRef } from "react";
import PropTypes from 'prop-types';

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import { createHubConnection } from "services/signalr";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftBox from "components/SoftBox";
import ConversationList from "./ConversationList";
import ChatPanel from "./ChatPanel";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import SoftTypography from "components/SoftTypography";
import Tooltip from "@mui/material/Tooltip";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { getFilesByConversation } from "services/chatUploadedFilesService";
// ✅ NUEVO: Protección contra inyección de prompts
import { detectPromptInjection } from "services/promptInjectionService";
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from '@mui/material/styles';

import {
  getConversationsByUser,
  getMessagesByConversationId,
  getConversationHistory,
  getMessagesPaginated,
  getMessagesGrouped,
  updateConversationStatus,
  markMessagesAsRead,
  updateConversationIsWithAI,
  getConversationsWithLastMessage,
} from "services/conversationsService";
import { useAuth } from "contexts/AuthContext";

function Conversations() {
  // Mostrar papelera y actualizar lista tras eliminar
  const handleShowTrash = async () => {
    // Solo permitir ver la papelera si el usuario es el admin (id === '1')
    if (userId !== '1') return;
    setShowTrash(true);
    await fetchTrash();
  };

  // Cuando se elimina una conversación, actualizar la lista principal
  const handleMovedToTrash = (conversationId) => {
    setConversationList((prev) => prev.filter((c) => c.id !== conversationId));
    // Opcional: recargar papelera si está abierta
    if (showTrash) fetchTrash();
  };
  // Estado para mostrar papelera
  const [showTrash, setShowTrash] = useState(false);
  const [trashConversations, setTrashConversations] = useState([]);

  // Función para cargar conversaciones en papelera (simulado, reemplaza por tu API real)
  const fetchTrash = async () => {
    const all = await getConversationsWithLastMessage();
    setTrashConversations(all.filter(c => c.status === 'trash'));
  };

  // Función para vaciar papelera (solo userId 1)
  const handleEmptyTrash = async () => {
    if (userId !== '1') return;
    setTrashConversations([]);
    // TODO: Llama a tu endpoint real para vaciar la papelera
  };
  const tabContainerRef = useRef(null);
  const tabRefs = useRef({});
  const messageRefs = useRef({});
  const chatPanelRef = useRef(null);
  const connectionRef = useRef(null);
  const isDraggingRef = useRef(false);
  const messageCache = useRef(new Map());
  const messageCursor = useRef(new Map()); // stores { hasMore, nextBefore } per conversationId
  // Tracks how many messages (tail) are currently visible per conversation.
  const visibleCounts = useRef(new Map());
  const DEFAULT_VISIBLE_ON_OPEN = 30; // show recent 30 messages by default (WhatsApp-like)
  const typingStopTimeout = useRef(null);

  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [conversationList, setConversationList] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [messages, setMessages] = useState({});
  const [iaPausedMap, setIaPausedMap] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [typingState, setTypingState] = useState({});
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const iaPausedMapRef = useRef({});

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [loadingConversationId, setLoadingConversationId] = useState(null);

  const { user } = useAuth();
  const userId = user?.id;
  const theme = useTheme();

  // TabsBar implemented with dnd-kit (sortable)
  function SortableTab({ tab, activeTab, setActiveTab, setOpenTabs, tabRefs, isDraggingRef }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: String(tab.id) });
    const baseBg = activeTab === tab.id ? theme.palette.info.main : theme.palette.info.light;
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      display: 'flex',
      alignItems: 'center',
      minHeight: 40,
      padding: '0 12px',
      marginRight: 8,
      marginTop: 8,
      cursor: isDragging ? 'grabbing' : 'grab',
      flexShrink: 0,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      backgroundColor: baseBg,
      boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.18)' : (activeTab === tab.id ? '0px 8px 16px rgba(0, 0, 0, 0.12)' : 'none'),
      zIndex: isDragging ? 9999 : (activeTab === tab.id ? 3 : 1),
      color: theme.palette.common.white,
      fontWeight: activeTab === tab.id ? 'bold' : 'normal',
      transition: 'box-shadow 120ms ease, transform 120ms ease',
    };

    return (
      <div
        ref={(el) => { setNodeRef(el); tabRefs.current[tab.id] = el; }}
        {...attributes}
        {...listeners}
        onClick={() => { if (isDraggingRef.current) return; setActiveTab(tab.id); }}
        style={style}
        role="button"
        aria-pressed={activeTab === tab.id}
      >
        <Tooltip title={tab.alias || `Usuario ${String(tab.id).slice(-4)}`} arrow>
          <Box display="flex" alignItems="center" sx={{ maxWidth: { xs: 140, sm: 160, md: 180, lg: 200 }, flexShrink: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <Box component="span" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', fontSize: '0.80rem' }}>
              {tab.alias || `Usuario ${String(tab.id).slice(-4)}`}
            </Box>
            <IconButton size="small" onClick={(e) => {
              e.stopPropagation();
              if (isDraggingRef.current) return;
              setOpenTabs((prev) => { const updated = prev.filter((t) => t.id !== tab.id); if (activeTab === tab.id) { setActiveTab(updated[0]?.id || null); } return updated; });
            }} sx={{ ml: 1, padding: '1px', color: '#fff', fontSize: '0.90rem' }}><CloseIcon fontSize="inherit" /></IconButton>
          </Box>
        </Tooltip>
      </div>
    );
  }

  // PropTypes for SortableTab (fixes ESLint react/prop-types warnings)
  SortableTab.propTypes = {
    tab: PropTypes.object.isRequired,
    activeTab: PropTypes.string,
    setActiveTab: PropTypes.func.isRequired,
    setOpenTabs: PropTypes.func.isRequired,
    tabRefs: PropTypes.object.isRequired,
    isDraggingRef: PropTypes.object.isRequired,
  };

  function TabsBar({ openTabs, activeTab, setActiveTab, setOpenTabs, tabContainerRef, tabRefs, showScrollButtons, isDraggingRef }) {
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
    const [activeId, setActiveId] = useState(null);

    const localMouseMoveHandler = (e) => {
      try {
        const el = tabContainerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const margin = 80;
        const step = 30;
        if (e.clientX < rect.left + margin) el.scrollLeft = Math.max(0, el.scrollLeft - step);
        else if (e.clientX > rect.right - margin) el.scrollLeft = Math.min(el.scrollWidth, el.scrollLeft + step);
      } catch (err) { /* ignore */ }
    };

    useEffect(() => {
      return () => { try { document.removeEventListener('mousemove', localMouseMoveHandler); } catch (e) {} };
    }, []);

    return (
      <DndContext
        sensors={sensors}
        onDragStart={(event) => { isDraggingRef.current = true; setActiveId(event.active.id); document.addEventListener('mousemove', localMouseMoveHandler); }}
        onDragEnd={(event) => {
          isDraggingRef.current = false;
          document.removeEventListener('mousemove', localMouseMoveHandler);
          const { active, over } = event;
          if (!over) { setActiveId(null); return; }
          const oldIndex = openTabs.findIndex(t => String(t.id) === String(active.id));
          const newIndex = openTabs.findIndex(t => String(t.id) === String(over.id));
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reordered = arrayMove(openTabs, oldIndex, newIndex);
            setOpenTabs(reordered);
          }
          setActiveId(null);
        }}
        onDragCancel={() => { isDraggingRef.current = false; setActiveId(null); document.removeEventListener('mousemove', localMouseMoveHandler); }}
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 8 }}>
          {showScrollButtons && <IconButton onClick={() => { const el = tabContainerRef.current; if (el) el.scrollLeft -= 150; }} sx={{ position: 'absolute', left: 0, zIndex: 2, backgroundColor: '#fff' }}><ChevronLeftIcon /></IconButton>}
          <div id="scrollable-tab-container" ref={(el) => { tabContainerRef.current = el; }} style={{ overflowX: 'auto', display: 'flex', alignItems: 'flex-end', scrollBehavior: 'smooth', paddingLeft: showScrollButtons ? 20 : 8, paddingRight: showScrollButtons ? 20 : 8, width: '100%' }}>
            <SortableContext items={openTabs.map(t => String(t.id))} strategy={horizontalListSortingStrategy}>
              {openTabs.map((tab, index) => (
                <SortableTab
                  key={tab.id}
                  tab={tab}
                  index={index}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  setOpenTabs={setOpenTabs}
                  tabRefs={tabRefs}
                  isDraggingRef={isDraggingRef}
                />
              ))}
            </SortableContext>
          </div>
          {showScrollButtons && <IconButton onClick={() => { const el = tabContainerRef.current; if (el) el.scrollLeft += 150; }} sx={{ position: 'absolute', right: 0, zIndex: 2, backgroundColor: '#fff' }}><ChevronRightIcon /></IconButton>}
        </div>
        <DragOverlay>{/* optional drag preview */}</DragOverlay>
      </DndContext>
    );
  }

  TabsBar.propTypes = {
    openTabs: PropTypes.array.isRequired,
    activeTab: PropTypes.string,
    setActiveTab: PropTypes.func.isRequired,
    setOpenTabs: PropTypes.func.isRequired,
    tabContainerRef: PropTypes.object.isRequired,
    tabRefs: PropTypes.object.isRequired,
    showScrollButtons: PropTypes.bool,
    isDraggingRef: PropTypes.object.isRequired,
  };

  // NOTE: removed an always-updating ticker state that forced a re-render every
  // second. That was generating continuous ChatPanel render logs during dev.
  // If you need a periodic timer later, prefer a ref-based timer or scope it
  // to the component that actually needs updates (avoid app-level state here).

  const handleToggleIA = async (conversationId) => {
    const newState = !iaPausedMap[conversationId];
    setIaPausedMap((prev) => ({ ...prev, [conversationId]: newState }));
    await updateConversationIsWithAI(conversationId, !newState);
    setConversationList((prev) =>
      prev.map((conv) => (conv.id === conversationId ? { ...conv, isWithAI: !newState } : conv))
    );
  };

  const handleUpdateConversationStatus = async (conversationId, newStatus) => {
    const result = await updateConversationStatus(conversationId, newStatus);
    if (result) {
      setConversationList((prevList) =>
        prevList.map((item) => (item.id == conversationId ? { ...item, status: newStatus } : item))
      );
      setOpenTabs((prevTabs) =>
        prevTabs.map((item) => (item.id == conversationId ? { ...item, status: newStatus } : item))
      );
    }
  };

  useEffect(() => {
    iaPausedMapRef.current = iaPausedMap;
  }, [iaPausedMap]);

    useEffect(() => {
    if (!connectionRef.current) {
      connectionRef.current = createHubConnection();
    }
    const connection = connectionRef.current;

    const setupSignalR = async () => {
      try {
        connection.on("InitialConversations", (data) => {
          // data es un array de conversaciones iniciales
          if (Array.isArray(data)) {
            setConversationList(data.map(conv => ({
              ...conv,
              id: String(conv.id),
              updatedAt: conv.lastMessage?.timestamp || conv.updatedAt,
            })));
          }
        });
        connection.on("ReceiveTyping", (conversationId, sender) => {
          const convId = String(conversationId);
          if (typingStopTimeout.current) {
            clearTimeout(typingStopTimeout.current);
          }
          setTypingState((prev) => ({ ...prev, [convId]: { isTyping: true, sender } }));
        });
        // Suscripción al evento de nueva conversación
        connection.on("NewConversation", (conv) => {
          console.log("🆕 Nueva conversación recibida:", conv);
          setConversationList((prevList) => {
            // Evitar duplicados por id
            if (prevList.some((c) => String(c.id) === String(conv.id))) return prevList;
            return [conv, ...prevList];
          });
        });

        connection.on("ReceiveStopTyping", (conversationId, sender) => {
          const convId = String(conversationId);
          typingStopTimeout.current = setTimeout(() => {
            setTypingState((prev) => {
              if (prev[convId]?.sender === sender) {
                return { ...prev, [convId]: { isTyping: false, sender: null } };
              }
              return prev;
            });
          }, 500);
        });

        connection.on("Heartbeat", (conversationId) => {
          console.log(`❤️ Heartbeat recibido para conversación ${conversationId}`);
          const convId = String(conversationId);
          setConversationList(prevList =>
            prevList.map(conv =>
              conv.id === convId
                ? { ...conv, lastHeartbeatTime: new Date().toISOString() }
                : conv
            )
          );
        });

        connection.on("NewConversationOrMessage", (msg) => {
          if (msg.from === 'admin') {
            return; // Ignore echoed admin messages (already handled optimistically)
          }

          // Debug: log raw incoming message for troubleshooting
          console.log(`📨 Nuevo mensaje recibido (raw):`, msg);
          try {
            console.debug("📨 Nuevo mensaje recibido (details):", {
              conversationId: msg.conversationId,
              id: msg.id,
              from: msg.from,
              text: msg.text,
              files: msg.files,
              images: msg.images
            });
          } catch (e) { console.warn("Debug log failed", e); }
          const convId = String(msg.conversationId);

          const newMsg = { ...msg };
          const hasFiles = newMsg.files && newMsg.files.length > 0;
          const hasImages = newMsg.images && newMsg.images.length > 0;

          if (hasFiles || hasImages) {
            newMsg.text = null;
          }

          setTypingState((prev) => {
            if (prev[convId]?.sender === newMsg.from) {
              return { ...prev, [convId]: { isTyping: false, sender: null } };
            }
            return prev;
          });

          setMessages((prev) => {
            const existing = prev[convId] || [];
            // Compare IDs as strings to avoid type mismatches (number vs string)
            if (existing.some((m) => String(m.id) === String(newMsg.id))) return prev;
            const normalizedMsg = { ...newMsg, text: newMsg.text || "" };
            const finalId = normalizedMsg.id ? String(normalizedMsg.id) : crypto.randomUUID();
            const toAppend = { ...normalizedMsg, id: finalId };

            // Update message cache as well so history and pagination remain consistent
            try {
              const cache = messageCache.current.get(convId) || [];
              console.debug(`📨 [SignalR] conv=${convId} cacheBefore=${cache.length} attemptingAppendId=${finalId}`);
              if (!cache.some((m) => String(m.id) === String(finalId))) {
                cache.push(toAppend);
                // keep cache sorted chronologically
                cache.sort((a, b) => new Date(a.timestamp || a.Timestamp || 0) - new Date(b.timestamp || b.Timestamp || 0));
                messageCache.current.set(convId, cache);
                console.debug(`📨 [SignalR] conv=${convId} cacheAfter=${cache.length} first=${cache[0]?.timestamp} last=${cache[cache.length-1]?.timestamp}`);
              } else {
                console.debug(`📨 [SignalR] conv=${convId} message ${finalId} already present in cache`);
              }
            } catch (e) {
              // ignore cache update failures
            }

            return { ...prev, [convId]: [...existing, toAppend] };
          });

          setConversationList((prevList) =>
            prevList.map((conv) =>
              `${conv.id}` === convId
                ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1, updatedAt: newMsg.timestamp, lastMessage: newMsg.text || (hasImages || hasFiles ? "📷 Imagen o Archivo" : "Nuevo Mensaje") }
                : conv
            )
          );
        });

        if (connection.state === "Disconnected") {
          await connection.start();
          console.log("SignalR connection started. State:", connection.state);
          if (connection.state === "Connected") {
            await connection.invoke("JoinAdmin");
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error("❌ Error al conectar con SignalR:", error);
      }
    };

    setupSignalR();

    return () => {
      console.log("🧹 Limpiando y deteniendo la conexión de SignalR.");
      connection.off("ReceiveTyping");
      connection.off("ReceiveStopTyping");
      connection.off("NewConversationOrMessage");
      connection.off("Heartbeat");
      if (connection.state === "Connected") {
        connection.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      try {
        const data = await getConversationsWithLastMessage(userId);
        const conversations = data.map((conv) => ({ ...conv, id: String(conv.id), updatedAt: conv.lastMessage?.timestamp || conv.updatedAt, }));
        setConversationList(conversations);
        const initialIaPausedMap = {};
        conversations.forEach(conv => {
          initialIaPausedMap[conv.id] = !conv.isWithAI;
        });
        setIaPausedMap(initialIaPausedMap);
      } catch (error) {
        console.error("Error al obtener conversaciones:", error);
      }
    };
    fetchData();
  }, [userId]);

  const handleSelectConversation = async (conv) => {
    const idStr = `${conv.id}`;
    const exists = openTabs.find((t) => t.id === idStr);
    if (!exists) {
      setOpenTabs((prev) => [...prev, { ...conv, id: idStr, unreadCount: 0 }]);
      // Ensure the tabs container scrolls to the end when a new tab is opened
      setTimeout(() => {
        const el = tabContainerRef.current;
        if (el) {
          try { el.scrollLeft = el.scrollWidth; } catch (e) { /* ignore */ }
        }
      }, 120);
      setIaPausedMap((prev) => ({ ...prev, [conv.id]: !conv.isWithAI }));
    }
    setActiveTab(idStr);
    setConversationList((prevList) =>
      prevList.map((c) => (c.id === idStr ? { ...c, unreadCount: 0 } : c))
    );
    setOpenTabs((prev) => prev.map((tab) => (tab.id === idStr ? { ...tab, unreadCount: 0 } : tab)));

      // If there is no cached or SignalR-loaded messages yet but the
      // conversation list shows a preview (conv.lastMessage), show a
      // temporary preview message immediately so the admin doesn't see
      // an empty chat. The real history will replace this when fetched.
      const hasExistingMessages = Boolean((messages && messages[idStr] && messages[idStr].length > 0) || messageCache.current.get(idStr));
      if (!hasExistingMessages && conv.lastMessage) {
        const previewMsg = {
          id: `preview-${idStr}`,
          text: conv.lastMessage,
          from: "user",
          fromRole: "user",
          fromName: conv.alias || null,
          timestamp: conv.updatedAt || new Date().toISOString(),
          __preview: true,
        };
        setMessages((prev) => ({ ...prev, [idStr]: [previewMsg] }));
      }

      const cached = messageCache.current.get(idStr);
    if (cached) {
      // When we have a cached full history, only render the most-recent slice
      const visible = Math.min(DEFAULT_VISIBLE_ON_OPEN, cached.length);
      visibleCounts.current.set(idStr, visible);
      setMessages((prev) => ({ ...prev, [idStr]: cached.slice(-visible) }));
      if (conv.unreadCount > 0) {
        try {
          await markMessagesAsRead(conv.id);
        } catch (error) {
          console.warn("❌ Error marcando mensajes como leídos:", error);
        }
      }
    } else {
      setLoadingConversationId(idStr);
      try {
        // Cargamos solo los mensajes necesarios inicialmente para evitar descargar TODO el historial.
        // Estrategia:
        // - Si la conversación tiene mensajes no leídos (conv.unreadCount > 0), solicitamos sólo
        //   esos mensajes + un pequeño contexto (mínimo 10, máximo 100).
        // - Si no hay no leídos, solicitamos una ventana pequeña (por ejemplo 20) y permitimos
        //   paginar hacia atrás al hacer scroll (loadMoreOlderMessages).
        const unread = Number(conv.unreadCount || 0);
  const MIN_INITIAL = 10;
  const DEFAULT_INITIAL = 20;
  const MAX_INITIAL = 25; // evita pedir cantidades enormes (ajustado a 25 por petición)
        let initialLimit;
        if (unread > 0) {
          initialLimit = Math.min(Math.max(unread, MIN_INITIAL), MAX_INITIAL);
        } else {
          initialLimit = DEFAULT_INITIAL;
        }

        // Prefer server-side grouped-by-day response when available. This returns a shape like:
        // { conversationId, days: [{ date, label, messages: [...] }], hasMore, nextBefore }
  const grouped = await getMessagesGrouped(conv.id, null, initialLimit);
  console.debug("🔎 [getMessagesGrouped] request:", { conversationId: conv.id, initialLimit });
  console.debug("🔎 [getMessagesGrouped] payload for conv", conv.id, grouped);
        // Server now provides days newest-first (orderedNewestFirst=true). Do not reverse on client.
  if (grouped && Array.isArray(grouped.days) && grouped.days.length > 0) {
          // Debug: log counts per day to help troubleshoot missing dividers / all-loaded behavior
          try {
            const counts = grouped.days.map(d => ({ date: d.date, label: d.label, count: Array.isArray(d.messages) ? d.messages.length : 0 }));
            console.debug("🔎 [getMessagesGrouped] days summary:", counts);
          } catch (e) { /* ignore */ }
          const flattened = [];
          grouped.days.forEach((day) => {
            flattened.push({ id: `day-divider-${conv.id}-${day.date}`, __dayDivider: true, label: day.label, timestamp: day.date });
            const msgs = Array.isArray(day.messages) ? day.messages : [];
            msgs.forEach((msg) => {
              const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
              const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
              let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? "user";
              try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
              let fromRole = (fromRoleRaw || "").toLowerCase();
              if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") fromRole = "user";
              const from = msg.from ?? msg.From ?? null;
              const fromId = msg.fromId ?? msg.FromId ?? null;
              const fromName = msg.fromName ?? msg.FromName ?? null;
              flattened.push({ ...msg, id: String(id), text, fromRole, from, fromId, fromName });
            });
          });

          // Debug: report flattened window shape (first/last items, days order)
          try {
            console.debug(`🔍 [handleSelectConversation] conv=${conv.id} grouped.orderedNewestFirst=${!!grouped.orderedNewestFirst} daysOrder=`, grouped.days.map(d => d.date));
            console.debug(`🔍 [handleSelectConversation] conv=${conv.id} flattened count=${flattened.length}`, {
              first: flattened[0],
              last: flattened[flattened.length - 1],
            });
          } catch (e) { /* ignore debug errors */ }

          // Merge fetched grouped history with any existing messages (SignalR optimistic / preview)
          setMessages((prev) => {
            const existing = prev[idStr] || [];
            const map = new Map();
            flattened.forEach((m) => map.set(String(m.id), m));
            existing.forEach((m) => map.set(String(m.id), m));
            const merged = Array.from(map.values()).sort((a, b) => new Date(a.timestamp || a.Timestamp || 0) - new Date(b.timestamp || b.Timestamp || 0));
            // store full merged history in cache but only render the tail (recent messages)
            messageCache.current.set(idStr, merged);
            if (grouped.hasMore) {
              messageCursor.current.set(idStr, { hasMore: true, nextBefore: grouped.nextBefore });
            } else {
              messageCursor.current.set(idStr, { hasMore: false, nextBefore: null });
            }
            // Determine how many messages to show on open: prefer initialLimit or default
            const desiredVisible = Math.min(Math.max(initialLimit || DEFAULT_VISIBLE_ON_OPEN, DEFAULT_VISIBLE_ON_OPEN), merged.length);
            visibleCounts.current.set(idStr, desiredVisible);
            const visibleSlice = merged.slice(-desiredVisible);

            // Debug: log merged cache and visible slice info for diagnostics (after visibleSlice is known)
            try {
              const first = merged[0];
              const last = merged[merged.length - 1];
              console.debug(`🗂️ [handleSelectConversation] conv=${conv.id} mergedCount=${merged.length} firstTs=${first?.timestamp || first?.Timestamp} lastTs=${last?.timestamp || last?.Timestamp}`);
              console.debug(`🗂️ [handleSelectConversation] conv=${conv.id} desiredVisible=${desiredVisible} visibleSliceCount=${visibleSlice.length}`, {
                visibleFirst: visibleSlice[0],
                visibleLast: visibleSlice[visibleSlice.length - 1],
              });
            } catch (e) { /* ignore */ }

            (async () => {
              try {
                const files = await getFilesByConversation(conv.id);
                if (Array.isArray(files) && files.length > 0) {
                  const fileItems = files.map((f) => ({
                    id: `file-${f.id}`,
                    text: null,
                    fromRole: 'user',
                    fromName: f.userName || `Sesión ${conv.id}`,
                    timestamp: f.uploadedAt || f.UploadedAt || new Date().toISOString(),
                    fileUrl: f.filePath || f.fileUrl || f.filePathServer || f.path || null,
                    fileName: f.fileName || f.fileNameOriginal || f.name,
                    fileType: f.fileType || f.fileType || 'application/octet-stream',
                    _origin: 'uploaded_file',
                    _fileId: f.id,
                  }));

                  const current = messageCache.current.get(idStr) || merged;
                  const byId = new Map();
                  current.forEach((m) => byId.set(String(m.id), m));
                  fileItems.forEach((fi) => { if (!byId.has(String(fi.id))) byId.set(String(fi.id), fi); });
                  const mergedWithFiles = Array.from(byId.values()).sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                  messageCache.current.set(idStr, mergedWithFiles);
                  // update the visible slice according to the current visible count
                  const currentVisible = visibleCounts.current.get(idStr) || desiredVisible || DEFAULT_VISIBLE_ON_OPEN;
                  const visibleAfterFiles = mergedWithFiles.slice(-currentVisible);
                  setMessages((prev2) => ({ ...prev2, [idStr]: visibleAfterFiles }));
                }
              } catch (fileErr) {
                console.warn('[getFilesByConversation] failed to fetch/merge files for conv', conv.id, fileErr);
              }
            })();

            // return only the visible slice to render (recent messages)
            return { ...prev, [idStr]: visibleSlice };
          });
        } else {
          // Fallback: use the paged endpoint if grouped not available
          const paged = await getMessagesPaginated(conv.id, null, initialLimit);
          console.log("🔎 [getMessagesPaginated fallback] payload for conv", conv.id, paged);
          if (paged && Array.isArray(paged.messages) && paged.messages.length > 0) {
            const normalized = paged.messages.map((msg) => {
              const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
              const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
              let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? "user";
              try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
              let fromRole = (fromRoleRaw || "").toLowerCase();
              if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") fromRole = "user";
              const fromId = msg.fromId ?? msg.FromId ?? null;
              const fromName = msg.fromName ?? msg.FromName ?? null;
              return { ...msg, id: String(id), text, fromRole, fromId, fromName };
            });
            setMessages((prev) => {
              const existing = prev[idStr] || [];
              const map = new Map();
              normalized.forEach((m) => map.set(String(m.id), m));
              existing.forEach((m) => map.set(String(m.id), m));
              const merged = Array.from(map.values()).sort((a, b) => new Date(a.timestamp || a.Timestamp || 0) - new Date(b.timestamp || b.Timestamp || 0));
              messageCache.current.set(idStr, merged);
              if (paged.hasMore) {
                messageCursor.current.set(idStr, { hasMore: true, nextBefore: paged.nextBefore });
              } else {
                messageCursor.current.set(idStr, { hasMore: false, nextBefore: null });
              }

              // determine visible slice for paged fallback (similar to grouped)
              const fallbackVisible = Math.min(Math.max(initialLimit || DEFAULT_VISIBLE_ON_OPEN, DEFAULT_VISIBLE_ON_OPEN), merged.length);
              visibleCounts.current.set(idStr, fallbackVisible);
              const fallbackSlice = merged.slice(-fallbackVisible);
              return { ...prev, [idStr]: fallbackSlice };
            });
          } else {
            // If the grouped and paged endpoints returned empty, try older fallback
            console.warn(`⚠️ [getConversationHistory] empty history for conv ${conv.id}, trying fallback /api/Messages/by-conversation`);
            try {
              const fb = await getMessagesByConversationId(conv.id);
              if (Array.isArray(fb) && fb.length > 0) {
                const fallbackNormalized = fb.map((msg) => ({ ...msg, id: msg.id ? String(msg.id) : `${idStr}-${Date.now()}`, text: msg.text || msg.messageText || "" }));
                setMessages((prev) => {
                  const existing = prev[idStr] || [];
                  const map = new Map();
                  existing.forEach((m) => map.set(String(m.id), m));
                  fallbackNormalized.forEach((m) => map.set(String(m.id), m));
                  const merged = Array.from(map.values()).sort((a, b) => new Date(a.timestamp || a.Timestamp || 0) - new Date(b.timestamp || b.Timestamp || 0));
                  messageCache.current.set(idStr, merged);
                  return { ...prev, [idStr]: merged };
                });
              }
            } catch (fbErr) {
              console.error(`❌ [fallback] error loading messages for conv ${conv.id}`, fbErr);
              const cachedNow = messageCache.current.get(idStr);
              if (cachedNow) setMessages((prev) => ({ ...prev, [idStr]: cachedNow }));
            }
          }
        }
      } catch (err) {
        console.error("❌ Error cargando historial de la conversación:", err);
        // If history fetch fails (e.g. 403), keep any existing SignalR messages or cached messages
        const cachedNow = messageCache.current.get(idStr);
        if (cachedNow) {
          setMessages((prev) => ({ ...prev, [idStr]: cachedNow }));
        }
      } finally {
        setLoadingConversationId(null);
      }
    }
  };

  // Cargar más mensajes antiguos (paginación hacia atrás). Devuelve el número de mensajes añadidos.
  const loadMoreOlderMessages = async (conversationId) => {
    const idStr = String(conversationId);
    const cursor = messageCursor.current.get(idStr) || { hasMore: false, nextBefore: null };
    if (!cursor.hasMore || !cursor.nextBefore) return 0;
    try {
      const before = cursor.nextBefore;
  // Use grouped endpoint so we load a window already grouped by day (includes files)
  console.debug("🔃 [loadMoreOlderMessages] requesting grouped for conv", conversationId, { before });
  const grouped = await getMessagesGrouped(conversationId, before, 50);
  console.debug("🔃 [loadMoreOlderMessages] response grouped:", grouped && grouped.days ? grouped.days.map(d => ({ date: d.date, label: d.label, count: (d.messages||[]).length })) : grouped);
      if (!grouped || !Array.isArray(grouped.days) || grouped.days.length === 0) {
        messageCursor.current.set(idStr, { hasMore: false, nextBefore: null });
        return 0;
      }

  // Flatten grouped.days into day-divider objects + messages (preserve server labels)
      const flattened = [];
      grouped.days.forEach((day) => {
        // day.date is like 'yyyy-MM-dd' and day.label is localized (e.g., 'Hoy', 'Ayer')
        flattened.push({ __dayDivider: true, id: `day-divider-${conversationId}-${day.date}`, label: day.label, timestamp: day.date });
        const msgs = Array.isArray(day.messages) ? day.messages : [];
        msgs.forEach((msg) => {
          const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
          const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
          let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? "user";
          try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
          let fromRole = (fromRoleRaw || "").toLowerCase();
          if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") fromRole = "user";
          const fromId = msg.fromId ?? msg.FromId ?? msg.fromId ?? null;
          const fromName = msg.fromName ?? msg.FromName ?? msg.alias ?? msg.fromName ?? null;
          flattened.push({ ...msg, id: String(id), text, fromRole, fromId, fromName });
        });
      });

      // Debug: show what older window contained
      try {
        console.debug(`🔃 [loadMoreOlderMessages] conv=${conversationId} incomingDays=`, grouped.days.map(d => ({ date: d.date, count: (d.messages||[]).length })));
        console.debug(`🔃 [loadMoreOlderMessages] conv=${conversationId} flattened count=${flattened.length}`, { first: flattened[0], last: flattened[flattened.length - 1] });
      } catch (e) { /* ignore */ }

      // Prepend flattened window to cache preserving existing messages
      setMessages((prev) => {
        const existing = prev[idStr] || [];
        const map = new Map();
        // add incoming older window first
        flattened.forEach((m) => map.set(String(m.id || `day-${Math.random().toString(36).slice(2,6)}`), m));
        // then existing messages
        existing.forEach((m) => map.set(String(m.id), m));
        const merged = Array.from(map.values()).sort((a, b) => new Date(a.timestamp || a.Timestamp || 0) - new Date(b.timestamp || b.Timestamp || 0));
        messageCache.current.set(idStr, merged);
        // Debug: after prepend, show sizes and visible window (compute newVisible first)
        try {
          const addedMessages = flattened.filter((x) => !x.__dayDivider).length;
          const currentVisible = visibleCounts.current.get(idStr) || Math.min(DEFAULT_VISIBLE_ON_OPEN, existing.length);
          const newVisible = Math.min(merged.length, currentVisible + addedMessages);
          const first = merged[0];
          const last = merged[merged.length - 1];
          console.debug(`🔃 [loadMoreOlderMessages] conv=${conversationId} mergedCount=${merged.length} addedMessages=${addedMessages} currentVisible=${currentVisible} newVisible=${newVisible}`);
          console.debug(`🔃 [loadMoreOlderMessages] conv=${conversationId} merged first/last:`, { first, last });
        } catch (e) { /* ignore */ }
        // update cursor
        if (grouped.hasMore) {
          messageCursor.current.set(idStr, { hasMore: true, nextBefore: grouped.nextBefore });
        } else {
          messageCursor.current.set(idStr, { hasMore: false, nextBefore: null });
        }

        // expand visible count to include newly loaded older messages
        const currentVisible = visibleCounts.current.get(idStr) || Math.min(DEFAULT_VISIBLE_ON_OPEN, existing.length);
        const addedMessages = flattened.filter((x) => !x.__dayDivider).length;
        const newVisible = Math.min(merged.length, currentVisible + addedMessages);
        visibleCounts.current.set(idStr, newVisible);
        const visibleSlice = merged.slice(-newVisible);
        return { ...prev, [idStr]: visibleSlice };
      });

      // Return number of message items (exclude day dividers) for continuity
      const messageCount = flattened.filter((x) => !x.__dayDivider).length;
      return messageCount;
    } catch (err) {
      console.error("❌ Error cargando página antigua:", err);
      return 0;
    }
  };

  const handleReply = (message) => {
    setReplyToMessage(message);
  };

  const handleJumpToReply = (messageId) => {
    const target = messageRefs.current[messageId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => setHighlightedMessageId(null), 2000);
    } else {
      console.warn("❌ No se encontró el mensaje en refs:", messageId);
    }
  };

  const handleAdminTyping = (conversationId) => {
    const connection = connectionRef.current;
    if (connection && connection.state === "Connected") {
      connection.invoke("Typing", Number(conversationId), "admin").catch(err => console.error("Error invoking Typing:", err));
    }
  };

  const handleAdminStopTyping = (conversationId) => {
    const connection = connectionRef.current;
    if (connection && connection.state === "Connected") {
      connection.invoke("StopTyping", Number(conversationId), "admin").catch(err => console.error("Error invoking StopTyping:", err));
    }
  };

  const handleSendAdminMessage = async (text, conversationId, messageId, replyToMessageId = null, replyToText = null) => {
    // ✅ NUEVO: Detectar inyección de prompts antes de enviar
    const injectionDetection = detectPromptInjection(text);
    if (injectionDetection.detected) {
      console.warn(`⚠️ [PromptInjection] Patrones detectados: ${injectionDetection.patterns.join(', ')} (Riesgo: ${injectionDetection.riskScore}/100)`);
      
      // Mostrar alerta al usuario
      const confirmed = window.confirm(
        `⚠️ Advertencia de Seguridad:\n\n` +
        `Se detectaron ${injectionDetection.patterns.length} patrón(es) de inyección de prompt.\n` +
        `Nivel de riesgo: ${injectionDetection.riskScore}/100\n\n` +
        `¿Deseas continuar de todas formas?`
      );
      
      if (!confirmed) {
        console.info("📌 Envío de mensaje cancelado por el usuario (sospecha de inyección)");
        return;
      }
    }

    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      console.warn("SignalR connection not ready yet");
      return;
    }

    const convId = String(conversationId);
    const optimisticMessage = {
      id: messageId,
      from: "admin",
      fromRole: "admin",
      text: text,
      timestamp: new Date().toISOString(),
      replyToMessageId: replyToMessageId,
      replyToText: replyToText,
      replyTo: replyToMessageId ? (messages[convId] || []).find((m) => m.id === replyToMessageId) : null,
    };

    setMessages((prev) => {
      const existing = prev[convId] || [];
      return { ...prev, [convId]: [...existing, optimisticMessage] };
    });

    try {
      // Normalize replyToMessageId to an integer if possible. The client may have
      // preview or optimistic message IDs (e.g. 'preview-39' or UUIDs) which
      // will fail server-side binding when the hub expects an int?.
      let safeReplyToId = null;
      if (replyToMessageId !== null && replyToMessageId !== undefined) {
        const parsed = Number(replyToMessageId);
        safeReplyToId = Number.isFinite(parsed) && !Number.isNaN(parsed) ? parsed : null;
      }
      console.debug(`🛰️ [AdminMessage.invoke] conv=${conversationId} textLen=${String(text || '').length} safeReplyToId=${safeReplyToId}`, { replyToMessageId, replyToText });
      await connection.invoke("AdminMessage", Number(conversationId), text, safeReplyToId, replyToText);
      setReplyToMessage(null);
    } catch (err) {
      // Show a clearer error message in the console and remove optimistic message
      // so UI is consistent. Keep original error object for debugging.
      console.error("❌ Error sending AdminMessage (invoke failed):", err && err.message ? err.message : err);
      setMessages((prev) => {
        const existing = prev[convId] || [];
        return { ...prev, [convId]: existing.filter((m) => m.id !== messageId) };
      });
    }
  };

  const handleBlockUser = (id) => {
    setConversationList((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, blocked: !conv.blocked } : conv))
    );
  };

  const selectedConversation = conversationList.find((conv) => conv.id === activeTab);
  const selectedMessages = messages[activeTab] || [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox px={2} pt={2}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4} lg={4}>
            {showTrash && userId === '1' ? (
              <>
                <Button variant="text" color="info" sx={{ mb: 1 }} onClick={() => setShowTrash(false)}>
                  Volver
                </Button>
                <TrashView
                  conversations={trashConversations}
                  onEmptyTrash={handleEmptyTrash}
                  userId={userId}
                />
              </>
            ) : (
              <Card sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", borderRadius: 0 }}>
                <SoftBox p={2} sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <ConversationList
                    conversations={conversationList}
                    messagesMap={messages}
                    highlightedIds={highlightedIds}
                    onClearHighlight={(id) => setHighlightedIds((prev) => prev.filter((cid) => cid !== id))}
                    onSelect={(id) => {
                      const conv = conversationList.find((c) => c.id === id);
                      if (conv) {
                        // Marcar como leída si tiene mensajes no leídos
                        if (conv.unreadCount > 0) {
                          markMessagesAsRead(conv.id).then(() => {
                            setConversationList((prevList) =>
                              prevList.map((item) => (item.id == conv.id ? { ...item, unreadCount: 0 } : item))
                            );
                          });
                        }
                        // Si no hay mensajes en el estado, cargar historial
                        const idStr = String(conv.id);
                        if (!messages[idStr] || messages[idStr].length === 0) {
                          setLoadingConversationId(idStr);
                          getMessagesGrouped(conv.id, null, 20).then((grouped) => {
                            if (grouped && Array.isArray(grouped.days) && grouped.days.length > 0) {
                              const flattened = [];
                              grouped.days.forEach((day) => {
                                flattened.push({ id: `day-divider-${conv.id}-${day.date}`, __dayDivider: true, label: day.label, timestamp: day.date });
                                const msgs = Array.isArray(day.messages) ? day.messages : [];
                                msgs.forEach((msg) => {
                                  const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
                                  const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
                                  let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? "user";
                                  try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
                                  let fromRole = (fromRoleRaw || "").toLowerCase();
                                  if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") fromRole = "user";
                                  const fromId = msg.fromId ?? msg.FromId ?? null;
                                  const fromName = msg.fromName ?? msg.FromName ?? null;
                                  flattened.push({ ...msg, id: String(id), text, fromRole, fromId, fromName });
                                });
                              });
                              // Mostrar solo los más recientes
                              const visible = Math.min(20, flattened.length);
                              setMessages((prev) => ({ ...prev, [idStr]: flattened.slice(-visible) }));
                            }
                            setLoadingConversationId(null);
                          });
                        }
                        handleSelectConversation(conv);
                      }
                      setHighlightedIds((prev) => prev.filter((cid) => cid !== id));
                    }}
                    onStatusChange={handleUpdateConversationStatus}
                    onBlock={(id) => handleBlockUser(id)}
                    activeTab={activeTab}
                    onMovedToTrash={handleMovedToTrash}
                    onShowTrash={handleShowTrash}
                  />
                </SoftBox>
              </Card>
            )}
          </Grid>
          <Grid item xs={12} md={8} lg={8}>
            <Card sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", borderRadius: 0 }}>
              <SoftBox sx={{ flex: 1, display: "flex", minHeight: 0, flexDirection: "column", position: "relative", pb: 2 }}>
                <TabsBar
                  openTabs={openTabs}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  setOpenTabs={setOpenTabs}
                  tabContainerRef={tabContainerRef}
                  tabRefs={tabRefs}
                  showScrollButtons={showScrollButtons}
                  isDraggingRef={isDraggingRef}
                />

                {selectedConversation ? (
                  <ChatPanel
                    ref={chatPanelRef}
                    conversationId={Number(activeTab)}
                    messages={selectedMessages}
                    userName={`Sesión ${selectedConversation.id}`}
                    isTyping={typingState[activeTab]?.isTyping ?? false}
                    typingSender={typingState[activeTab]?.sender}
                    typingConversationId={activeTab}
                    onToggleIA={() => handleToggleIA(activeTab)}
                    iaPaused={iaPausedMap[activeTab] ?? false}
                    onSendAdminMessage={handleSendAdminMessage}
                    onStatusChange={(newStatus) => handleUpdateConversationStatus(activeTab, newStatus)}
                    onBlock={() => handleBlockUser(activeTab)}
                    status={selectedConversation?.status || "activa"}
                    blocked={selectedConversation?.blocked || false}
                    replyTo={replyToMessage}
                    onReply={handleReply}
                    onCancelReply={() => setReplyToMessage(null)}
                    messageRefs={messageRefs}
                    onJumpToReply={handleJumpToReply}
                    highlightedMessageId={highlightedMessageId}
                    onAdminTyping={handleAdminTyping}
                    onAdminStopTyping={handleAdminStopTyping}
                    connection={connectionRef.current}
                    currentUser={{ id: "admin" }}
                    onLoadMoreOlderMessages={loadMoreOlderMessages}
                  />
                ) : (
                  <SoftBox display="flex" justifyContent="center" alignItems="center" height="100%">
                    <SoftTypography variant="body2" color="secondary">Selecciona una conversación para comenzar</SoftTypography>
                  </SoftBox>
                )}
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
    </DashboardLayout>
  );
}

export default Conversations;