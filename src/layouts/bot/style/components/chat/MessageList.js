import React from "react";
import PropTypes from "prop-types";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import MessageBubble from "./MessageBubble";


const MessageList = ({
  messages,
  messageRefs,
  fontFamily,
  openImageModal,
  isTyping,
  typingSender,
  typingRef,
  primaryColor,
  secondaryColor,
  isMobileView,
  onJumpToReply,
  highlightedMessageId,
  conversationId,
}) => (
  <>
    <TransitionGroup style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {messages
        .filter((msg) => !msg?.meta?.internalOnly)
        .map((msg, index) => {
          const msgId = String(msg.id || msg.tempId || index);
          if (!messageRefs.current[msgId]) {
            messageRefs.current[msgId] = React.createRef();
          }
          const nodeRef = messageRefs.current[msgId];

          // Construir resolvedReplyTo usando replyToImageUrl (guardado en el mensaje)
          // con fallback a búsqueda en el array si el campo aún no está cacheado
          let resolvedReplyTo = null;
          if (msg.replyToMessageId || msg.replyToText) {
            if (msg.replyToImageUrl) {
              resolvedReplyTo = { imageUrl: msg.replyToImageUrl, text: null, fileName: null, fileType: null };
            } else if (msg.replyToMessageId) {
              const original = messages.find(
                (m) =>
                  String(m.id) === String(msg.replyToMessageId) ||
                  String(m.tempId) === String(msg.replyToMessageId)
              );
              if (original) {
                const imgFile =
                  (original.file?.fileType?.startsWith("image/") && original.file.fileUrl ? original.file : null) ||
                  (original.images?.length > 0 && original.images[0].fileUrl ? original.images[0] : null) ||
                  original.multipleFiles?.find((f) => f?.fileType?.startsWith("image/") && f.fileUrl) ||
                  null;
                const firstFile = original.file || original.multipleFiles?.[0] || original.images?.[0] || null;
                resolvedReplyTo = {
                  imageUrl: imgFile?.fileUrl || null,
                  text: original.text || null,
                  fileName: firstFile?.fileName || null,
                  fileType: firstFile?.fileType || null,
                };
              }
            }
            // Si no se pudo resolver el original pero hay replyToText, igual pasar para fallback en MessageBubble
            if (!resolvedReplyTo && msg.replyToText) {
              resolvedReplyTo = { imageUrl: null, text: null, fileName: null, fileType: null };
            }
          }

          // Asegura que timestamp sea string
          const safeMsg = {
            ...msg,
            timestamp:
              typeof msg.timestamp === "string"
                ? msg.timestamp
                : msg.timestamp
                ? msg.timestamp.toISOString()
                : undefined,
          };
          // Usa uniqueKey para archivos (id/tempId vacíos del servidor), o tempId/id/text/index
          const key =
            msg.uniqueKey ||
            msg.tempId ||
            msg.id ||
            (msg.multipleFiles?.[0]?.fileUrl ?? msg.file?.fileUrl) ||
            msg.text ||
            `msg-${index}`;
          return (
            <CSSTransition key={key} timeout={300} classNames="fade" nodeRef={nodeRef}>
              <MessageBubble
                key={key}
                message={safeMsg}
                index={index}
                messageRef={nodeRef}
                fontFamily={fontFamily}
                openImageModal={openImageModal}
                isMobileView={isMobileView}
                onJumpToReply={onJumpToReply}
                highlightedMessageId={highlightedMessageId}
                resolvedReplyTo={resolvedReplyTo}
                conversationId={conversationId}
              />
            </CSSTransition>
          );
        })}
    </TransitionGroup>

    {isTyping && (typingSender === "bot" || typingSender === "admin") && (
      <div
        ref={typingRef}
        style={{
          alignSelf: "flex-start",
          backgroundColor: typingSender === "admin" ? "#ccc" : secondaryColor,
          color: typingSender === "admin" ? "#000" : primaryColor,
          padding: "8px 12px",
          borderRadius: "12px",
          maxWidth: "60%",
          fontFamily,
          fontSize: "14px",
          fontStyle: "italic",
          opacity: 0.7,
          border: "none",
          boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <TypingDots color={primaryColor} />
      </div>
    )}
  </>
);

MessageList.propTypes = {
  messages: PropTypes.array.isRequired,
  messageRefs: PropTypes.object.isRequired,
  fontFamily: PropTypes.string,
  openImageModal: PropTypes.func.isRequired,
  isTyping: PropTypes.bool,
  typingSender: PropTypes.string,
  typingRef: PropTypes.object.isRequired,
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  isMobileView: PropTypes.bool,
  onJumpToReply: PropTypes.func,
  highlightedMessageId: PropTypes.string,
  conversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

const TypingDots = ({ color = "#000" }) => (
  <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "16px" }}>
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          width: "4px",
          height: "8px",
          background: color,
          animation: "equalizer 0.8s infinite ease-in-out",
          animationDelay: `${i * 0.15}s`,
          borderRadius: "2px",
        }}
      />
    ))}
    <style>
      {`
        @keyframes equalizer {
          0%, 100% { height: 8px; }
          50% { height: 16px; }
        }
      `}
    </style>
  </div>
);

TypingDots.propTypes = {
  color: PropTypes.string,
};

export default MessageList;
