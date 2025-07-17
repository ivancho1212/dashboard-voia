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
}) => (
  <TransitionGroup style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
    {messages
      .filter((msg) => !msg?.meta?.internalOnly)
      .map((msg, index) => {
        const nodeRef = messageRefs.current[index];
        return (
          <CSSTransition key={index} timeout={300} classNames="fade" nodeRef={nodeRef}>
            <MessageBubble
              key={index}
              message={msg}
              index={index}
              messageRef={nodeRef}
              fontFamily={fontFamily}
              openImageModal={openImageModal}
            />
          </CSSTransition>
        );
      })}

    {isTyping && (typingSender === "bot" || typingSender === "admin") && (
      <CSSTransition key="typing" timeout={300} classNames="fade" nodeRef={typingRef}>
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
      </CSSTransition>
    )}
  </TransitionGroup>
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
