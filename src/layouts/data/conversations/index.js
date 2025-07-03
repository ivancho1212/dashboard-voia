import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import connection from "services/signalr";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftBox from "components/SoftBox";
import ConversationList from "./ConversationList";
import ChatPanel from "./ChatPanel";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import SoftTypography from "components/SoftTypography";
import Tooltip from "@mui/material/Tooltip";

// 👇 Nuevo import
import { getConversationsByUser } from "services/botConversationsService";

function Conversations() {
  const [conversationList, setConversationList] = useState([]);
  const [openTabs, setOpenTabs] = useState([]); // [{ id, alias }]
  const [activeTab, setActiveTab] = useState(null); // id actual mostrado
  const [messages, setMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [iaPaused, setIaPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // 👇 Simulación de userId hasta que tengas auth
  const userId = 45;

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
            status: "activa", // Puedes ajustar si tienes estado en el modelo
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
          setIsConnected(true); // ✅ Ya está listo
        } else {
          console.warn("❌ No se pudo conectar con SignalR.");
        }

        connection.on("ReceiveMessage", (msg) => {
          const id = msg.conversationId;

          setMessages((prev) => ({
            ...prev,
            [id]: [
              ...(prev[id] || []),
              {
                from: msg.from,
                text: msg.text,
                timestamp: new Date().toISOString(), // 👈 agrega timestamp
              },
            ],
          }));

          setConversationList((prev) => {
            const exists = prev.find((c) => c.id === id);
            if (!exists) {
              return [
                ...prev,
                {
                  id,
                  alias: `Usuario ${String(id).slice(-4)}`,
                  lastMessage: msg.text,
                  updatedAt: new Date().toISOString(),
                  status: "activa",
                  blocked: false,
                },
              ];
            }
            return prev.map((conv) =>
              conv.id === id
                ? { ...conv, lastMessage: msg.text, updatedAt: new Date().toISOString() }
                : conv
            );
          });
        });

        connection.on("NewConversation", (newConv) => {
          setConversationList((prev) => {
            const exists = prev.find((c) => c.id === newConv.id);
            if (exists) return prev;

            return [newConv, ...prev]; // Agrega al inicio
          });
        });
        connection.on("NewConversationOrMessage", (msg) => {
          const id = msg.conversationId;

          setMessages((prev) => ({
            ...prev,
            [id]: [
              ...(prev[id] || []),
              {
                from: msg.from,
                text: msg.text,
                timestamp: msg.timestamp || new Date().toISOString(), // usa el timestamp si viene del backend
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
                  alias: msg.alias,
                  lastMessage: msg.text,
                  updatedAt: msg.timestamp,
                  status: "activa",
                  blocked: false,
                },
                ...prev,
              ];
            }

            return prev.map((conv) =>
              conv.id === id ? { ...conv, lastMessage: msg.text, updatedAt: msg.timestamp } : conv
            );
          });
        });

        connection.on("Typing", () => {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 1500);
        });
      } catch (error) {
        console.error("❌ Error al conectar con SignalR:", error);
      }
    };

    loadInitialConversations();
    setupSignalR();

    return () => {
      connection.stop();
    };
  }, []);
  useEffect(() => {
    if (activeTab) {
      setOpenTabs((prev) =>
        prev.map((tab) => (tab.id === activeTab ? { ...tab, unreadCount: 0 } : tab))
      );
    }
  }, [activeTab]);

  const handleSelectConversation = (conv) => {
    const exists = openTabs.find((t) => t.id === conv.id);

    if (!exists) {
      setOpenTabs((prev) => [...prev, { ...conv, unreadCount: 0 }]);
    }

    setActiveTab(conv.id);

    // Reinicia contador de no leídos al abrir la conversación
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

    const message = {
      conversationId,
      from: "admin",
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), message],
    }));

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
            <Card sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
              <SoftBox
                p={2}
                sx={{ overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}
              >
                <ConversationList
                  conversations={conversationList}
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
            <Card sx={{ height: "calc(100vh - 120px)", display: "flex", flexDirection: "column" }}>
              <SoftBox p={2} sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Tabs tipo carpeta */}
                <Tabs
                  value={activeTab}
                  onChange={(e, newValue) => setActiveTab(newValue)}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    minHeight: "48px",
                    mb: 2,
                    borderBottom: "1px solid #ccc",
                  }}
                >
                  {openTabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                      <Tab
                        key={tab.id}
                        value={tab.id}
                        label={
                          <Tooltip title={tab.alias || `Usuario ${tab.id.slice(-4)}`} arrow>
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{
                                maxWidth: isActive ? "none" : 150, // ❗ solo las inactivas se limitan
                                flexShrink: isActive ? 0 : 1, // ❗ evita que la activa se comprima
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  flexGrow: 1,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
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
                                  color: isActive ? "#fff" : "inherit",
                                  padding: "2px",
                                }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Tooltip>
                        }
                        sx={{
                          textTransform: "none",
                          minHeight: "48px",
                          px: 1.5,
                          fontWeight: isActive ? "bold" : "normal",
                          borderTopLeftRadius: "8px",
                          borderTopRightRadius: "8px",
                          bgcolor: isActive ? "info.main" : "transparent",
                          flexShrink: 0, // <--- importante para scroll correcto
                          "&.Mui-selected": {
                            bgcolor: "info.main",
                          },
                          "&.Mui-selected .MuiTab-wrapper": {
                            color: "#fff",
                          },
                          "&:hover": {
                            bgcolor: isActive ? "info.dark" : "action.hover",
                          },
                        }}
                      />
                    );
                  })}
                </Tabs>

                {/* Panel de chat activo */}
                {selectedConversation ? (
                  <ChatPanel
                    userName={selectedConversation.alias}
                    messages={selectedMessages}
                    isTyping={isTyping}
                    iaPaused={iaPaused}
                    onToggleIA={() => setIaPaused(!iaPaused)}
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
