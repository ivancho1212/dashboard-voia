import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import MessageList from "../../style/components/chat/MessageList";
import Loader from "../../../../components/Loader";
import { getConversationHistory, getMessagesByConversationId } from "services/conversationsService";
import { createHubConnection } from "services/signalr";

const ConversationHistory = ({ conversationId, userName }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRealtimeMsg, setLastRealtimeMsg] = useState(null);
  const messageRefs = useRef({});

  // Mantener referencia a la conexión SignalR
  const signalRConnection = useRef(null);

  useEffect(() => {
    if (!conversationId) {
      console.warn('[ConversationHistory] conversationId no definido');
      return;
    }
    setLoading(true);
    setError(null);
    let isMounted = true;

    getConversationHistory(conversationId)
      .then((data) => {
        let msgs = [];
        if (Array.isArray(data)) {
          msgs = data;
        } else if (data && Array.isArray(data.history)) {
          msgs = data.history;
        } else if (data && Array.isArray(data.History)) {
          msgs = data.History;
        }
        if (msgs.length > 0) {
          if (isMounted) setMessages(msgs);
          setLoading(false);
        } else {
          getMessagesByConversationId(conversationId)
            .then((fallbackMsgs) => {
              if (isMounted) setMessages(Array.isArray(fallbackMsgs) ? fallbackMsgs : []);
              setLoading(false);
            })
            .catch((err) => {
              console.error('[ConversationHistory] Error en getMessagesByConversationId', err);
              if (err && err.response && (err.response.status === 401 || err.response.status === 403)) {
                console.error('[ConversationHistory] Error de autenticación, redirigiendo a login');
                // Aquí podrías redirigir a login si tienes acceso a history o navigate
              }
              setError("Error cargando historial");
              setLoading(false);
            });
        }
      })
      .catch((err) => {
        console.error('[ConversationHistory] Error en getConversationHistory', err);
        if (err && err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.error('[ConversationHistory] Error de autenticación, redirigiendo a login');
          // Aquí podrías redirigir a login si tienes acceso a history o navigate
        }
        setError("Error cargando historial");
        setLoading(false);
      });

    // SignalR: suscribirse a mensajes en tiempo real
    let connection;
    (async () => {
      try {
        connection = await createHubConnection();
        signalRConnection.current = connection;
        
        await connection.start();
        
        await connection.invoke("JoinRoom", Number(conversationId));
        
        // Registrar listener para ReceiveMessage
        connection.on("ReceiveMessage", (msg) => {
          
          // ✅ Verificar que el mensaje es para esta conversación
          if (msg.conversationId && msg.conversationId !== Number(conversationId)) {
            console.warn('[ConversationHistory] ⚠️ Mensaje ignorado - no pertenece a esta conversación');
            return;
          }
          
          setLastRealtimeMsg(msg);
          
          // Normalizar formato
          const normalized = {
            id: msg.id ?? msg.Id,
            conversationId: Number(conversationId),
            from: msg.from ?? msg.From ?? msg.sender ?? msg.Sender ?? (msg.UserId || msg.PublicUserId ? "user" : null),
            text: msg.text ?? msg.messageText ?? msg.MessageText ?? msg.Text ?? "",
            timestamp: msg.timestamp ?? msg.createdAt ?? msg.CreatedAt ?? new Date().toISOString(),
            fromRole: msg.fromRole ?? msg.sender ?? msg.Sender ?? null,
            fromName: msg.fromName ?? msg.UserName ?? msg.userName ?? null,
            replyTo: msg.replyToMessageId ?? msg.ReplyToMessageId ?? null,
            replyToText: msg.replyToText ?? null,
            multipleFiles: msg.multipleFiles ?? null,
            file: msg.file ?? null,
            images: msg.images ?? null,
          };
          
          
          // Evitar duplicados por id
          setMessages((prev) => {
            if (prev.some((m) => m.id === normalized.id)) {
              return prev;
            }
            return [...prev, normalized];
          });
        });
        
        // Registrar listeners para otros eventos (para evitar warnings en consola)
        connection.on("InitialConversations", (data) => {
        });
        
        connection.on("ReceiveTyping", (convId, userId) => {
        });
        
        connection.on("ReceiveStopTyping", (convId, userId) => {
        });
        
        connection.on("NewConversationOrMessage", (data) => {
        });
        
        connection.on("Heartbeat", (convId) => {
          // No loggeamos heartbeats para no saturar la consola
        });
        
        
      } catch (e) {
        console.error('[ConversationHistory] ❌ Error conectando a SignalR:', e);
        setError("Error conectando a mensajes en tiempo real");
      }
    })();

    return () => {
      isMounted = false;
      if (signalRConnection.current) {
        signalRConnection.current.stop();
        signalRConnection.current = null;
      }
    };
  }, [conversationId]);

  if (loading) return <Loader message="Cargando historial..." />;
  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div style={{ width: "100%", minHeight: 300, background: "#f9f9f9", borderRadius: 8, padding: 16 }}>
      <h3 style={{ marginBottom: 16 }}>Historial de mensajes con {userName}</h3>
      {lastRealtimeMsg && (
        <div style={{ color: "green", fontSize: 13, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
          <strong>Mensaje en tiempo real recibido:</strong> {lastRealtimeMsg.text ?? lastRealtimeMsg.messageText ?? ""}
          {lastRealtimeMsg.origen && (
            <span style={{ marginLeft: 8, color: '#007bff' }}>[origen: {lastRealtimeMsg.origen}]</span>
          )}
          <br />
          <span style={{ fontSize: 11, color: '#555' }}>Raw: {JSON.stringify(lastRealtimeMsg)}</span>
        </div>
      )}
      {messages.length === 0 ? (
        <div style={{ color: "#888" }}>No hay mensajes en esta conversación.</div>
      ) : (
        <MessageList messages={messages} messageRefs={messageRefs} conversationId={conversationId} />
      )}
    </div>
  );
};

ConversationHistory.propTypes = {
  conversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  userName: PropTypes.string.isRequired,
};

export default ConversationHistory;
