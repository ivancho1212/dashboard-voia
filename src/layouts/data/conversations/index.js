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
} from "services/conversationsService";
import { useAuth } from "contexts/AuthContext";

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

  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [loadingConversationId, setLoadingConversationId] = useState(null);

  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? user?.userId ?? user?.sub;
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
        // SignalR JS recibe nombres en minúsculas; registrar en minúsculas para que los handlers se invoquen
        connection.on("initialconversations", (data) => {
          console.log('📥 [InitialConversations] Recibido con', data?.length || 0, 'conversaciones');
          if (Array.isArray(data)) {
            setConversationList((prevList) => {
              console.log('📥 [InitialConversations] prevList tiene', prevList.length, 'conversaciones');
              
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
                    console.log('📥 [InitialConversations] Procesando 738:');
                    console.log('  - prevUpdatedAt (NORMALIZADO):', prevUpdatedAt);
                    console.log('  - backendUpdatedAt (NORMALIZADO):', backendUpdatedAt);
                    console.log('  - useExisting:', useExisting);
                  }
                  
                  backendMap.delete(prevConv.id); // Marcar como procesado
                  
                  // ✅ CRÍTICO: Preservar unreadCount del frontend si es mayor (puede haber mensajes recibidos en tiempo real)
                  const frontendUnread = prevConv.unreadCount || 0;
                  const backendUnread = backend.unreadCount || backend.unreadAdminMessages || 0;
                  const maxUnread = Math.max(frontendUnread, backendUnread);
                  
                  console.log(`🔄 [InitialConversations] Conv ${prevConv.id}: frontend=${frontendUnread}, backend=${backendUnread}, max=${maxUnread}`);
                  
                  if (useExisting) {
                    return { ...prevConv, unreadCount: maxUnread };
                  } else {
                    return { ...backend, updatedAt: backendUpdatedAt, unreadCount: maxUnread };
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
              
              // Ordenar: más recientes primero
              const sorted = merged.sort((a, b) => {
                const timeA = new Date(a.updatedAt).getTime();
                const timeB = new Date(b.updatedAt).getTime();
                return timeB - timeA;
              });
              
              console.log('📥 [InitialConversations] Top 5 después de merge:', sorted.slice(0, 5).map(c => ({ id: c.id, updatedAt: c.updatedAt })));
              const pos738 = sorted.findIndex(c => c.id === '738');
              if (pos738 !== -1) {
                console.log(`📥 [InitialConversations] Conversación 738 quedó en posición: ${pos738 + 1}`);
              }
              return sorted;
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
          console.log("🆕 Nueva conversación recibida:", conv);
          // Convertir id a string para evitar errores de tipo
          // ✅ CRÍTICO: Usar fecha actual como updatedAt para garantizar que aparezca primero
          const convStr = { 
            ...conv, 
            id: String(conv.id),
            updatedAt: new Date().toISOString() // Forzar fecha actual para nuevas conversaciones
          };
          // Cargar mensajes de la conversación recién creada
          import("services/conversationsService").then(({ getMessagesByConversationId }) => {
            getMessagesByConversationId(convStr.id).then((msgs) => {
              // Actualizar mensajes en el estado
              setMessages((prev) => ({ ...prev, [convStr.id]: msgs || [] }));
              // Actualizar el último mensaje en la conversación
              const lastMsg = msgs && msgs.length > 0 ? msgs[msgs.length - 1].text : "";
              setConversationList((prevList) => {
                // Evitar duplicados por id
                let updated;
                if (prevList.some((c) => String(c.id) === String(convStr.id))) {
                  updated = prevList.map(c => c.id === convStr.id ? { ...c, lastMessage: lastMsg, updatedAt: new Date().toISOString() } : c);
                } else {
                  updated = [{ ...convStr, lastMessage: lastMsg }, ...prevList];
                }
                // ✅ Reordenar: conversaciones más recientes primero
                return updated.sort((a, b) => {
                  const timeA = new Date(a.updatedAt).getTime();
                  const timeB = new Date(b.updatedAt).getTime();
                  return timeB - timeA;
                });
              });
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

        connection.on("newconversationormessage", (msg) => {
          console.log('📨 [NewConversationOrMessage] Evento recibido:', msg);
          
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
            // 📎 DEBUG: Log mensaje recibido
            console.log('📨 [SignalR] Mensaje recibido para conversación', convId, ':', {
              id: newMsg.id,
              text: newMsg.text?.substring(0, 30),
              hasFiles: newMsg.files?.length > 0,
              hasImages: newMsg.images?.length > 0,
              fromRole: newMsg.fromRole
            });
            
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
                  console.log('📎 [SignalR] Preservando archivos del mensaje nuevo:', {
                    newFiles: normalizedMsg.files?.length || 0,
                    newImages: normalizedMsg.images?.length || 0
                  });
                  // Priorizar mensaje con archivos
                  uniqueMap.set(key, normalizedMsg);
                } else {
                  console.log('🔄 [SignalR] Manteniendo mensaje existente (ya tiene archivos o más completo)');
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
            console.log('📋 [NewConversationOrMessage] Actualizando lista para convId:', convId);
            console.log('📋 Fecha actual para updatedAt:', currentTimestamp);
            
            // Buscar la conversación antes de actualizar
            const targetConv = prevList.find(c => `${c.id}` === convId);
            console.log('📋 Conversación ANTES de actualizar:', targetConv ? { id: targetConv.id, updatedAt: targetConv.updatedAt, unreadCount: targetConv.unreadCount } : 'NO ENCONTRADA');
            
            // ✅ Solo incrementar unreadCount si es mensaje del usuario público
            const shouldIncrementUnread = newMsg.fromRole === "user";
            console.log('🔵 [UnreadCount] fromRole:', newMsg.fromRole, '| shouldIncrement:', shouldIncrementUnread, '| current:', targetConv?.unreadCount || 0);
            console.log('🔵 [UnreadCount] mensaje completo:', { id: newMsg.id, text: newMsg.text?.substring(0, 30), fromRole: newMsg.fromRole, from: newMsg.from });
            
            const updated = prevList.map((conv) => {
              if (`${conv.id}` === convId) {
                const newUnreadCount = shouldIncrementUnread ? (conv.unreadCount || 0) + 1 : conv.unreadCount;
                console.log(`🔵 [UnreadCount UPDATE] Conv ${convId}: ${conv.unreadCount || 0} → ${newUnreadCount}`);
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
            console.log('📋 Conversación DESPUÉS de actualizar:', updatedTarget ? { id: updatedTarget.id, updatedAt: updatedTarget.updatedAt, unreadCount: updatedTarget.unreadCount } : 'NO ENCONTRADA');
            
            // ✅ Reordenar: conversaciones más recientes primero
            const sorted = updated.sort((a, b) => {
              const timeA = new Date(a.updatedAt).getTime();
              const timeB = new Date(b.updatedAt).getTime();
              return timeB - timeA;
            });
            
            // Mostrar top 5 después de ordenar
            console.log('📋 TOP 5 después de ordenar:', sorted.slice(0, 5).map(c => ({ id: c.id, updatedAt: c.updatedAt })));
            
            // Encontrar posición de la conversación actualizada
            const position = sorted.findIndex(c => `${c.id}` === convId);
            console.log(`📋 Conversación ${convId} está en posición: ${position + 1}`);
            
            return sorted;
          });
        });

        // ✅ CRÍTICO: Escuchar evento "ReceiveMessage" para mensajes en tiempo real
        connection.on("receivemessage", (msg) => {
            console.log('📨 [ReceiveMessage] Mensaje recibido en tiempo real:', msg);
            
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
                  console.log('🔄 [ReceiveMessage] Reemplazando mensaje optimista con mensaje definitivo del servidor', {
                    optimisticId: existing[optimisticIndex].id,
                    definitiveId: newMsg.id
                  });
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
                console.log('⚠️ [ReceiveMessage] Mensaje duplicado ignorado, id:', newMsg.id);
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
              
              // Log para debugging
              console.log('📊 [ReceiveMessage] Orden de mensajes:', merged.map(m => ({
                id: m.id,
                from: m.fromRole,
                text: m.text?.substring(0, 30) + '...',
                timestamp: m.timestamp
              })));
              
              // Actualizar cache
              try {
                messageCache.current.set(convId, merged);
              } catch (e) {}
              
              console.log('✅ [ReceiveMessage] Mensaje agregado a conversación', convId, '- Total mensajes:', merged.length);
              return { ...prev, [convId]: merged };
            });

            // Actualizar último mensaje en la lista de conversaciones (SIN incrementar unreadCount)
            setConversationList((prevList) => {
              const targetConv = prevList.find(c => `${c.id}` === convId);
              console.log('📨 [ReceiveMessage] Actualizando lastMessage SIN tocar unreadCount:', targetConv ? { id: targetConv.id, unreadCount: targetConv.unreadCount } : 'NO ENCONTRADA');
              
              // ✅ IMPORTANTE: NO incrementamos unreadCount aquí - solo en newconversationormessage
              // Esto evita el doble conteo cuando ambos eventos se disparan para el mismo mensaje
              
              const updated = prevList.map((conv) => {
                if (`${conv.id}` === convId) {
                  console.log(`📨 [ReceiveMessage] Conv ${convId}: Manteniendo unreadCount en ${conv.unreadCount || 0}`);
                  return { 
                    ...conv, 
                    // ✅ Mantener unreadCount sin cambios - solo actualizar mensaje y timestamp
                    updatedAt: new Date().toISOString(), 
                    lastMessage: newMsg.text || (hasImages || hasFiles ? "📷 Imagen o Archivo" : "Nuevo Mensaje") 
                  };
                }
                return conv;
              });
              
              console.log('📨 [ReceiveMessage] lastMessage actualizado, unreadCount preservado');
              
              // ✅ Reordenar: conversaciones más recientes primero
              return updated.sort((a, b) => {
                const timeA = new Date(a.updatedAt).getTime();
                const timeB = new Date(b.updatedAt).getTime();
                return timeB - timeA;
              });
            });
          });

          connection.on("updateconversation", (conv) => {
            if (!conv || !conv.id) return;
            const convId = String(conv.id);
            console.log('[UpdateConversation] recibido:', conv);
            setConversationList((prevList) => {
              const updated = prevList.map((c) =>
                c.id === convId
                  ? { ...c, lastMessage: conv.lastMessage, updatedAt: new Date().toISOString(), status: conv.status, blocked: conv.blocked, isWithAI: conv.isWithAI }
                  : c
              );
              // ✅ Reordenar: conversaciones más recientes primero
              return updated.sort((a, b) => {
                const timeA = new Date(a.updatedAt).getTime();
                const timeB = new Date(b.updatedAt).getTime();
                return timeB - timeA;
              });
            });
            // Fusionar el mensaje recibido por socket con los del backend, evitando duplicados
            if (conv.lastMessage) {
              setMessages((prev) => {
                const existing = prev[convId] || [];
                // Si el array está vacío, espera a que el backend lo llene y luego fusiona
                if (existing.length === 0) {
                  console.log('[UpdateConversation] Mensajes aún no cargados, esperando backend.');
                  return prev;
                }
                // Evitar duplicados por texto y timestamp
                const alreadyExists = existing.some(m => m.text === conv.lastMessage && m.timestamp === conv.updatedAt);
                if (alreadyExists) {
                  console.log('[UpdateConversation] Mensaje ya existe en el chat:', conv.lastMessage);
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
                console.log('[UpdateConversation] Fusionando mensaje al chat:', newMsg);
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
          
          // Verificar si el token está expirado
          const token = localStorage.getItem("token");
          if (token) {
            try {
              const base64Payload = token.split('.')[1];
              const payload = JSON.parse(atob(base64Payload));
              const now = Math.floor(Date.now() / 1000);
              
              if (payload.exp && payload.exp < now) {
                console.error('❌ [SignalR] Token expirado durante reconexión - deteniendo intentos');
                connection.stop().catch(() => {});
                setLoadError('Tu sesión ha expirado. Redirigiendo al login...');
                setTimeout(() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('user');
                  window.location.href = '/authentication/sign-in';
                }, 2000);
              }
            } catch (e) {
              console.error('❌ [SignalR] Error verificando token en reconexión:', e);
            }
          }
        });
        
        connection.onreconnected((connectionId) => {
          console.log('✅ [SignalR] Reconectado exitosamente. ConnectionId:', connectionId);
          setIsConnected(true);
          // Reiniciar la conexión admin
          connection.invoke("JoinAdmin").catch((err) => {
            console.error('❌ [SignalR] Error al rejoin admin:', err);
          });
        });
        
        connection.onclose((error) => {
          console.warn('🔌 [SignalR] Conexión cerrada.', error?.message || '');
          setIsConnected(false);
          
          // Si hay error, verificar si es por token expirado
          if (error) {
            const token = localStorage.getItem("token");
            if (token) {
              try {
                const base64Payload = token.split('.')[1];
                const payload = JSON.parse(atob(base64Payload));
                const now = Math.floor(Date.now() / 1000);
                
                if (payload.exp && payload.exp < now) {
                  console.error('❌ [SignalR] Conexión cerrada por token expirado');
                  setLoadError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                  setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    window.location.href = '/authentication/sign-in';
                  }, 2000);
                }
              } catch (e) {
                console.error('❌ [SignalR] Error verificando token en close:', e);
              }
            }
          }
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
        
        // Verificar si el error es por autenticación
        if (error.message && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          console.error('❌ [SignalR] Error de autenticación detectado');
          setLoadError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/authentication/sign-in';
          }, 2000);
        }
      }
    };

    setupSignalR();

    return () => {
      console.log('🧹 [Cleanup] Limpiando conexión SignalR y estados...');
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
        conn.off("updateconversation");
        conn.off("receivemessage");
      } catch (e) { /* ignore */ }
      
      // ✅ CRÍTICO: Detener conexión sin importar el estado para evitar memory leaks
      try {
        if (conn.state !== "Disconnected") {
          console.log('🔌 [Cleanup] Deteniendo conexión SignalR...');
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
      console.log('✅ [Cleanup] Limpieza completa');
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
        console.log('🔌 [FetchConversations] Cerrando conexión SignalR por falta de token');
        conn.stop().catch(() => {});
      }
      return;
    }
    
    // ✅ Decodificar y verificar expiración del token
    try {
      const base64Payload = token.split('.')[1];
      const payload = JSON.parse(atob(base64Payload));
      const now = Math.floor(Date.now() / 1000);
      
      if (payload.exp && payload.exp < now) {
        console.warn('⚠️ [FetchConversations] Token expirado. exp:', payload.exp, 'now:', now);
        setLoadError('Tu sesión ha expirado. Redirigiendo al login...');
        setLoadingList(false);
        
        // Cerrar conexión SignalR
        const conn = connectionRef.current;
        if (conn && (conn.state === "Connected" || conn.state === "Connecting")) {
          console.log('🔌 [FetchConversations] Cerrando conexión SignalR por token expirado');
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
    } catch (e) {
      console.error('❌ [FetchConversations] Error decodificando token:', e);
      // Continuar de todas formas, el interceptor de axios manejará el error
    }
    
    setLoadingList(true);
    setLoadError(null);
    try {
      console.log('📥 [FetchConversations] Iniciando...');
      const data = await getConversationsWithLastMessage();
      const raw = Array.isArray(data) ? data : (data?.conversations || data?.data || []);
      const fetchedConversations = (Array.isArray(raw) ? raw : []).map((conv) => ({ 
        ...conv, 
        id: String(conv.id), 
        updatedAt: normalizeTimestamp(conv.lastMessage?.timestamp || conv.updatedAt)
      }));
      
      console.log('📥 [FetchConversations] Obtenidas', fetchedConversations.length, 'conversaciones del backend');
      
      setConversationList(prevList => {
        console.log('📥 [FetchConversations] prevList tiene', prevList.length, 'conversaciones');
        
        const merged = fetchedConversations.map(conv => {
          // No sobrescribir updatedAt si existe en prevList y es más reciente
          const existing = prevList.find(c => String(c.id) === String(conv.id));
          const existingNormalized = existing ? normalizeTimestamp(existing.updatedAt) : null;
          const convNormalized = normalizeTimestamp(conv.updatedAt);
          const useExisting = existingNormalized && new Date(existingNormalized) > new Date(convNormalized);
          
          // ✅ CRÍTICO: Preservar unreadCount del frontend si es mayor
          const frontendUnread = existing?.unreadCount || 0;
          const backendUnread = conv.unreadCount || conv.unreadAdminMessages || 0;
          const maxUnread = Math.max(frontendUnread, backendUnread);
          
          console.log(`🔄 [FetchConversations] Conv ${conv.id}: frontend=${frontendUnread}, backend=${backendUnread}, max=${maxUnread}`);
          
          if (conv.id === '738') {
            console.log('📥 [FetchConversations] Procesando 738:');
            console.log('  - Backend updatedAt (NORMALIZADO):', convNormalized);
            console.log('  - Existing updatedAt (NORMALIZADO):', existingNormalized);
            console.log('  - useExisting:', useExisting);
            console.log('  - Frontend unreadCount:', frontendUnread, '| Backend unreadCount:', backendUnread, '| Max:', maxUnread);
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
        
        // ✅ Ordenar conversaciones: más recientes primero
        const sorted = merged.sort((a, b) => {
          const timeA = new Date(a.updatedAt).getTime();
          const timeB = new Date(b.updatedAt).getTime();
          return timeB - timeA; // Descendente: más recientes primero
        });
        
        console.log('📥 [FetchConversations] Top 5 después de merge:', sorted.slice(0, 5).map(c => ({ id: c.id, updatedAt: c.updatedAt })));
        const pos738 = sorted.findIndex(c => c.id === '738');
        if (pos738 !== -1) {
          console.log(`📥 [FetchConversations] Conversación 738 quedó en posición: ${pos738 + 1}`);
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

  const handleSelectConversation = async (conv) => {
    const idStr = `${conv.id}`;
    
    // ✅ CRÍTICO: Unirse al grupo de SignalR para recibir mensajes en tiempo real
    if (connectionRef.current?.state === "Connected") {
      try {
        console.log(`🚪 [handleSelectConversation] Uniéndose al grupo de conversación ${idStr}`);
        await connectionRef.current.invoke("JoinRoom", Number(idStr));
        console.log(`✅ [handleSelectConversation] Unido exitosamente al grupo ${idStr}`);
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
    
    // ✅ CRÍTICO: Marcar mensajes como leídos en el backend
    if (conv.unreadCount > 0) {
      try {
        await markMessagesAsRead(conv.id);
        console.log(`✅ [handleSelectConversation] Mensajes marcados como leídos para conversación ${idStr}`);
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
            
            // 📎 DEBUG: Log estado antes del merge
            console.log(`🗺 [Historial] Merge para conv ${idStr}:`, {
              historicos: flattened.length,
              existentes: existing.length,
              existentesConArchivos: existing.filter(m => m.files?.length > 0 || m.images?.length > 0).length
            });
            
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
                  console.log(`📦 [Merge] Preservando archivos de SignalR para mensaje ${key}:`, {
                    signalRFiles: signalRMsg.files?.length || 0,
                    signalRImages: signalRMsg.images?.length || 0
                  });
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
            
            console.log(`🗺 [Historial] Mensajes finales para conv ${idStr}:`, {
              total: normalized.length,
              conArchivos: normalized.filter(m => m.files?.length > 0 || m.images?.length > 0).length,
              archivosEjemplo: normalized.slice(0, 3).map(m => ({ 
                id: m.id, 
                files: m.files?.length || 0, 
                images: m.images?.length || 0 
              }))
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
              console.debug(`🗂️ [handleSelectConversation] conv=${conv.id} mergedCount=${merged.length} firstTs=${first?.timestamp || first?.Timestamp} lastTs=${last?.timestamp || last?.Timestamp}`);
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
          console.log("🔎 [getMessagesPaginated fallback] payload for conv", conv.id, paged);
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