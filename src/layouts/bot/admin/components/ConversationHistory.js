import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import MessageList from "../../style/components/chat/MessageList";
import Loader from "../../../../components/Loader";
import { getConversationHistory, getMessagesByConversationId } from "services/conversationsService";
import { createHubConnection } from "services/signalr";

const ConversationHistory = ({ conversationId, userName }) => {
  console.log('[ConversationHistory] Render', { conversationId, userName });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRealtimeMsg, setLastRealtimeMsg] = useState(null);
  const messageRefs = useRef({});

  // Mantener referencia a la conexión SignalR
  const signalRConnection = useRef(null);

  useEffect(() => {
    console.log('[ConversationHistory] useEffect - conversationId:', conversationId);
    if (!conversationId) {
      console.warn('[ConversationHistory] conversationId no definido');
      return;
    }
    setLoading(true);
    setError(null);
    let isMounted = true;

    getConversationHistory(conversationId)
      .then((data) => {
        console.log('[ConversationHistory] getConversationHistory result:', data);
        console.log('[ConversationHistory] typeof data:', typeof data, '| Array.isArray:', Array.isArray(data));
        let msgs = [];
        if (Array.isArray(data)) {
          msgs = data;
        } else if (data && Array.isArray(data.History)) {
          msgs = data.History;
        }
        console.log('[ConversationHistory] mensajes recibidos:', Array.isArray(msgs) ? msgs.length : 'no array');
        if (msgs.length > 0) {
          if (isMounted) setMessages(msgs);
          setLoading(false);
        } else {
          getMessagesByConversationId(conversationId)
            .then((fallbackMsgs) => {
              console.log('[ConversationHistory] getMessagesByConversationId result:', fallbackMsgs);
              console.log('[ConversationHistory] fallbackMsgs typeof:', typeof fallbackMsgs, '| Array.isArray:', Array.isArray(fallbackMsgs));
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
        console.log('[ConversationHistory] SignalR conectado y unido a grupo (JoinRoom)', conversationId);
        connection.on("ReceiveMessage", (msg) => {
          console.log('[ConversationHistory] Mensaje recibido por SignalR:', msg);
          setLastRealtimeMsg(msg);
          // Normalizar formato si es necesario
          const normalized = {
            id: msg.id ?? msg.Id,
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
            if (prev.some((m) => m.id === normalized.id)) return prev;
            return [...prev, normalized];
          });
        });
      } catch (e) {
        console.error('[ConversationHistory] Error conectando a SignalR', e);
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
        <div style={{ color: "green", fontSize: 13, marginBottom: 8 }}>
          <strong>Mensaje en tiempo real recibido:</strong> {lastRealtimeMsg.text ?? lastRealtimeMsg.messageText ?? ""}
        </div>
      )}
      {messages.length === 0 ? (
        <div style={{ color: "#888" }}>No hay mensajes en esta conversación.</div>
      ) : (
        <MessageList messages={messages} messageRefs={messageRefs} />
      )}
    </div>
  );
};

ConversationHistory.propTypes = {
  conversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  userName: PropTypes.string.isRequired,
};

export default ConversationHistory;
