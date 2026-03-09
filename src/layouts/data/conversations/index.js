import TrashView from './TrashView';
import Button from '@mui/material/Button';
import { useEffect, useState, useRef } from "react";
import PropTypes from 'prop-types';

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
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
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { getFilesByConversation } from "services/chatUploadedFilesService";
// ✅ NUEVO: Protección contra inyección de prompts
import { detectPromptInjection } from "services/promptInjectionService";
// 🔄 NUEVO: Activity tracking para mantener sesión activa
import { useActivityTracker } from 'hooks/useActivityTracker';
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
  blockUserByConversation,
} from "services/conversationsService";
import { useAuth } from "contexts/AuthContext";
import {
  restoreConversation,
  deleteConversationPermanently,
  getTrashConversations,
} from "services/conversationsService";

// 🔧 Helper: Normalizar timestamp con todas las variantes del backend + fix de timezone
function normalizeTimestamp(timestamp) {
  if (!timestamp) return new Date().toISOString();
  
  try {
    // Si ya tiene Z al final, está en formato UTC correcto
    if (typeof timestamp === 'string' && timestamp.endsWith('Z')) {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return timestamp;
    }
    
    // Si no tiene Z, agregarla para que se interprete como UTC
    if (typeof timestamp === 'string' && !timestamp.endsWith('Z')) {
      const withZ = timestamp + 'Z';
      const date = new Date(withZ);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return withZ;
    }
    
    // Fallback: convertir a ISO
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    return date.toISOString();
  } catch (e) {
    console.warn('⚠️ Error normalizando timestamp:', timestamp, e);
    return new Date().toISOString();
  }
}

