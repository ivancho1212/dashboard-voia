import { useEffect, useState, useRef } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import connection from "services/signalr";
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

// 👇 Drag and Drop
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// 👇 Nuevo import
import { getConversationsByUser } from "services/botConversationsService";

function Conversations() {
  const tabContainerRef = useRef(null);
  const tabRefs = useRef({});

  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [conversationList, setConversationList] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [messages, setMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [iaPausedMap, setIaPausedMap] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [typingSender, setTypingSender] = useState(null);
  const [typingState, setTypingState] = useState({});

  const userId = 45; // Simulado

  const handleToggleIA = (conversationId) => {
    setIaPausedMap((prev) => ({
      ...prev,
      [conversationId]: !prev[conversationId],
    }));
  };

  useEffect(() => {
    const loadInitialConversations = async () => {
      try {
        const data = await getConversationsByUser(userId);
        setConversationList(
          data.map((c) => ({
            id: c.id,
            alias: c.User?.Name || `Usuario ${String(c.id).slice(-4)}`,
            lastMessage: c.UserMessage || "",
            updatedAt: c.CreatedAt || new Date().toISOString(),
            status: "activa",
            blocked: false,
          }))
        );
      } catch (error) {
        console.error("Error al cargar conversaciones iniciales:", error);
      }
    };

    const setupSignalR = async () => {
      try {
        if (connection.state !== "Connected") {
          await connection.start();
        }

        if (connection.state === "Connected") {
          await connection.invoke("JoinAdmin");
          setIsConnected(true);
        } else {
          console.warn("❌ No se pudo conectar con SignalR.");
        }

        // 👇 ESTE BLOQUE ES EL NUEVO QUE DEBES AGREGAR
        connection.on("NewConversationOrMessage", (msg) => {
          const id = msg.conversationId;

          setMessages((prev) => ({
            ...prev,
            [msg.conversationId]: [
              ...(prev[msg.conversationId] || []),
              {
                from: msg.from,
                text: msg.text,
                timestamp: msg.timestamp || new Date().toISOString(),
              },
            ],
          }));

          if (id !== activeTab) {
            setOpenTabs((prev) =>
              prev.map((tab) =>
                tab.id === id ? { ...tab, unreadCount: (tab.unreadCount || 0) + 1 } : tab
              )
            );
          }

          setConversationList((prev) => {
            const exists = prev.find((c) => c.id === id);
            if (!exists) {
              return [
                {
                  id,
                  alias: msg.alias || `Usuario ${String(id).slice(-4)}`,
                  lastMessage: msg.text,
                  updatedAt: msg.timestamp || new Date().toISOString(),
                  status: "activa",
                  blocked: false,
                },
                ...prev,
              ];
            }

            return prev.map((conv) =>
              conv.id === id
                ? {
                    ...conv,
                    lastMessage: msg.text,
                    updatedAt: msg.timestamp || new Date().toISOString(),
                  }
                : conv
            );
          });
        });

        connection.on("NewConversation", (newConv) => {
          setConversationList((prev) => {
            const exists = prev.find((c) => c.id === newConv.id);
            if (exists) return prev;
            return [newConv, ...prev];
          });
        });

        connection.on("Typing", (conversationId, sender) => {
          if (sender !== "user") return;

          setTypingState((prev) => ({
            ...prev,
            [conversationId]: true,
          }));

          setTimeout(() => {
            setTypingState((prev) => ({
              ...prev,
              [conversationId]: false,
            }));
          }, 2000);
        });
      } catch (error) {
        console.error("❌ Error al conectar con SignalR:", error);
      }
    }; // 👈 AQUÍ estaba faltando esta llave de cierre

    loadInitialConversations();
    setupSignalR();

    return () => {
      connection.stop();
    };
  }, []);

  useEffect(() => {
    const checkOverflow = () => {
      const el = tabContainerRef.current;
      if (el) {
        setShowScrollButtons(el.scrollWidth > el.clientWidth);
      }
    };
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [openTabs]);

  useEffect(() => {
    const activeTabEl = tabRefs.current[activeTab];
    const container = tabContainerRef.current;
    if (activeTabEl && container) {
      const tabLeft = activeTabEl.offsetLeft;
      const tabRight = tabLeft + activeTabEl.offsetWidth;
      const containerScrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const isOutOfView =
        tabLeft < containerScrollLeft || tabRight > containerScrollLeft + containerWidth;
      if (isOutOfView) {
        activeTabEl.scrollIntoView({ behavior: "smooth", inline: "center" });
      }
    }
  }, [activeTab]);

  const handleSelectConversation = (conv) => {
    const exists = openTabs.find((t) => t.id === conv.id);
    if (!exists) {
      setOpenTabs((prev) => [...prev, { ...conv, unreadCount: 0 }]);
    }
    setActiveTab(conv.id);
    setOpenTabs((prev) =>
      prev.map((tab) => (tab.id === conv.id ? { ...tab, unreadCount: 0 } : tab))
    );

    if (!messages[conv.id]) {
      const historialSimulado = [
        {
          from: "user",
          text: "Hola",
          timestamp: new Date().toISOString(),
        },
        {
          from: "bot",
          text: "Hola, ¿en qué puedo ayudarte?",
          timestamp: new Date().toISOString(),
        },
      ];
      setMessages((prev) => ({
        ...prev,
        [conv.id]: historialSimulado,
      }));
    }
  };

  const handleSendAdminMessage = async (text, conversationId) => {
    if (!connection || connection.state !== "Connected") {
      console.warn("SignalR connection not ready yet");
      return;
    }

    try {
      await connection.invoke("AdminMessage", conversationId, text);
    } catch (err) {
      console.error("❌ Error sending message:", err);
    }
  };

  const handleChangeStatus = (id, newStatus) => {
    setConversationList((prev) =>
      prev.map((conv) => (conv.id === id ? { ...conv, status: newStatus } : conv))
    );
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
          {/* LISTA DE CONVERSACIONES */}
          <Grid item xs={12} md={4} lg={4}>
            <Card
              sx={{
                height: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column",
                borderRadius: 0,
              }}
            >
              <SoftBox
                p={2}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                }}
              >
                <ConversationList
                  conversations={conversationList}
                  messagesMap={messages}
                  onSelect={(id) => {
                    const conv = conversationList.find((c) => c.id === id);
                    if (conv) handleSelectConversation(conv);
                  }}
                  onStatusChange={handleChangeStatus}
                  onBlock={(id) => handleBlockUser(id)}
                />
              </SoftBox>
            </Card>
          </Grid>

          {/* PANEL DE CHAT CON PESTAÑAS */}
          <Grid item xs={12} md={8} lg={8}>
            <Card
              sx={{
                height: "calc(100vh - 120px)",
                display: "flex",
                flexDirection: "column",
                borderRadius: 0,
              }}
            >
              <SoftBox
                sx={{
                  flex: 1,
                  display: "flex",
                  minHeight: 0, // 👈 ESTE es el que te falta
                  flexDirection: "column",
                  position: "relative",
                  pb: 2,
                }}
              >
                <DragDropContext
                  onDragEnd={(result) => {
                    const { source, destination } = result;
                    if (!destination) return;

                    const reordered = Array.from(openTabs);
                    const [moved] = reordered.splice(source.index, 1);
                    reordered.splice(destination.index, 0, moved);
                    setOpenTabs(reordered);
                  }}
                >
                  <Droppable droppableId="tabs" direction="horizontal">
                    {(provided) => (
                      <Box
                        sx={{
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          mb: 1,
                        }}
                      >
                        {showScrollButtons && (
                          <IconButton
                            onClick={() => {
                              const el = tabContainerRef.current;
                              if (el) el.scrollLeft -= 150;
                            }}
                            sx={{
                              position: "absolute",
                              left: 0,
                              zIndex: 2,
                              backgroundColor: "#fff",
                              "&:hover": { backgroundColor: "grey.200" },
                            }}
                          >
                            <ChevronLeftIcon />
                          </IconButton>
                        )}

                        <Box
                          id="scrollable-tab-container"
                          ref={(el) => {
                            tabContainerRef.current = el;
                            provided.innerRef(el);
                          }}
                          {...provided.droppableProps}
                          onScroll={() => {
                            const el = tabContainerRef.current;
                            if (el) {
                              setShowScrollButtons(el.scrollWidth > el.clientWidth);
                            }
                          }}
                          sx={{
                            overflowX: "auto",
                            display: "flex",
                            alignItems: "flex-end",
                            scrollBehavior: "smooth",
                            px: showScrollButtons ? 5 : 1, // margen si hay flechas
                            width: "100%",
                          }}
                        >
                          {openTabs.map((tab, index) => {
                            const isActive = activeTab === tab.id;

                            return (
                              <Draggable key={tab.id} draggableId={tab.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <Box
                                    ref={(el) => {
                                      provided.innerRef(el);
                                      tabRefs.current[tab.id] = el;
                                    }}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => setActiveTab(tab.id)}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      minHeight: "40px",
                                      px: 2,
                                      mr: 0.5,
                                      mt: 2,
                                      cursor: "pointer",
                                      flexShrink: 0,
                                      borderTopLeftRadius: "8px",
                                      borderTopRightRadius: "8px",
                                      borderBottomLeftRadius: 0,
                                      borderBottomRightRadius: 0,
                                      backgroundColor: isActive ? "info.main" : "transparent",
                                      boxShadow: isActive
                                        ? "0px 8px 16px rgba(0, 0, 0, 0.3)"
                                        : "none",
                                      zIndex: isActive ? 3 : 1,
                                      color: isActive ? "#fff" : "inherit",
                                      fontWeight: isActive ? "bold" : "normal",
                                      "&:hover": {
                                        backgroundColor: isActive ? "info.dark" : "action.hover",
                                      },
                                      ...(snapshot.isDragging && {
                                        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.4)",
                                      }),
                                    }}
                                  >
                                    <Tooltip
                                      title={tab.alias || `Usuario ${tab.id.slice(-4)}`}
                                      arrow
                                    >
                                      <Box
                                        display="flex"
                                        alignItems="center"
                                        sx={{
                                          maxWidth: { xs: 140, sm: 160, md: 180, lg: 200 },
                                          flexShrink: 0,
                                          overflow: "hidden",
                                          whiteSpace: "nowrap",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        <Box
                                          component="span"
                                          sx={{
                                            flexGrow: 1,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            color: isActive ? "#fff" : "inherit",
                                            fontSize: "0.80rem",
                                          }}
                                        >
                                          {tab.alias || `Usuario ${tab.id.slice(-4)}`}
                                        </Box>

                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenTabs((prev) => {
                                              const updated = prev.filter((t) => t.id !== tab.id);
                                              if (activeTab === tab.id) {
                                                setActiveTab(updated[0]?.id || null);
                                              }
                                              return updated;
                                            });
                                          }}
                                          sx={{
                                            ml: 1,
                                            padding: "1px",
                                            color: isActive ? "#fff" : "inherit",
                                            fontSize: "0.90rem",
                                          }}
                                        >
                                          <CloseIcon fontSize="inherit" />
                                        </IconButton>
                                      </Box>
                                    </Tooltip>
                                  </Box>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </Box>

                        {showScrollButtons && (
                          <IconButton
                            onClick={() => {
                              const el = tabContainerRef.current;
                              if (el) el.scrollLeft += 150;
                            }}
                            sx={{
                              position: "absolute",
                              right: 0,
                              zIndex: 2,
                              backgroundColor: "#fff",
                              "&:hover": { backgroundColor: "grey.200" },
                            }}
                          >
                            <ChevronRightIcon />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Panel de chat activo */}
                {selectedConversation ? (
                  <ChatPanel
                    conversationId={selectedConversation.id}
                    userName={selectedConversation.alias}
                    messages={selectedMessages}
                    isTyping={!!typingState[selectedConversation.id]}
                    typingSender="user"
                    iaPaused={!!iaPausedMap[selectedConversation.id]} // ✅ obtiene el estado por conversación
                    onToggleIA={() => handleToggleIA(selectedConversation.id)} // ✅ alterna solo la conversación activa
                    iaPausedMap={iaPausedMap}
                    onSendAdminMessage={(msg) =>
                      handleSendAdminMessage(msg, selectedConversation.id)
                    }
                    onStatusChange={(newStatus) =>
                      handleChangeStatus(selectedConversation.id, newStatus)
                    }
                    onBlock={() => handleBlockUser(selectedConversation.id)}
                    status={selectedConversation.status}
                    blocked={selectedConversation.blocked}
                  />
                ) : (
                  <SoftBox display="flex" justifyContent="center" alignItems="center" height="100%">
                    <SoftTypography variant="body2" color="text.secondary">
                      Selecciona una conversación para comenzar
                    </SoftTypography>
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
