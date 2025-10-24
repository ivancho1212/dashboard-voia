import TrashView from './TrashView';
import Button from '@mui/material/Button';
import { useEffect, useState, useRef } from "react";

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
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

import {
  getConversationsByUser,
  getMessagesByConversationId,
  getConversationHistory,
  getMessagesPaginated,
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
  const messageCache = useRef(new Map());
  const messageCursor = useRef(new Map()); // stores { hasMore, nextBefore } per conversationId
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
  const [ticker, setTicker] = useState(0);

  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    const intervalId = setInterval(() => {
        setTicker(prev => prev + 1);
    }, 1000); // Check every 1 second

    return () => clearInterval(intervalId);
  }, []);

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
            return { ...prev, [convId]: [...existing, { ...normalizedMsg, id: finalId }] };
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
      setMessages((prev) => ({ ...prev, [idStr]: cached }));
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
        // Cargamos la última página usando el endpoint paginado. Esto evita traer TODO el historial
        // y nos da un cursor (nextBefore) para paginar hacia atrás.
        const paged = await getMessagesPaginated(conv.id, null, 50);
        console.log("🔎 [getMessagesPaginated] payload for conv", conv.id, paged);
        if (paged && Array.isArray(paged.messages) && paged.messages.length > 0) {
          const normalized = paged.messages.map((msg) => {
            // support API returning PascalCase (C#) or camelCase (JS)
            const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
            const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
            // Normalize various casings/values into a stable lowercase role
            let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? "user";
            try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
            let fromRole = (fromRoleRaw || "").toLowerCase();
            if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") {
              // Treat unknown variants as public/user
              fromRole = "user";
            }
            const from = msg.from ?? msg.From ?? null;
            const fromId = msg.fromId ?? msg.FromId ?? msg.fromId ?? msg.FromId ?? msg.FromId ?? null;
            const fromName = msg.fromName ?? msg.FromName ?? msg.fromName ?? msg.FromName ?? null;

            // preserve other fields
            const rest = { ...msg };
            return {
              ...rest,
              id: String(id),
              text,
              fromRole,
              from,
              fromId,
              fromName,
            };
          });
          // Merge fetched page with any existing messages (SignalR optimistic / preview)
          setMessages((prev) => {
            const existing = prev[idStr] || [];
            const map = new Map();
            // add fetched history first (older items)
            normalized.forEach((m) => map.set(String(m.id), m));
            // then existing to preserve optimistic messages at the end
            existing.forEach((m) => map.set(String(m.id), m));
            const merged = Array.from(map.values()).sort((a, b) => new Date(a.timestamp || a.Timestamp || 0) - new Date(b.timestamp || b.Timestamp || 0));
            // update cache and cursor info
            messageCache.current.set(idStr, merged);
            if (paged.hasMore) {
              messageCursor.current.set(idStr, { hasMore: true, nextBefore: paged.nextBefore });
            } else {
              messageCursor.current.set(idStr, { hasMore: false, nextBefore: null });
            }
            return { ...prev, [idStr]: merged };
          });

          // If the last page we loaded contains only admin messages, and there are older pages,
          // automatically fetch up to N older pages so the admin immediately sees public/user or bot messages.
          try {
            const mergedNow = messageCache.current.get(idStr) || [];
            const onlyAdmins = mergedNow.length > 0 && mergedNow.every(m => (m.fromRole || (m.FromRole || m.from || 'user')).toString().toLowerCase() === 'admin');
            if (onlyAdmins) {
              const maxAutoPages = 3; // don't loop forever; tune as needed
              for (let i = 0; i < maxAutoPages; i++) {
                const added = await loadMoreOlderMessages(conv.id);
                if (!added) break; // no more messages or error
                const now = messageCache.current.get(idStr) || [];
                const hasNonAdmin = now.some(m => (m.fromRole || (m.FromRole || m.from || '')).toString().toLowerCase() !== 'admin');
                if (hasNonAdmin) break;
              }
            }
          } catch (autoErr) {
            console.warn("⚠️ Auto-prefetch older pages failed:", autoErr);
          }
          console.log("🔎 [getConversationHistory] normalized messages stored in cache for conv", idStr, normalized.map(m => ({ id: m.id, text: m.text })));
          if (conv.unreadCount > 0) {
            try {
              await markMessagesAsRead(conv.id);
            } catch (error) {
              console.warn("❌ Error marcando mensajes como leídos:", error);
            }
          }
        } else {
          // If the main history endpoint returned empty, try a fallback endpoint
          console.warn(`⚠️ [getConversationHistory] empty history for conv ${conv.id}, trying fallback /api/Messages/by-conversation`);
          try {
            const fallback = await getMessagesByConversationId(conv.id);
            console.log(`🔁 [fallback] messages for conv ${conv.id}:`, fallback);
            if (Array.isArray(fallback) && fallback.length > 0) {
              const fallbackNormalized = fallback.map((msg) => ({
                ...msg,
                id: msg.id ? String(msg.id) : `${idStr}-${Date.now()}`,
                text: msg.text || msg.messageText || "",
              }));
              // Merge with existing to avoid wiping SignalR/preview messages
              setMessages((prev) => {
                const existing = prev[idStr] || [];
                const map = new Map();
                existing.forEach((m) => map.set(String(m.id), m));
                fallbackNormalized.forEach((m) => map.set(String(m.id), m));
                const merged = Array.from(map.values()).sort((a, b) => new Date(a.timestamp || a.Timestamp || 0) - new Date(b.timestamp || b.Timestamp || 0));
                messageCache.current.set(idStr, merged);
                // fallback -> no cursor info available
                return { ...prev, [idStr]: merged };
              });
              console.log("🔁 [fallback] normalized stored for conv", idStr, fallbackNormalized.map(m => ({ id: m.id, text: m.text })));
            } else {
              console.warn(`🔁 [fallback] returned no messages for conv ${conv.id}, preserving existing messages`);
            }
          } catch (fbErr) {
            console.error(`❌ [fallback] error loading messages for conv ${conv.id}`, fbErr);
            // Preserve any existing messages (from SignalR or cache) instead of wiping them.
            const cachedNow = messageCache.current.get(idStr);
            if (cachedNow) {
              setMessages((prev) => ({ ...prev, [idStr]: cachedNow }));
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
      const paged = await getMessagesPaginated(conversationId, before, 50);
      if (!paged || !Array.isArray(paged.messages) || paged.messages.length === 0) {
        messageCursor.current.set(idStr, { hasMore: false, nextBefore: null });
        return 0;
      }

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

      // Prepend older messages to cache
      setMessages((prev) => {
        const existing = prev[idStr] || [];
        const map = new Map();
        // add normalized older first
        normalized.forEach((m) => map.set(String(m.id), m));
        // then existing messages
        existing.forEach((m) => map.set(String(m.id), m));
        const merged = Array.from(map.values()).sort((a, b) => new Date(a.timestamp || a.Timestamp || 0) - new Date(b.timestamp || b.Timestamp || 0));
        messageCache.current.set(idStr, merged);
        // update cursor
        if (paged.hasMore) {
          messageCursor.current.set(idStr, { hasMore: true, nextBefore: paged.nextBefore });
        } else {
          messageCursor.current.set(idStr, { hasMore: false, nextBefore: null });
        }
        return { ...prev, [idStr]: merged };
      });

      return normalized.length;
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
      await connection.invoke("AdminMessage", Number(conversationId), text, replyToMessageId, replyToText);
      setReplyToMessage(null);
    } catch (err) {
      console.error("❌ Error sending message:", err);
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
                      if (conv) handleSelectConversation(conv);
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
                <DragDropContext onDragEnd={(result) => {
                  const { source, destination } = result;
                  if (!destination) return;
                  const reordered = Array.from(openTabs);
                  const [moved] = reordered.splice(source.index, 1);
                  reordered.splice(destination.index, 0, moved);
                  setOpenTabs(reordered);
                }}>
                  <Droppable droppableId="tabs" direction="horizontal">
                    {(provided) => (
                      <Box sx={{ position: "relative", display: "flex", alignItems: "center", mb: 1 }}>
                        {showScrollButtons && <IconButton onClick={() => { const el = tabContainerRef.current; if (el) el.scrollLeft -= 150; }} sx={{ position: "absolute", left: 0, zIndex: 2, backgroundColor: "#fff", "&:hover": { backgroundColor: "grey.200" } }}><ChevronLeftIcon /></IconButton>}
                        <Box
                          id="scrollable-tab-container"
                          ref={(el) => { tabContainerRef.current = el; provided.innerRef(el); }}
                          {...provided.droppableProps}
                          sx={{ overflowX: "auto", display: "flex", alignItems: "flex-end", scrollBehavior: "smooth", px: showScrollButtons ? 5 : 1, width: "100%" }}
                        >
                          {openTabs.map((tab, index) => {
                            const isActive = activeTab === tab.id;
                            return (
                              <Draggable key={tab.id} draggableId={tab.id.toString()} index={index}>
                                {(provided) => (
                                  <Box
                                    ref={(el) => { provided.innerRef(el); tabRefs.current[tab.id] = el; }}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setActiveTab(tab.id)}
                                    sx={{ display: "flex", alignItems: "center", minHeight: "40px", px: 2, mr: 0.5, mt: 2, cursor: "pointer", flexShrink: 0, borderTopLeftRadius: "8px", borderTopRightRadius: "8px", backgroundColor: isActive ? "info.main" : "transparent", boxShadow: isActive ? "0px 8px 16px rgba(0, 0, 0, 0.3)" : "none", zIndex: isActive ? 3 : 1, color: isActive ? "#fff" : "inherit", fontWeight: isActive ? "bold" : "normal", "&:hover": { backgroundColor: isActive ? "info.dark" : "action.hover" } }}
                                  >
                                    <Tooltip title={tab.alias || `Usuario ${tab.id.slice(-4)}`} arrow>
                                      <Box display="flex" alignItems="center" sx={{ maxWidth: { xs: 140, sm: 160, md: 180, lg: 200 }, flexShrink: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
                                        <Box component="span" sx={{ flexGrow: 1, overflow: "hidden", textOverflow: "ellipsis", color: isActive ? "#fff" : "inherit", fontSize: "0.80rem" }}>
                                          {tab.alias || `Usuario ${tab.id.slice(-4)}`}
                                        </Box>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setOpenTabs((prev) => { const updated = prev.filter((t) => t.id !== tab.id); if (activeTab === tab.id) { setActiveTab(updated[0]?.id || null); } return updated; }); }} sx={{ ml: 1, padding: "1px", color: isActive ? "#fff" : "inherit", fontSize: "0.90rem" }}><CloseIcon fontSize="inherit" /></IconButton>
                                      </Box>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </Box>
                        {showScrollButtons && <IconButton onClick={() => { const el = tabContainerRef.current; if (el) el.scrollLeft += 150; }} sx={{ position: "absolute", right: 0, zIndex: 2, backgroundColor: "#fff", "&:hover": { backgroundColor: "grey.200" } }}><ChevronRightIcon /></IconButton>}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>

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