// 🔧 Helper: Ordenar conversaciones con prioridad inteligente
// Prioridad: 1) Online (heartbeat activo) 2) No leídos  3) Más recientes
const CONV_HEARTBEAT_THRESHOLD = 45 * 1000;
function sortConversations(a, b) {
  const now = Date.now();
  const aOnline = a.lastHeartbeatTime && (now - new Date(a.lastHeartbeatTime).getTime() < CONV_HEARTBEAT_THRESHOLD);
  const bOnline = b.lastHeartbeatTime && (now - new Date(b.lastHeartbeatTime).getTime() < CONV_HEARTBEAT_THRESHOLD);
  const aUnread = (a.unreadCount || 0) > 0;
  const bUnread = (b.unreadCount || 0) > 0;
  // 0–3: online+unread=3, online=2, unread=1, ninguno=0
  const aPriority = (aOnline ? 2 : 0) + (aUnread ? 1 : 0);
  const bPriority = (bOnline ? 2 : 0) + (bUnread ? 1 : 0);
  if (bPriority !== aPriority) return bPriority - aPriority;
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

// ─── Helpers: persistir IDs eliminados en localStorage ────────────────────────
const VOIA_TRASH_IDS_KEY = "voia_trash_ids";

function getLocalTrashIds() {
  try { return new Set(JSON.parse(localStorage.getItem(VOIA_TRASH_IDS_KEY) || "[]")); }
  catch (e) { return new Set(); }
}
function addLocalTrashId(id) {
  const ids = getLocalTrashIds();
  ids.add(String(id));
  localStorage.setItem(VOIA_TRASH_IDS_KEY, JSON.stringify([...ids]));
}
function removeLocalTrashId(id) {
  const ids = getLocalTrashIds();
  ids.delete(String(id));
  localStorage.setItem(VOIA_TRASH_IDS_KEY, JSON.stringify([...ids]));
}
function clearLocalTrashIds() {
  localStorage.removeItem(VOIA_TRASH_IDS_KEY);
}
// ──────────────────────────────────────────────────────────────────────────────

function Conversations() {
  // Estado para mostrar papelera
  const [showTrash, setShowTrash] = useState(false);
  const [trashConversations, setTrashConversations] = useState([]);

  // Cargar conversaciones de la papelera desde la API
  const fetchTrash = async () => {
    const data = await getTrashConversations();
    setTrashConversations(data);
  };

  // Mostrar papelera (requiere permiso)
  const handleShowTrash = async () => {
    // Limpiar tabs abiertos de la vista de conversaciones antes de entrar al basurero
    setOpenTabs([]);
    setActiveTab(null);
    setShowTrash(true);
    await fetchTrash();
  };

  // Cuando se mueve al basurero: quitar de lista y cerrar el tab si estaba abierto
  const handleMovedToTrash = (conversationId) => {
    const convIdStr = String(conversationId);
    addLocalTrashId(convIdStr); // ✅ Persistir para sobrevivir recargas
    setConversationList((prev) => prev.filter((c) => String(c.id) !== convIdStr));
    setOpenTabs((prev) => {
      const updated = prev.filter((t) => String(t.id) !== convIdStr);
      setActiveTab((currentActive) => {
        if (String(currentActive) === convIdStr) {
          return updated[0]?.id || null;
        }
        return currentActive;
      });
      return updated;
    });
    if (showTrash) fetchTrash();
  };

  // Restaurar conversación desde la papelera
  const handleRestoreConversation = async (conversationId) => {
    await restoreConversation(conversationId);
    removeLocalTrashId(conversationId); // ✅ Quitar del filtro local
    setTrashConversations((prev) => prev.filter((c) => String(c.id) !== String(conversationId)));
    await fetchConversations();
  };

  // Abrir conversación desde la papelera en el ChatPanel (solo lectura del historial)
  const handleSelectTrashConversation = (convId) => {
    const conv = trashConversations.find((c) => String(c.id) === String(convId));
    if (!conv) return;
    const normalized = {
      id: String(conv.id),
      alias: `Sesión ${conv.sessionNumber ?? conv.id}`,
      lastMessage: conv.lastMessage || "",
      updatedAt: conv.updatedAt || new Date().toISOString(),
      status: conv.status || "trash",
      blocked: false,
      isWithAI: false,
      unreadCount: 0,
    };
    handleSelectConversation(normalized);
  };

  // Eliminar conversación permanentemente
  const handleDeleteConversationPermanently = async (conversationId) => {
    await deleteConversationPermanently(conversationId);
    removeLocalTrashId(conversationId); // ✅ Ya no necesita estar en el filtro local
    setTrashConversations((prev) => prev.filter((c) => String(c.id) !== String(conversationId)));
  };

  // Vaciar papelera: eliminar permanentemente todas las conversaciones en papelera
  const handleEmptyTrash = async () => {
    await Promise.all(trashConversations.map((c) => deleteConversationPermanently(c.id)));
    clearLocalTrashIds(); // ✅ Limpiar todo el filtro local
    setTrashConversations([]);
  };
  const tabContainerRef = useRef(null);
  const tabRefs = useRef({});
  const messageRefs = useRef({});
  const chatPanelRef = useRef(null);
  const connectionRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // 🔄 Activity tracking: mantiene la sesión activa mientras el usuario está usando la plataforma
  useActivityTracker();
  const messageCache = useRef(new Map());
  const messageCursor = useRef(new Map()); // stores { hasMore, nextBefore } per conversationId
  // Tracks how many messages (tail) are currently visible per conversation.
  const visibleCounts = useRef(new Map());
  const DEFAULT_VISIBLE_ON_OPEN = 30; // show recent 30 messages by default (WhatsApp-like)
  const typingStopTimeout = useRef(null);

  const [showScrollButtons, setShowScrollButtons] = useState(false);
  
  // Función helper para normalizar timestamps del backend a ISO UTC
  const normalizeTimestamp = (timestamp) => {
    if (!timestamp) return new Date().toISOString();
    
    try {
      // Si ya tiene Z al final, está en formato UTC correcto
      if (typeof timestamp === 'string' && timestamp.endsWith('Z')) {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        return timestamp;
      }
      
      // Si no tiene Z, agregarla para que se interprete como UTC
      if (typeof timestamp === 'string' && !timestamp.endsWith('Z')) {
        const withZ = timestamp + 'Z';
        const date = new Date(withZ);
        if (isNaN(date.getTime())) throw new Error('Invalid date');
        return withZ;
      }
      
      // Fallback: convertir a ISO
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) throw new Error('Invalid date');
      return date.toISOString();
    } catch (e) {
      console.warn('⚠️ Error normalizando timestamp:', timestamp, e);
      return new Date().toISOString();
    }
  };
  
  const [conversationList, setConversationList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [messages, setMessages] = useState({});
  const [iaPausedMap, setIaPausedMap] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [typingState, setTypingState] = useState({});
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [highlightedIds, setHighlightedIds] = useState([]);
  const iaPausedMapRef = useRef({});
  // Rastrear mensajes no leídos de conversaciones nuevas que aún no están en la lista
  // (porque "newconversation" es async y llega tarde respecto a "newconversationormessage")
  const pendingFirstMessageUnreadRef = useRef({});
  // Rastrear el último mensaje de conversaciones que llegaron por "newconversationormessage"
  // antes de que "newconversation" haya agregado la conv a la lista
  const pendingLastMessageRef = useRef({});

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [loadingConversationId, setLoadingConversationId] = useState(null);

  // 🔒 Block confirmation dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockDialogConvId, setBlockDialogConvId] = useState(null);
  const [blockDialogReason, setBlockDialogReason] = useState("");
  const [blockDialogIsBlocked, setBlockDialogIsBlocked] = useState(false);
  const [blockDialogLoading, setBlockDialogLoading] = useState(false);

  const { isAuthenticated } = useAuth();
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
        <Tooltip title={`Sesión ${(conversationList.find(c => c.id === tab.id) ?? trashConversations.find(c => String(c.id) === tab.id))?.sessionNumber ?? tab.id}`} arrow>
          <Box display="flex" alignItems="center" sx={{ maxWidth: { xs: 140, sm: 160, md: 180, lg: 200 }, flexShrink: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <Box component="span" sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff', fontSize: '0.80rem' }}>
              {`Sesión ${(conversationList.find(c => c.id === tab.id) ?? trashConversations.find(c => String(c.id) === tab.id))?.sessionNumber ?? tab.id}`}
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
    } else {
      console.warn(`⚠️ [StatusChange] API devolvió null/false para conv=${conversationId}. Estado NO actualizado.`);
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
        // SignalR JS recibe nombres en minúsculas; registrar en minúsculas para que los handlers se invoquen
        connection.on("initialconversations", (data) => {
          if (Array.isArray(data)) {
            const localTrashIds = getLocalTrashIds();
            data = data.filter((conv) => !localTrashIds.has(String(conv.id))); // ✅ Excluir papelera local
            setConversationList((prevList) => {
              
              // Crear mapa de conversaciones del backend
              const backendMap = new Map();
              data.forEach(conv => {
                backendMap.set(String(conv.id), {
                  ...conv,
                  id: String(conv.id)
                });
              });
              
              // Merge: preservar updatedAt de prevList si es más reciente
              const merged = prevList.map(prevConv => {
                const backend = backendMap.get(prevConv.id);
                if (backend) {
                  // Conversación existe en ambos: comparar updatedAt (NORMALIZADOS)
                  const backendUpdatedAt = normalizeTimestamp(backend.lastMessage?.timestamp || backend.updatedAt);
                  const prevUpdatedAt = normalizeTimestamp(prevConv.updatedAt);
                  const useExisting = new Date(prevUpdatedAt) > new Date(backendUpdatedAt);
                  
                  if (prevConv.id === '738') {
                  }
                  
                  backendMap.delete(prevConv.id); // Marcar como procesado
                  
                  // ✅ CRÍTICO: Preservar unreadCount del frontend si es mayor (puede haber mensajes recibidos en tiempo real)
                  const frontendUnread = prevConv.unreadCount || 0;
                  const backendUnread = backend.unreadCount || backend.unreadAdminMessages || 0;
                  const maxUnread = Math.max(frontendUnread, backendUnread);
                  
                  
                  if (useExisting) {
                    // Always use backend sessionNumber (authoritative) even when keeping prevConv data
                    return { ...prevConv, unreadCount: maxUnread, sessionNumber: backend.sessionNumber ?? prevConv.sessionNumber };
                  } else {
                    return {
                      ...backend,
                      updatedAt: backendUpdatedAt,
                      unreadCount: maxUnread,
                      // Preservar activeMobileSession de prevConv si el backend no lo envía
                      activeMobileSession: backend.activeMobileSession ?? prevConv.activeMobileSession,
                    };
                  }
                }
                // Conversación solo en prevList: mantener
                return prevConv;
              });
              
              // Agregar conversaciones nuevas que vienen del backend pero no estaban en prevList
              backendMap.forEach(conv => {
                merged.push({
                  ...conv,
                  updatedAt: normalizeTimestamp(conv.lastMessage?.timestamp || conv.updatedAt)
                });
              });
              
              // Ordenar: online primero, luego no leídos, luego más recientes
              // sessionNumber viene del backend — preservar en el merge
              return merged.sort(sortConversations);
            });
          }
        });
        connection.on("receivetyping", (conversationId, sender) => {
          const convId = String(conversationId);
          if (typingStopTimeout.current) {
            clearTimeout(typingStopTimeout.current);
          }
          setTypingState((prev) => ({ ...prev, [convId]: { isTyping: true, sender } }));
        });
        connection.on("newconversation", (conv) => {
          const convStr = {
            ...conv,
            id: String(conv.id),
            updatedAt: new Date().toISOString()
          };
          const convIdStr = convStr.id;

          // ✅ Agregar la conversación a la lista INMEDIATAMENTE (sin esperar el fetch async)
          // para que newconversationormessage pueda incrementar unreadCount correctamente.
          setConversationList((prevList) => {
            if (prevList.some((c) => String(c.id) === convIdStr)) return prevList;
            // Consumir cualquier unread y lastMessage acumulados antes de que la conv existiera en la lista
            const pendingUnread = pendingFirstMessageUnreadRef.current[convIdStr] || 0;
            const pendingLastMsg = pendingLastMessageRef.current[convIdStr] || "";
            if (pendingUnread > 0) delete pendingFirstMessageUnreadRef.current[convIdStr];
            if (pendingLastMsg) delete pendingLastMessageRef.current[convIdStr];
            const newConv = { ...convStr, lastMessage: pendingLastMsg || conv.lastMessage || "", unreadCount: pendingUnread };
            return [newConv, ...prevList].sort(sortConversations);
          });

          // Luego actualizar lastMessage y cargar mensajes en background
          import("services/conversationsService").then(({ getMessagesByConversationId }) => {
            getMessagesByConversationId(convIdStr).then((msgs) => {
              setMessages((prev) => ({ ...prev, [convIdStr]: msgs || [] }));
              const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1].text : "";
              if (lastMsg) {
                setConversationList((prevList) =>
                  prevList
                    .map((c) => String(c.id) === convIdStr ? { ...c, lastMessage: lastMsg } : c)
                    .sort(sortConversations)
                );
              }
            });
          });
        });

        connection.on("receivestoptyping", (conversationId, sender) => {
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

        connection.on("heartbeat", (conversationId) => {
          const convId = String(conversationId);
          setConversationList(prevList =>
            prevList
              .map(conv =>
                conv.id === convId
                  ? { ...conv, lastHeartbeatTime: new Date().toISOString() }
                  : conv
              )
              .sort(sortConversations)
          );
        });

        // ✅ Sesión móvil cerrada por inactividad: limpiar heartbeat y estado en la lista
        connection.on("mobilesessionended", (data) => {
          const convId = String(data?.conversationId ?? data);
          setConversationList(prevList =>
            prevList
              .map(conv =>
                conv.id === convId
                  ? { ...conv, lastHeartbeatTime: null, activeMobileSession: false, blocked: false, status: "closed" }
                  : conv
              )
              .sort(sortConversations)
          );
        });

        // ✅ Escuchar señal de que el widget se cerró y apagar punto verde inmediatamente
        connection.on("heartbeatstopped", (conversationId) => {
          const convId = String(conversationId);
          setConversationList(prevList =>
            prevList.map(conv =>
              conv.id === convId
                ? { ...conv, lastHeartbeatTime: null }
                : conv
            )
          );
        });

        // ✅ Escuchar cambios de estado de conversación (pendiente, resuelta, cerrada, etc.)
        connection.on("conversationstatuschanged", (conversationId, newStatus) => {
          const convId = String(conversationId);
          if (newStatus === "trash") {
            // Eliminar de la lista y de los tabs abiertos
            addLocalTrashId(convId);
            setConversationList(prevList => prevList.filter(conv => conv.id !== convId));
            setOpenTabs(prevTabs => prevTabs.filter(item => item.id !== convId));
          } else {
            setConversationList(prevList =>
              prevList.map(conv =>
                conv.id === convId ? { ...conv, status: newStatus } : conv
              )
            );
            setOpenTabs(prevTabs =>
              prevTabs.map(item =>
                item.id === convId ? { ...item, status: newStatus } : item
              )
            );
          }
        });

        connection.on("newconversationormessage", (msg) => {
          
          const convId = String(msg.conversationId);
          const newMsg = { ...msg };
          
          // ✅ Normalizar timestamp para ordenamiento consistente
          const rawTimestamp = newMsg.timestamp || newMsg.Timestamp || newMsg.createdAt || newMsg.CreatedAt;
          if (rawTimestamp) {
            try {
              const parsedDate = new Date(rawTimestamp);
              newMsg.timestamp = parsedDate.toISOString();
            } catch (e) {
              console.error('❌ [DEBUG] Error parseando timestamp (NewConversation):', rawTimestamp, e);
              newMsg.timestamp = new Date().toISOString();
            }
          } else {
            newMsg.timestamp = new Date().toISOString();
            console.warn('⚠️ [NewConversationOrMessage] Mensaje sin timestamp, usando hora actual:', newMsg.id);
          }
          
          // Normalizar fromRole: user=izquierda, bot+admin=derecha
          const fromRaw = (newMsg.from ?? newMsg.fromRole ?? "user").toString().toLowerCase();
          newMsg.fromRole = fromRaw === "admin" ? "admin" : fromRaw === "bot" ? "bot" : "user";
          newMsg.from = newMsg.fromRole;
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
            
            // Fusionar por id, priorizando mensajes únicos
            const allMessages = [...existing, newMsg];
            const uniqueMap = new Map();
            allMessages.forEach(m => {
              // ✅ Normalizar timestamp antes de agregar al mapa
              const msgTimestamp = m.timestamp || m.Timestamp || m.createdAt || m.CreatedAt;
              const normalizedMsg = {
                ...m,
                timestamp: normalizeTimestamp(msgTimestamp)
              };
              // ✅ UNIFICACIÓN: Solo usar ID como clave (igual que historial)
              const key = String(normalizedMsg.id);
              
              // 💾 PRESERVAR ARCHIVOS: Si el mensaje existente no tiene archivos pero el nuevo sí
              if (uniqueMap.has(key)) {
                const existingMsg = uniqueMap.get(key);
                const hasNewFiles = normalizedMsg.files?.length > 0 || normalizedMsg.images?.length > 0;
                const hasExistingFiles = existingMsg.files?.length > 0 || existingMsg.images?.length > 0;
                
                if (hasNewFiles && !hasExistingFiles) {
                  // Priorizar mensaje con archivos
                  uniqueMap.set(key, normalizedMsg);
                } else {
                }
              } else {
                uniqueMap.set(key, normalizedMsg);
              }
            });
            // ✅ Ordenar por timestamp (ascendente: más antiguos primero)
            const merged = Array.from(uniqueMap.values()).sort((a, b) => {
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              return timeA - timeB;
            });
            // Actualizar cache
            try {
              messageCache.current.set(convId, merged);
            } catch (e) {}
            return { ...prev, [convId]: merged };
          });

          setConversationList((prevList) => {
            const currentTimestamp = new Date().toISOString();

            // Buscar la conversación antes de actualizar
            const targetConv = prevList.find(c => `${c.id}` === convId);

            // ✅ Solo incrementar unreadCount si es mensaje del usuario público
            const shouldIncrementUnread = newMsg.fromRole === "user";

            // Si la conversación NO está en la lista todavía (porque "newconversation" aún no procesó el async),
            // acumular el conteo pendiente para que "newconversation" lo aplique al agregar la conv.
            if (!targetConv && shouldIncrementUnread) {
              pendingFirstMessageUnreadRef.current[convId] = (pendingFirstMessageUnreadRef.current[convId] || 0) + 1;
              // También guardar el último mensaje para mostrarlo cuando se agregue la conv
              pendingLastMessageRef.current[convId] = newMsg.text || (hasImages || hasFiles ? "📷 Imagen o Archivo" : "Nuevo Mensaje");
              return prevList; // Sin cambios por ahora
            }

            const updated = prevList.map((conv) => {
              if (`${conv.id}` === convId) {
                const newUnreadCount = shouldIncrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount;
                return {
                  ...conv,
                  unreadCount: newUnreadCount,
                  updatedAt: currentTimestamp,
                  lastMessage: newMsg.text || (hasImages || hasFiles ? "📷 Imagen o Archivo" : "Nuevo Mensaje")
                };
              }
              return conv;
            });
            
            // Verificar que se actualizó
            const updatedTarget = updated.find(c => `${c.id}` === convId);
            
            // ✅ Reordenar: online primero, luego no leídos, luego más recientes
            const sorted = updated.sort(sortConversations);
            
            // Mostrar top 5 después de ordenar
            
            // Encontrar posición de la conversación actualizada
            const position = sorted.findIndex(c => `${c.id}` === convId);
            
            return sorted;
          });
        });

        // ✅ CRÍTICO: Escuchar evento "ReceiveMessage" para mensajes en tiempo real
        connection.on("receivemessage", (msg) => {
            
            const convId = String(msg.conversationId);
            const newMsg = { ...msg };
            
            // ✅ Normalizar timestamp para ordenamiento consistente
            const rawTimestamp = newMsg.timestamp || newMsg.Timestamp || newMsg.createdAt || newMsg.CreatedAt;
            if (rawTimestamp) {
              try {
                const parsedDate = new Date(rawTimestamp);
                newMsg.timestamp = parsedDate.toISOString();
              } catch (e) {
                console.error('❌ [DEBUG] Error parseando timestamp:', rawTimestamp, e);
                newMsg.timestamp = new Date().toISOString();
              }
            } else {
              // Si no tiene timestamp, usar la hora actual
              newMsg.timestamp = new Date().toISOString();
              console.warn('⚠️ [ReceiveMessage] Mensaje sin timestamp, usando hora actual:', newMsg.id);
            }
            
            // Normalizar fromRole: user=izquierda, bot+admin=derecha
            const fromRaw = (newMsg.from ?? newMsg.fromRole ?? "user").toString().toLowerCase();
            newMsg.fromRole = fromRaw === "admin" ? "admin" : fromRaw === "bot" ? "bot" : "user";
            newMsg.from = newMsg.fromRole;
            
            const hasFiles = newMsg.files && newMsg.files.length > 0;
            const hasImages = newMsg.images && newMsg.images.length > 0;
            if (hasFiles || hasImages) {
              newMsg.text = null;
            }

            // Detener indicador de escritura
            setTypingState((prev) => {
              if (prev[convId]?.sender === newMsg.from) {
                return { ...prev, [convId]: { isTyping: false, sender: null } };
              }
              return prev;
            });

            // Agregar mensaje al estado (evitando duplicados)
            setMessages((prev) => {
              const existing = prev[convId] || [];
              
              // 🔧 FIX: Si el mensaje es del admin y existe un mensaje optimista con el mismo texto,
              // reemplazar el optimista con el mensaje definitivo del servidor
              if (newMsg.fromRole === "admin" && newMsg.text) {
                const optimisticIndex = existing.findIndex(m => 
                  m.__optimistic && 
                  m.text === newMsg.text && 
                  Math.abs(new Date(m.timestamp).getTime() - new Date(newMsg.timestamp).getTime()) < 5000 // Dentro de 5 segundos
                );
                
                if (optimisticIndex !== -1) {
                  // Reemplazar el mensaje optimista con el definitivo
                  const updated = [...existing];
                  updated[optimisticIndex] = { ...newMsg, __replaced: true };
                  
                  // Actualizar cache
                  try {
                    messageCache.current.set(convId, updated);
                  } catch (e) {}
                  
                  return { ...prev, [convId]: updated };
                }
              }
              
              // Evitar duplicados por id
              if (existing.some(m => String(m.id) === String(newMsg.id))) {
                return prev;
              }
              
              // ✅ Normalizar timestamps de mensajes existentes antes de ordenar
              const normalizedExisting = existing.map(m => ({
                ...m,
                timestamp: normalizeTimestamp(m.timestamp || m.Timestamp || m.createdAt || m.CreatedAt)
              }));
              
              const allMessages = [...normalizedExisting, newMsg];
              
              // ✅ Ordenar por timestamp (ascendente: más antiguos primero)
              const merged = allMessages.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return timeA - timeB;
              });
              
              // Actualizar cache
              try {
                messageCache.current.set(convId, merged);
              } catch (e) {}
              
              return { ...prev, [convId]: merged };
            });

            // Actualizar último mensaje en la lista de conversaciones (SIN incrementar unreadCount)
            setConversationList((prevList) => {
              const targetConv = prevList.find(c => `${c.id}` === convId);
              
              // ✅ IMPORTANTE: NO incrementamos unreadCount aquí - solo en newconversationormessage
              // Esto evita el doble conteo cuando ambos eventos se disparan para el mismo mensaje
              
              const updated = prevList.map((conv) => {
                if (`${conv.id}` === convId) {
                  return { 
                    ...conv, 
                    // ✅ Mantener unreadCount sin cambios - solo actualizar mensaje y timestamp
                    updatedAt: new Date().toISOString(), 
                    lastMessage: newMsg.text || (hasImages || hasFiles ? "📷 Imagen o Archivo" : "Nuevo Mensaje") 
                  };
                }
                return conv;
              });
              
              
              // ✅ Reordenar: online primero, luego no leídos, luego más recientes
              return updated.sort(sortConversations);
            });
          });

          connection.on("updateconversation", (conv) => {
            if (!conv || !conv.id) return;
            const convId = String(conv.id);
            setConversationList((prevList) => {
              const updated = prevList.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      lastMessage: conv.lastMessage,
                      updatedAt: new Date().toISOString(),
                      status: conv.status,
                      blocked: conv.blocked,
                      activeMobileSession: conv.activeMobileSession ?? c.activeMobileSession,
                      isWithAI: conv.isWithAI,
                      // Limpiar heartbeat si la conversación ya no está activa
                      lastHeartbeatTime: (conv.status === "inactiva" || conv.status === "cerrada" || conv.status === "resuelta") ? null : c.lastHeartbeatTime
                    }
                  : c
              );
              // ✅ Reordenar: online primero, luego no leídos, luego más recientes
              return updated.sort(sortConversations);
            });
            // Fusionar el mensaje recibido por socket con los del backend, evitando duplicados
            if (conv.lastMessage) {
              setMessages((prev) => {
                const existing = prev[convId] || [];
                // Si el array está vacío, espera a que el backend lo llene y luego fusiona
                if (existing.length === 0) {
                  return prev;
                }
                // Evitar duplicados por texto y timestamp
                const alreadyExists = existing.some(m => m.text === conv.lastMessage && m.timestamp === conv.updatedAt);
                if (alreadyExists) {
                  return prev;
                }
                const newMsg = {
                  id: `update-${convId}-${Date.now()}`,
                  text: conv.lastMessage,
                  from: 'user',
                  timestamp: conv.updatedAt || new Date().toISOString(),
                  fromRole: 'user',
                  __fromUpdateConversation: true
                };
                // Normalizar timestamps y ordenar
                const normalized = [...existing, newMsg].map(m => ({
                  ...m,
                  timestamp: normalizeTimestamp(m.timestamp || m.Timestamp || m.createdAt || m.CreatedAt)
                }));
                const merged = normalized.sort((a, b) => {
                  const timeA = new Date(a.timestamp).getTime();
                  const timeB = new Date(b.timestamp).getTime();
                  return timeA - timeB;
                });
                return { ...prev, [convId]: merged };
              });
            }
        });

        // ✅ CRÍTICO: Manejar eventos de reconexión de SignalR
        connection.onreconnecting((error) => {
          console.warn('🔄 [SignalR] Intentando reconectar...', error?.message || '');
          setIsConnected(false);
          
          // Intentar refrescar token silenciosamente durante reconexión
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const base64Payload = token.split('.')[1];
              const payload = JSON.parse(atob(base64Payload));
              const now = Math.floor(Date.now() / 1000);
              
              if (payload.exp && payload.exp < now) {
                import('services/authService').then(({ refreshAccessToken }) => {
                  refreshAccessToken()
                    .catch(() => {
                      console.error('❌ [SignalR] Refresh falló durante reconexión');
                      connection.stop().catch(() => {});
                    });
                });
              }
            } catch (e) {
              console.error('❌ [SignalR] Error verificando token en reconexión:', e);
            }
          }
        });
        
        connection.onreconnected((connectionId) => {
          setIsConnected(true);
          // Reiniciar la conexión admin
          connection.invoke("JoinAdmin").catch((err) => {
            console.error('❌ [SignalR] Error al rejoin admin:', err);
          });
        });
        
        connection.onclose((error) => {
          console.warn('🔌 [SignalR] Conexión cerrada.', error?.message || '');
          setIsConnected(false);
          
          // Si hay error, intentar refresh y reconectar en vez de matar la sesión
          if (error) {
            const token = localStorage.getItem("token");
            if (token) {
              try {
                const base64Payload = token.split('.')[1];
                const payload = JSON.parse(atob(base64Payload));
                const now = Math.floor(Date.now() / 1000);
                
                if (payload.exp && payload.exp < now) {
                  import('services/authService').then(({ refreshAccessToken }) => {
                    refreshAccessToken()
                      .catch(() => console.warn('⚠️ [SignalR] Refresh falló tras cierre — la próxima interacción redirigirá al login'));
                  });
                }
              } catch (e) {
                console.error('❌ [SignalR] Error verificando token en close:', e);
              }
            }
          }
        });

        if (connection.state === "Disconnected") {
          await connection.start();
          if (connection.state === "Connected") {
            await connection.invoke("JoinAdmin");
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error("❌ Error al conectar con SignalR:", error);

        // Verificar si el error es por autenticación (401)
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          console.warn('🔄 [SignalR] Error 401 al conectar — intentando refresh de token antes de redirigir...');
          try {
            const { refreshAccessToken } = await import('services/authService');
            await refreshAccessToken();
            // El accessTokenFactory leerá el nuevo token de localStorage en el próximo start()
            if (connection.state === "Disconnected") {
              await connection.start();
              if (connection.state === "Connected") {
                await connection.invoke("JoinAdmin");
                setIsConnected(true);
              }
            }
          } catch (refreshErr) {
            console.error('❌ [SignalR] Refresh falló, redirigiendo al login...');
            setLoadError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            setTimeout(() => {
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              window.location.href = '/authentication/sign-in';
            }, 2000);
          }
        }
      }
    };

    setupSignalR();

    return () => {
      const conn = connectionRef.current;
      if (!conn) return;
      connectionRef.current = null;
      try {
        conn.off("initialconversations");
        conn.off("receivetyping");
        conn.off("receivestoptyping");
        conn.off("newconversation");
        conn.off("newconversationormessage");
        conn.off("heartbeat");
        conn.off("heartbeatstopped");
        conn.off("mobilesessionended");
        conn.off("conversationstatuschanged");
        conn.off("updateconversation");
        conn.off("receivemessage");
      } catch (e) { /* ignore */ }
      
      // ✅ CRÍTICO: Detener conexión sin importar el estado para evitar memory leaks
      try {
        if (conn.state !== "Disconnected") {
          conn.stop().catch((err) => {
            console.warn('⚠️ [Cleanup] Error al detener SignalR:', err);
          });
        }
      } catch (e) {
        console.warn('⚠️ [Cleanup] Error en stop():', e);
      }
      
      messageCache.current.clear();
      messageCursor.current.clear();
      visibleCounts.current.clear();
    };
  }, []);

  const fetchConversations = async () => {
    if (!isAuthenticated) {
      setLoadingList(false);
      return;
    }
    
    // ✅ CRÍTICO: Verificar si el token está expirado ANTES de hacer peticiones
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn('⚠️ [FetchConversations] No hay token disponible');
      setLoadError('Sesión no válida. Por favor, inicia sesión nuevamente.');
      setLoadingList(false);
      // Cerrar conexión SignalR si existe
      const conn = connectionRef.current;
      if (conn && (conn.state === "Connected" || conn.state === "Connecting")) {
        conn.stop().catch(() => {});
      }
      return;
    }
    
    // ✅ Verificar si el token está expirado — intentar refresh antes de abortar
    try {
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        console.warn('⚠️ [FetchConversations] Token expirado, intentando refresh...');
        try {
          const { refreshAccessToken } = await import('services/authService');
          await refreshAccessToken();
          // Token renovado, continuar con la petición
        } catch (refreshErr) {
          console.error('❌ [FetchConversations] No se pudo renovar token expirado:', refreshErr?.message);
          setLoadError('Tu sesión ha expirado. Redirigiendo al login...');
          setLoadingList(false);
          
          // Cerrar conexión SignalR
          const conn = connectionRef.current;
          if (conn && (conn.state === "Connected" || conn.state === "Connecting")) {
            conn.stop().catch(() => {});
          }
          
          // Limpiar sesión y redirigir
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/authentication/sign-in';
          }, 2000);
          return;
        }
      }
    } catch (e) {
      console.error('❌ [FetchConversations] Error decodificando token:', e);
      // Continuar de todas formas, el interceptor de axios manejará el error
    }
    
    setLoadingList(true);
    setLoadError(null);
    try {
      const data = await getConversationsWithLastMessage();
      const raw = Array.isArray(data) ? data : (data?.conversations || data?.data || []);
      // DEBUG: log unread counts from backend to diagnose badge issue
      if (process.env.NODE_ENV === 'development') {
        const unreadSummary = (Array.isArray(raw) ? raw : []).map(c => ({
          id: c.id ?? c.Id,
          unreadAdminMessages: c.unreadAdminMessages ?? c.UnreadAdminMessages ?? c.unreadCount ?? c.UnreadCount,
        })).filter(x => x.unreadAdminMessages > 0);
        if (unreadSummary.length > 0) console.log('[fetchConversations] unread from backend:', unreadSummary);
      }
      const localTrashIds = getLocalTrashIds(); // ✅ IDs movidos a papelera localmente
      const fetchedConversations = (Array.isArray(raw) ? raw : [])
        .filter((conv) => !localTrashIds.has(String(conv.id))) // ✅ Excluir eliminados localmente
        .map((conv) => ({
        ...conv,
        id: String(conv.id),
        updatedAt: normalizeTimestamp(conv.lastMessage?.timestamp || conv.updatedAt)
      }));


      // ✅ Leer conteos no leídos guardados en localStorage (persisten entre recargas)
      let storedUnread = {};
      try { storedUnread = JSON.parse(localStorage.getItem("voia_admin_unread") || "{}"); } catch (e) {}

      setConversationList(prevList => {

        const merged = fetchedConversations.map(conv => {
          // No sobrescribir updatedAt si existe en prevList y es más reciente
          const existing = prevList.find(c => String(c.id) === String(conv.id));
          const existingNormalized = existing ? normalizeTimestamp(existing.updatedAt) : null;
          const convNormalized = normalizeTimestamp(conv.updatedAt);
          const useExisting = existingNormalized && new Date(existingNormalized) > new Date(convNormalized);

          // ✅ CRÍTICO: Preservar unreadCount del frontend si es mayor
          // También usar localStorage como fallback cuando prevList está vacío (primera carga/recarga)
          const frontendUnread = Math.max(existing?.unreadCount || 0, storedUnread[conv.id] || 0);
          const backendUnread = conv.unreadCount || conv.unreadAdminMessages || 0;
          const maxUnread = Math.max(frontendUnread, backendUnread);
          
          
          if (conv.id === '738') {
          }
          
          if (useExisting) {
            return { ...conv, updatedAt: existingNormalized, unreadCount: maxUnread };
          } else {
            return { ...conv, updatedAt: convNormalized, unreadCount: maxUnread };
          }
        });
        
        prevList.forEach(conv => {
          if (!merged.some(c => c.id === conv.id)) merged.push(conv);
        });
        
        // ✅ Ordenar: online primero, luego no leídos, luego más recientes
        const sorted = merged.sort(sortConversations);

        const pos738 = sorted.findIndex(c => c.id === '738');
        if (pos738 !== -1) {
        }

        return sorted;
      });
      
      const initialIaPausedMap = {};
      fetchedConversations.forEach(conv => {
        initialIaPausedMap[conv.id] = !conv.isWithAI;
      });
      setIaPausedMap(initialIaPausedMap);
      setLoadError(null);
    } catch (error) {
      console.error("❌ [FetchConversations] Error:", error);
      
      // ✅ Manejar diferentes tipos de error
      let errorMsg = 'Error al cargar las conversaciones. Intenta nuevamente.';
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'La solicitud tardó demasiado tiempo. El servidor podría estar ocupado o tu sesión expiró.';
        console.warn('⚠️ [FetchConversations] Timeout - verificando token...');
        
        // Si hay timeout, verificar si el token está vencido
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const base64Payload = token.split('.')[1];
            const payload = JSON.parse(atob(base64Payload));
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
              errorMsg = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
              // Cerrar SignalR y limpiar sesión
              const conn = connectionRef.current;
              if (conn && (conn.state === "Connected" || conn.state === "Connecting")) {
                conn.stop().catch(() => {});
              }
              setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/authentication/sign-in';
              }, 3000);
            }
          } catch (e) {
            console.error('❌ Error verificando token:', e);
          }
        }
      } else if (error.message === 'Network Error') {
        errorMsg = 'No se pudo conectar al servidor. Verifica que el backend esté en ejecución.';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMsg = 'Tu sesión ha expirado. Redirigiendo al login...';
        // El interceptor de axios debería manejar esto, pero por si acaso:
        setTimeout(() => {
          window.location.href = '/authentication/sign-in';
        }, 2000);
      }
      
      setLoadError(errorMsg);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchConversations();
    };
    fetchData();
  }, [isAuthenticated]);

  // Re-fetch conversations after SignalR connects to ensure unread counts are fresh from DB.
  // The REST fetch and initialconversations SignalR event may race; a 1.5s delayed re-fetch
  // guarantees both have settled and unread badge counts reflect the actual DB state.
  useEffect(() => {
    if (!isConnected) return;
    const timer = setTimeout(() => { fetchConversations(); }, 1500);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // ✅ Persistir conteos no leídos en localStorage para sobrevivir recargas de página
  useEffect(() => {
    if (conversationList.length === 0) return;
    try {
      const counts = {};
      conversationList.forEach(c => { if (c.unreadCount > 0) counts[c.id] = c.unreadCount; });
      localStorage.setItem("voia_admin_unread", JSON.stringify(counts));
    } catch (e) {}
  }, [conversationList]);

  const handleSelectConversation = async (conv) => {
    const idStr = `${conv.id}`;
    
    // ✅ CRÍTICO: Unirse al grupo de SignalR para recibir mensajes en tiempo real
    if (connectionRef.current?.state === "Connected") {
      try {
        await connectionRef.current.invoke("JoinRoom", Number(idStr));
      } catch (error) {
        console.error(`❌ [handleSelectConversation] Error al unirse al grupo ${idStr}:`, error);
      }
    } else {
      console.warn(`⚠️ [handleSelectConversation] SignalR no conectado, no se puede unir al grupo ${idStr}`);
    }
    
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
    
    // ✅ CRÍTICO: Marcar conversación como leída en el frontend
    setConversationList((prevList) =>
      prevList.map((c) => (c.id === idStr ? { ...c, unreadCount: 0 } : c))
    );
    setOpenTabs((prev) => prev.map((tab) => (tab.id === idStr ? { ...tab, unreadCount: 0 } : tab)));

    // ✅ Eliminar del localStorage para que no reaparezca tras recargar
    try {
      const stored = JSON.parse(localStorage.getItem("voia_admin_unread") || "{}");
      delete stored[idStr];
      localStorage.setItem("voia_admin_unread", JSON.stringify(stored));
    } catch (e) {}

    // ✅ CRÍTICO: Marcar mensajes como leídos en el backend
    if (conv.unreadCount > 0) {
      try {
        await markMessagesAsRead(conv.id);
      } catch (error) {
        console.warn(`⚠️ [handleSelectConversation] Error marcando mensajes como leídos:`, error);
      }
    }

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

      // Invalidar caché al abrir para forzar carga fresca con todas las respuestas (incl. predefinidas de IA)
      messageCache.current.delete(idStr);
      const cached = null; // Siempre recargar para obtener respuestas predefinidas de IA
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
        // Priorizar getMessagesByConversationId (Admin) para historial completo (bot, user, admin)
        // Luego history (AllowAnonymous) y grouped como fallback
        let historyArray = [];
        const byConv = await getMessagesByConversationId(conv.id);
        if (Array.isArray(byConv) && byConv.length > 0) {
          historyArray = byConv.map((m) => {
            let fr = (m.fromRole || m.sender || m.Sender || "user").toString().toLowerCase();
            if (fr !== "admin" && fr !== "bot" && fr !== "user") fr = "user";
            
            // ✅ CRÍTICO: Procesar archivos/imágenes para mensajes históricos
            let files = Array.isArray(m.files) ? m.files : [];
            const images = Array.isArray(m.images) ? m.images : [];
            // Fallback: si no hay files array pero hay campos directos de archivo, construir array
            if (files.length === 0 && m.fileUrl && m.fileName) {
              files = [{ fileName: m.fileName, fileType: m.fileType, fileUrl: m.fileUrl }];
            }
            const hasFiles = files.length > 0;
            const hasImages = images.length > 0;
            
            return {
              ...m,
              id: String(m.id ?? `${idStr}-${m.timestamp || Date.now()}`),
              text: m.text ?? m.messageText ?? "",
              timestamp: m.timestamp ?? m.createdAt,
              fromRole: fr,
              fromId: m.fromId ?? null,
              fromName: m.fromName ?? null,
              files: files,  // ✅ Preservar archivos
              images: images, // ✅ Preservar imágenes 
              hasFiles: hasFiles,
              hasImages: hasImages
            };
          }).map(m => ({
            ...m,
            timestamp: normalizeTimestamp(m.timestamp ?? m.createdAt)
          })).sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          });
        }
        if (historyArray.length === 0) {
          const historyResponse = await getConversationHistory(conv.id);
          const raw = historyResponse?.history || historyResponse?.History
            || historyResponse?.conversationDetails?.history || historyResponse?.conversationDetails?.History
            || (Array.isArray(historyResponse) ? historyResponse : []);
          historyArray = Array.isArray(raw) ? raw : [];
        }

        if (Array.isArray(historyArray) && historyArray.length > 0) {
          const historyNormalized = historyArray.map((msg) => {
            const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
            const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
            let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? msg.sender ?? "user";
            try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
            let fromRole = (fromRoleRaw || "").toLowerCase();
            if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") fromRole = "user";
            
            // ✅ CRÍTICO: Procesar archivos/imágenes para mensajes históricos  
            let files = Array.isArray(msg.files) ? msg.files : [];
            const images = Array.isArray(msg.images) ? msg.images : [];
            // Fallback: si no hay files array pero hay campos directos de archivo, construir array
            if (files.length === 0 && (msg.fileUrl || msg.FileUrl) && (msg.fileName || msg.FileName)) {
              files = [{ 
                fileName: msg.fileName || msg.FileName, 
                fileType: msg.fileType || msg.FileType, 
                fileUrl: msg.fileUrl || msg.FileUrl 
              }];
            }
            const hasFiles = files.length > 0;
            const hasImages = images.length > 0;
            
            return { 
              ...msg, 
              id: String(id), 
              text, 
              fromRole, 
              fromId: msg.fromId ?? msg.FromId, 
              fromName: msg.fromName ?? msg.FromName,
              files: files,  // ✅ Preservar archivos
              images: images, // ✅ Preservar imágenes
              hasFiles: hasFiles,
              hasImages: hasImages
            };
          });
          // Normalizar timestamps para sorting consistente
          const timestampNormalized = historyNormalized.map(m => ({
            ...m,
            timestamp: normalizeTimestamp(m.timestamp ?? m.createdAt)
          }));
          const merged = timestampNormalized.sort((a, b) => {
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            return timeA - timeB;
          });
          messageCache.current.set(idStr, merged);
          const visible = Math.min(DEFAULT_VISIBLE_ON_OPEN, merged.length);
          visibleCounts.current.set(idStr, visible);
          messageCursor.current.set(idStr, { hasMore: false, nextBefore: null });
          setMessages((prev) => ({ ...prev, [idStr]: merged.slice(-visible) }));
          if (conv.unreadCount > 0) {
            try { await markMessagesAsRead(conv.id); } catch (e) { /* ignore */ }
          }
        } else {
          // Si history viene vacío, usar grouped (paginado por día)
          const unread = Number(conv.unreadCount || 0);
          const MIN_INITIAL = 10;
          const DEFAULT_INITIAL = 20;
          const MAX_INITIAL = 25;
          let initialLimit = unread > 0 ? Math.min(Math.max(unread, MIN_INITIAL), MAX_INITIAL) : DEFAULT_INITIAL;
          const grouped = await getMessagesGrouped(conv.id, null, initialLimit);
        // Server now provides days newest-first (orderedNewestFirst=true). Do not reverse on client.
  if (grouped && Array.isArray(grouped.days) && grouped.days.length > 0) {
          // Debug: log counts per day to help troubleshoot missing dividers / all-loaded behavior
          try {
            const counts = grouped.days.map(d => ({ date: d.date, label: d.label, count: Array.isArray(d.messages) ? d.messages.length : 0 }));
          } catch (e) { /* ignore */ }
          const flattened = [];
          grouped.days.forEach((day) => {
            flattened.push({ id: `day-divider-${conv.id}-${day.date}`, __dayDivider: true, label: day.label, timestamp: day.date });
            const msgs = Array.isArray(day.messages) ? day.messages : [];
            msgs.forEach((msg, msgIdx) => {
              const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
              const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
              let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? "user";
              try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
              let fromRole = (fromRoleRaw || "").toLowerCase();
              // Detectar usuario público
              const publicUserId = msg.publicUserId || msg.PublicUserId;
              if (publicUserId) {
                fromRole = "user";
              } else if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") {
                fromRole = "user";
              }
              const from = msg.from ?? msg.From ?? null;
              const fromId = msg.fromId ?? msg.FromId ?? null;
              const fromName = msg.fromName ?? msg.FromName ?? null;
              
              // ✅ Procesar archivos/imágenes para SignalR (igual que historial)
              let files = Array.isArray(msg.files) ? msg.files : [];
              const images = Array.isArray(msg.images) ? msg.images : [];
              // Fallback: si no hay files array pero hay campos directos de archivo, construir array
              if (files.length === 0 && (msg.fileUrl || msg.FileUrl) && (msg.fileName || msg.FileName)) {
                files = [{ 
                  fileName: msg.fileName || msg.FileName, 
                  fileType: msg.fileType || msg.FileType, 
                  fileUrl: msg.fileUrl || msg.FileUrl 
                }];
              }
              const hasFiles = files.length > 0;
              const hasImages = images.length > 0;
              flattened.push({ 
                ...msg, 
                id: String(id), 
                text, 
                fromRole, 
                from, 
                fromId, 
                fromName, 
                publicUserId,
                files: files,    // ✅ Preservar archivos
                images: images,  // ✅ Preservar imágenes
                hasFiles: hasFiles,
                hasImages: hasImages
              });
            });
          });

          // Debug: report flattened window shape (first/last items, days order)
          try {
            console.debug(`🔍 [handleSelectConversation] conv=${conv.id} flattened count=${flattened.length}`, {
              first: flattened[0],
              last: flattened[flattened.length - 1],
            });
          } catch (e) { /* ignore debug errors */ }

          // Merge fetched grouped history with any existing messages (SignalR optimistic / preview)
          setMessages((prev) => {
            const existing = prev[idStr] || [];
            const map = new Map();
            
            // 📦 PRIORIDAD: Preservar archivos de mensajes SignalR si el historial no los tiene
            flattened.forEach((histMsg) => {
              const key = String(histMsg.id);
              map.set(key, histMsg);
            });
            
            existing.forEach((signalRMsg) => {
              const key = String(signalRMsg.id);
              const histMsg = map.get(key);
              
              if (histMsg) {
                // Si el mensaje del historial NO tiene archivos pero SignalR sí
                const histHasFiles = histMsg.files?.length > 0 || histMsg.images?.length > 0;
                const signalRHasFiles = signalRMsg.files?.length > 0 || signalRMsg.images?.length > 0;
                
                if (!histHasFiles && signalRHasFiles) {
                  // Combinar datos del historial con archivos de SignalR
                  map.set(key, {
                    ...histMsg,
                    files: signalRMsg.files || [],
                    images: signalRMsg.images || [],
                    hasFiles: signalRMsg.hasFiles,
                    hasImages: signalRMsg.hasImages
                  });
                }
              } else {
                // Mensaje solo existe en SignalR (optimistic)
                map.set(key, signalRMsg);
              }
            });
            
            // Normalize timestamps for consistent sorting
            const normalized = Array.from(map.values()).map(m => {
              const originalTimestamp = m.timestamp || m.Timestamp || m.createdAt || m.CreatedAt;
              return {
                ...m,
                timestamp: normalizeTimestamp(originalTimestamp)
              };
            });
            
            // Sort ascending (oldest first) by normalized timestamp
            const merged = normalized.sort((a, b) => {
              const timeA = new Date(a.timestamp).getTime();
              const timeB = new Date(b.timestamp).getTime();
              return timeA - timeB;
            });
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
              console.debug(`🗂️ [handleSelectConversation] conv=${conv.id} desiredVisible=${desiredVisible} visibleSliceCount=${visibleSlice.length}`, {
                visibleFirst: visibleSlice[0],
                visibleLast: visibleSlice[visibleSlice.length - 1],
              });
            } catch (e) { /* ignore */ }

            // ✅ Ya NO es necesario buscar archivos por separado: el backend ahora incluye
            // los datos de ChatUploadedFile directamente en cada mensaje vía Include().

            // return only the visible slice to render (recent messages)
            return { ...prev, [idStr]: visibleSlice };
          });
        } else {
          // Fallback: use the paged endpoint if grouped not available
          const paged = await getMessagesPaginated(conv.id, null, initialLimit);
          if (paged && Array.isArray(paged.messages) && paged.messages.length > 0) {
            const normalized = paged.messages.map((msg) => {
              const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
              const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
              let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? "user";
              try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
              let fromRole = (fromRoleRaw || "").toLowerCase();
              const publicUserId = msg.publicUserId || msg.PublicUserId;
              if (publicUserId) {
                fromRole = "user";
              } else if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") {
                fromRole = "user";
              }
              const fromId = msg.fromId ?? msg.FromId ?? null;
              const fromName = msg.fromName ?? msg.FromName ?? null;
              // ✅ Procesar archivos
              let files = Array.isArray(msg.files) ? msg.files : [];
              if (files.length === 0 && (msg.fileUrl || msg.FileUrl) && (msg.fileName || msg.FileName)) {
                files = [{ fileName: msg.fileName || msg.FileName, fileType: msg.fileType || msg.FileType, fileUrl: msg.fileUrl || msg.FileUrl }];
              }
              return { ...msg, id: String(id), text, fromRole, fromId, fromName, publicUserId, files: files.length > 0 ? files : undefined };
            });
            setMessages((prev) => {
              const existing = prev[idStr] || [];
              const map = new Map();
              normalized.forEach((m) => map.set(String(m.id), m));
              existing.forEach((m) => map.set(String(m.id), m));
              // Normalizar timestamps
              const timestampNormalized = Array.from(map.values()).map(m => ({
                ...m,
                timestamp: normalizeTimestamp(m.timestamp || m.Timestamp || m.createdAt || m.CreatedAt)
              }));
              const merged = timestampNormalized.sort((a, b) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return timeA - timeB;
              });
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
            // Fallback: usar getConversationHistory (mismo endpoint que móvil) para obtener historial completo (bot, user, admin)
            console.warn(`⚠️ [Conversations] grouped/paged vacío para conv ${conv.id}, intentando getConversationHistory (history)`);
            try {
              const historyResponse = await getConversationHistory(conv.id);
              const historyArray = historyResponse?.history || historyResponse?.History || [];
              if (Array.isArray(historyArray) && historyArray.length > 0) {
                const historyNormalized = historyArray.map((msg) => {
                  const id = msg.id ?? msg.Id ?? `${idStr}-${Date.now()}`;
                  const text = msg.text ?? msg.Text ?? msg.messageText ?? "";
                  let fromRoleRaw = msg.fromRole ?? msg.FromRole ?? msg.from ?? msg.From ?? "user";
                  try { fromRoleRaw = String(fromRoleRaw); } catch (e) { fromRoleRaw = "user"; }
                  let fromRole = (fromRoleRaw || "").toLowerCase();
                  if (fromRole !== "admin" && fromRole !== "bot" && fromRole !== "user") fromRole = "user";
                  // ✅ Procesar archivos
                  let files = Array.isArray(msg.files) ? msg.files : [];
                  if (files.length === 0 && (msg.fileUrl || msg.FileUrl) && (msg.fileName || msg.FileName)) {
                    files = [{ fileName: msg.fileName || msg.FileName, fileType: msg.fileType || msg.FileType, fileUrl: msg.fileUrl || msg.FileUrl }];
                  }
                  return { ...msg, id: String(id), text, fromRole, fromId: msg.fromId ?? msg.FromId, fromName: msg.fromName ?? msg.FromName, files: files.length > 0 ? files : undefined };
                });
                setMessages((prev) => {
                  const existing = prev[idStr] || [];
                  const map = new Map();
                  existing.forEach((m) => map.set(String(m.id), m));
                  historyNormalized.forEach((m) => map.set(String(m.id), m));
                  // Normalizar timestamps
                  const timestampNormalized = Array.from(map.values()).map(m => ({
                    ...m,
                    timestamp: normalizeTimestamp(m.timestamp || m.Timestamp || m.createdAt || m.CreatedAt)
                  }));
                  const merged = timestampNormalized.sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    return timeA - timeB;
                  });
                  messageCache.current.set(idStr, merged);
                  return { ...prev, [idStr]: merged };
                });
              } else {
                // Último recurso: /api/Messages/by-conversation
                const fb = await getMessagesByConversationId(conv.id);
                if (Array.isArray(fb) && fb.length > 0) {
                  const fallbackNormalized = fb.map((msg) => ({ ...msg, id: msg.id ? String(msg.id) : `${idStr}-${Date.now()}`, text: msg.text || msg.messageText || "" }));
                  setMessages((prev) => {
                    const existing = prev[idStr] || [];
                    const map = new Map();
                    existing.forEach((m) => map.set(String(m.id), m));
                    fallbackNormalized.forEach((m) => map.set(String(m.id), m));
                    // Normalizar timestamps
                    const timestampNormalized = Array.from(map.values()).map(m => ({
                      ...m,
                      timestamp: normalizeTimestamp(m.timestamp || m.Timestamp || m.createdAt || m.CreatedAt)
                    }));
                    const merged = timestampNormalized.sort((a, b) => {
                      const timeA = new Date(a.timestamp).getTime();
                      const timeB = new Date(b.timestamp).getTime();
                      return timeA - timeB;
                    });
                    messageCache.current.set(idStr, merged);
                    return { ...prev, [idStr]: merged };
                  });
                }
              }
            } catch (fbErr) {
              console.error(`❌ [fallback] error loading messages for conv ${conv.id}`, fbErr);
              const cachedNow = messageCache.current.get(idStr);
              if (cachedNow) setMessages((prev) => ({ ...prev, [idStr]: cachedNow }));
            }
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
  const grouped = await getMessagesGrouped(conversationId, before, 50);
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
          // ✅ Procesar archivos para mensajes paginados
          let files = Array.isArray(msg.files) ? msg.files : [];
          if (files.length === 0 && (msg.fileUrl || msg.FileUrl) && (msg.fileName || msg.FileName)) {
            files = [{ 
              fileName: msg.fileName || msg.FileName, 
              fileType: msg.fileType || msg.FileType, 
              fileUrl: msg.fileUrl || msg.FileUrl 
            }];
          }
          flattened.push({ ...msg, id: String(id), text, fromRole, fromId, fromName, files: files.length > 0 ? files : undefined });
        });
      });

      // Debug: show what older window contained
      try {
      } catch (e) { /* ignore */ }

      // Prepend flattened window to cache preserving existing messages
      setMessages((prev) => {
        const existing = prev[idStr] || [];
        const map = new Map();
        // add incoming older window first
        flattened.forEach((m) => map.set(String(m.id || `day-${Math.random().toString(36).slice(2,6)}`), m));
        // then existing messages
        existing.forEach((m) => map.set(String(m.id), m));
        
        // Normalize timestamps for consistent sorting
        const normalized = Array.from(map.values()).map(m => ({
          ...m,
          timestamp: normalizeTimestamp(m.timestamp || m.Timestamp || m.createdAt || m.CreatedAt)
        }));
        
        // Sort ascending (oldest first) by normalized timestamp
        const merged = normalized.sort((a, b) => {
          const timeA = new Date(a.timestamp).getTime();
          const timeB = new Date(b.timestamp).getTime();
          return timeA - timeB;
        });
        
        messageCache.current.set(idStr, merged);
        // Debug: after prepend, show sizes and visible window (compute newVisible first)
        try {
          const addedMessages = flattened.filter((x) => !x.__dayDivider).length;
          const currentVisible = visibleCounts.current.get(idStr) || Math.min(DEFAULT_VISIBLE_ON_OPEN, existing.length);
          const newVisible = Math.min(merged.length, currentVisible + addedMessages);
          const first = merged[0];
          const last = merged[merged.length - 1];
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
      __optimistic: true, // Marcar como optimista para identificarlo después
      __tempId: messageId, // Guardar ID temporal para reemplazar
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
    const conv = conversationList.find((c) => c.id === id);
    if (!conv) return;
    const currentlyBlocked = conv.blocked || false;
    setBlockDialogConvId(id);
    setBlockDialogIsBlocked(currentlyBlocked);
    setBlockDialogReason("");
    setBlockDialogOpen(true);
  };

  const handleBlockConfirm = async () => {
    if (!blockDialogConvId) return;
    setBlockDialogLoading(true);
    try {
      const shouldBlock = !blockDialogIsBlocked;
      const result = await blockUserByConversation(
        blockDialogConvId,
        shouldBlock,
        shouldBlock ? blockDialogReason || null : null
      );
      if (result) {
        // Update all affected conversations in local state
        // Convert IDs to strings since conv.id is stored as string in frontend
        const rawIds = result.affectedConversations || [blockDialogConvId];
        const affectedIds = rawIds.map((id) => String(id));
        setConversationList((prev) =>
          prev.map((conv) =>
            affectedIds.includes(String(conv.id))
              ? { ...conv, blocked: shouldBlock, status: shouldBlock ? "bloqueada" : "activa" }
              : conv
          )
        );
      }
    } catch (err) {
      console.error("❌ Error al bloquear/desbloquear usuario:", err);
    } finally {
      setBlockDialogLoading(false);
      setBlockDialogOpen(false);
    }
  };

  const selectedConversation = conversationList.find((conv) => conv.id === activeTab)
    || trashConversations.find((conv) => String(conv.id) === String(activeTab));
  const selectedMessages = messages[activeTab] || [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      
      {/* ✅ Alerta visible cuando hay error de sesión o conectividad */}
      {loadError && (
        <SoftBox px={2} pt={2}>
          <Alert 
            severity={loadError.includes('sesión') || loadError.includes('Sesión') ? "error" : "warning"}
            sx={{ mb: 2 }}
          >
            <AlertTitle>
              {loadError.includes('sesión') || loadError.includes('Sesión') ? 
                "⏱️ Sesión Expirada" : 
                "⚠️ Error de Conexión"}
            </AlertTitle>
            {loadError}
          </Alert>
        </SoftBox>
      )}
      
      <SoftBox px={2} pt={loadError ? 0 : 2}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4} lg={4}>
            {showTrash ? (
              <Card sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", borderRadius: 0, overflow: "auto" }}>
                <TrashView
                  conversations={trashConversations}
                  onRestore={handleRestoreConversation}
                  onDelete={handleDeleteConversationPermanently}
                  onEmptyTrash={handleEmptyTrash}
                  onOpen={handleSelectTrashConversation}
                  onBack={async () => { setOpenTabs([]); setActiveTab(null); setShowTrash(false); await fetchConversations(); }}
                />
              </Card>
            ) : (
              <Card sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column", borderRadius: 0 }}>
                <SoftBox p={2} sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                  <ConversationList
                    conversations={conversationList}
                    loading={loadingList}
                    error={loadError}
                    onRetry={fetchConversations}
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
                        // ✅ handleSelectConversation ya carga el historial completo con archivos incluidos
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
                    userName={`Sesión ${selectedConversation.sessionNumber ?? selectedConversation.id}`}
                    isTyping={typingState[activeTab]?.isTyping ?? false}
                    typingSender={typingState[activeTab]?.sender}
                    typingConversationId={activeTab}
                    onToggleIA={() => handleToggleIA(activeTab)}
                    iaPaused={iaPausedMap[activeTab] ?? false}
                    onSendAdminMessage={handleSendAdminMessage}
                    onStatusChange={(newStatus) => handleUpdateConversationStatus(activeTab, newStatus)}
                    onBlock={() => handleBlockUser(activeTab)}
                    status={selectedConversation?.status || "activa"}
                    blocked={!!(selectedConversation?.blocked && !selectedConversation?.activeMobileSession)}
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
                    onMovedToTrash={handleMovedToTrash}
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
      {/* 🔒 Confirmation dialog for blocking/unblocking */}
      <Dialog open={blockDialogOpen} onClose={() => !blockDialogLoading && setBlockDialogOpen(false)}>
        <DialogTitle>
          {blockDialogIsBlocked ? "Desbloquear usuario" : "Bloquear usuario"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {blockDialogIsBlocked
              ? "¿Estás seguro de desbloquear a este usuario? Podrá enviar mensajes nuevamente en todas sus conversaciones."
              : "¿Estás seguro de bloquear a este usuario? Se bloqueará en TODAS sus conversaciones con este bot."}
          </DialogContentText>
          {!blockDialogIsBlocked && (
            <textarea
              autoFocus
              placeholder="Razón del bloqueo (opcional)"
              value={blockDialogReason}
              onChange={(e) => setBlockDialogReason(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #d2d6da",
                fontFamily: "inherit",
                fontSize: "14px",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#17c1e8")}
              onBlur={(e) => (e.target.style.borderColor = "#d2d6da")}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)} disabled={blockDialogLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleBlockConfirm}
            color={blockDialogIsBlocked ? "success" : "error"}
            variant="contained"
            disabled={blockDialogLoading}
          >
            {blockDialogLoading
              ? "Procesando..."
              : blockDialogIsBlocked
              ? "Desbloquear"
              : "Bloquear"}
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default Conversations;