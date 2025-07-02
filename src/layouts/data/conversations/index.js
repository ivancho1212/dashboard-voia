import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import connection from "services/signalr";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftBox from "components/SoftBox";
import ConversationList from "./ConversationList";
import ChatPanel from "./ChatPanel";

// 👇 Nuevo import
import { getConversationsByUser } from "services/botConversationsService";

function Conversations() {
  const [conversationList, setConversationList] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [messages, setMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [iaPaused, setIaPaused] = useState(false);

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
        } else {
          console.warn("❌ No se pudo conectar con SignalR.");
        }

        connection.on("ReceiveMessage", (msg) => {
          const id = msg.conversationId;

          setMessages((prev) => ({
            ...prev,
            [id]: [...(prev[id] || []), { from: msg.from, text: msg.text }],
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

  const handleSelectConversation = (id) => {
    setSelectedConversationId(id);

    if (!messages[id]) {
      const historialSimulado = [
        { from: "user", text: "Hola" },
        { from: "bot", text: "Hola, ¿en qué puedo ayudarte?" },
      ];
      setMessages((prev) => ({
        ...prev,
        [id]: historialSimulado,
      }));
    }
  };

  const handleSendAdminMessage = (text) => {
    const id = selectedConversationId;

    const message = {
      conversationId: id,
      from: "admin",
      text,
    };

    connection.invoke("SendAdminMessage", message); // ajusta si tu método SignalR es diferente

    setMessages((prev) => ({
      ...prev,
      [id]: [...(prev[id] || []), message],
    }));
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

  const selectedConversation = conversationList.find((conv) => conv.id === selectedConversationId);
  const selectedMessages = messages[selectedConversationId] || [];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <Grid container spacing={2} sx={{ height: "80vh" }}>
          {/* Lista de conversaciones */}
          <Grid item xs={4}>
            <Card sx={{ height: "100%", overflowY: "auto", p: 2 }}>
              <ConversationList
                conversations={conversationList}
                onSelect={handleSelectConversation}
                onStatusChange={handleChangeStatus}
                onBlock={handleBlockUser}
              />
            </Card>
          </Grid>

          {/* Panel del chat */}
          <Grid item xs={8}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column", p: 2 }}>
              {selectedConversation ? (
                <ChatPanel
                  userName={
                    selectedConversation.alias || `Usuario ${selectedConversation.id.slice(-4)}`
                  }
                  messages={selectedMessages}
                  isTyping={isTyping}
                  iaPaused={iaPaused}
                  onToggleIA={() => setIaPaused((prev) => !prev)}
                  onSendAdminMessage={handleSendAdminMessage}
                  onStatusChange={(status) => handleChangeStatus(selectedConversation.id, status)}
                  onBlock={() => handleBlockUser(selectedConversation.id)}
                  status={selectedConversation.status}
                  blocked={selectedConversation.blocked}
                />
              ) : (
                <p>Selecciona una conversación para ver el chat.</p>
              )}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
    </DashboardLayout>
  );
}

export default Conversations;
