import { TransitionGroup, CSSTransition } from "react-transition-group";
import React, { useState, useEffect, useRef } from "react";
import { FaPaperclip, FaPaperPlane, FaImage } from "react-icons/fa";
import PropTypes from "prop-types";
import connection from "services/signalr";

import { createConversation } from "services/botConversationsService";
const voaiGif = "/voai.gif"; // ✅ Ruta relativa al dominio público

function ChatWidget({
  title = "Voia",
  theme: initialTheme,
  primaryColor = "#000000",
  secondaryColor = "#ffffff",
  headerBackgroundColor = "#f5f5f5",
  fontFamily = "Arial",
  avatarUrl,
  position = "bottom-right",
  botId: propBotId,
  userId: propUserId,
}) {
  const botId = propBotId ?? 1;
  const userId = propUserId ?? 45;

  const [isOpen, setIsOpen] = useState(false);
  const themeKey = initialTheme || "light";
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const messagesEndRef = useRef(null);

  console.log("📌 conversationId en el widget:", conversationId);

  const [iaWarning, setIaWarning] = useState(null);
  const textareaRef = useRef(null);
  const [typingSender, setTypingSender] = useState(null);
  const typingTimeoutRef = useRef(null);

  // 🧠 Refs para animación individual de mensajes
  const messageRefs = useRef([]);
  messageRefs.current = messages.map((_, i) => messageRefs.current[i] ?? React.createRef());
  const typingRef = useRef(null);

  const waitForConnection = async (retries = 5) => {
    while (connection.state !== "Connected" && retries > 0) {
      console.log("⌛ Esperando conexión SignalR...");
      await new Promise((res) => setTimeout(res, 300));
      retries--;
    }

    if (connection.state !== "Connected") {
      throw new Error("❌ No se pudo establecer conexión con SignalR.");
    }
  };

  const iniciarConversacion = async () => {
    try {
      await waitForConnection();

      if (!conversationId) {
        const nuevaConversacion = await createConversation({
          userId,
          botId,
          title: "Primera interacción",
          userMessage: "Hola",
          botResponse: "",
        });

        const realConversationId = nuevaConversacion.id;
        setConversationId(realConversationId); // Actualiza el estado

        console.log("🧪 Devolviendo conversationId:", realConversationId);
        return realConversationId; // 🔁 Devuelve el valor directamente
      }

      return conversationId; // Si ya existía, lo devuelve
    } catch (error) {
      console.error("❌ Error al iniciar conversación:", error);
      return null;
    }
  };

  // ⬇️ Pega esto después de `waitForConnection` y antes de `useEffect`
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxSizeInBytes = 5 * 1024 * 1024;
    const filePayloads = [];

    const promises = files.map((file) => {
      return new Promise((resolve) => {
        if (!file || file.type.startsWith("image/")) return resolve(null);
        if (file.size > maxSizeInBytes) {
          alert(`❌ ${file.name} excede los 5MB permitidos.`);
          return resolve(null);
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result.split(",")[1];
          const fullBase64 = `data:${file.type};base64,${base64Data}`;

          filePayloads.push({
            fileName: file.name,
            fileType: file.type,
            fileContent: base64Data,
          });

          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(async () => {
      if (filePayloads.length === 0) return;

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(true);
        setTypingSender("bot");
      }, 300);

      try {
        await waitForConnection();
        await connection.invoke("SendFile", conversationId, {
          multipleFiles: filePayloads,
        });
      } catch (err) {
        console.error("❌ Error enviando archivos:", err);
      }
    });
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxSizeInBytes = 5 * 1024 * 1024;
    const imagePayloads = [];

    const promises = files.map((file) => {
      return new Promise((resolve) => {
        if (!file.type.startsWith("image/")) return resolve(null);
        if (file.size > maxSizeInBytes) {
          alert(`❌ ${file.name} excede los 5MB permitidos.`);
          return resolve(null);
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result.split(",")[1];
          const fullBase64 = `data:${file.type};base64,${base64Data}`;

          imagePayloads.push({
            fileName: file.name,
            fileType: file.type,
            fileContent: base64Data,
          });

          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(async () => {
      if (imagePayloads.length === 0) return;

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(true);
        setTypingSender("bot");
      }, 300);

      try {
        await waitForConnection();
        await connection.invoke("SendFile", conversationId, {
          multipleFiles: imagePayloads,
        });
      } catch (err) {
        console.error("❌ Error enviando imágenes:", err);
      }
    });
  };

  // ✅ SignalR Setup
  useEffect(() => {
    let isMounted = true;

    const startConnection = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
          console.log("✅ Conectado a SignalR");
        } else {
          console.log("🔄 SignalR ya está conectado o en proceso:", connection.state);
        }

        await waitForConnection();

        // 🔒 Asegura que solo se cree una conversación
        if (!conversationId && isMounted) {
          const realConversationId = await iniciarConversacion();
          setConversationId(realConversationId);
          await connection.invoke("JoinRoom", realConversationId);
        } else if (conversationId) {
          await connection.invoke("JoinRoom", conversationId);
        }
      } catch (err) {
        console.error("❌ Error conectando a SignalR:", err);
      }
    };

    const handleReceiveMessage = async (msg) => {
      console.log("📩 Mensaje recibido del backend:", msg);
      const isFromBot = msg.from === "bot";

      if (isFromBot) {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }

        setIsTyping(false);
        setTypingSender(null);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // 🚫 Evitar renderizar mensajes completamente vacíos
      if (
        !msg.text?.trim() &&
        (!msg.multipleFiles || msg.multipleFiles.length === 0) &&
        !msg.fileContent
      ) {
        console.warn("🚫 Mensaje ignorado por estar vacío.");
        return;
      }

      const newMessage = {
        from: msg.from,
        text: msg.multipleFiles?.length ? null : msg.text || null, // ❌ evita duplicar texto si hay archivos
        multipleFiles: msg.multipleFiles || null,
        timestamp: msg.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);

      if (msg.text?.includes("aún no está conectado")) {
        setIaWarning("Este bot aún no está conectado a una IA. Pronto estará disponible.");
      }
    };

    const handleClose = (error) => {
      console.warn("🔌 Conexión cerrada:", error);
    };

    const handleTyping = (sender = "admin") => {
      if (sender === "admin") {
        setIsTyping(true);
        setTypingSender("admin");

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingSender(null);
        }, 1500);
      }
    };

    // 🔁 Limpia eventos anteriores antes de registrar nuevos
    connection.off("ReceiveMessage");
    connection.off("Typing");
    connection.off("onclose");

    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("Typing", handleTyping);
    connection.onclose(handleClose);

    startConnection();

    return () => {
      isMounted = false;
      connection.off("ReceiveMessage", handleReceiveMessage);
      connection.off("Typing", handleTyping);
      connection.off("onclose", handleClose);
    };
  }, [conversationId]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen]);

  useEffect(() => {
    const iniciarConversacionConContexto = async () => {
      try {
        await waitForConnection();
        await connection.invoke("InitializeContext", conversationId, { botId, userId });
        console.log("📡 Contexto inicial enviado al bot");
      } catch (error) {
        console.error("❌ Error enviando contexto inicial:", error);
      }
    };

    if (isOpen && messages.length === 0) {
      iniciarConversacionConContexto();
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const msg = message.trim();
    setMessage("");

    const payload = { botId, userId, question: msg };

    if (!conversationId) {
      console.warn("⛔ conversationId no está definido aún");
      return;
    }

    if (connection.state !== "Connected") {
      try {
        await connection.start();
        await waitForConnection();
        await connection.invoke("JoinRoom", conversationId);
      } catch (error) {
        console.error("❌ Error reconectando SignalR:", error);
        return;
      }
    }

    try {
      // 🧹 Limpiar cualquier timeout anterior
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // 🕒 Mostrar "escribiendo..." si el bot no responde pronto
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(true);
        setTypingSender("bot");
      }, 500);

      console.log("📤 Enviando mensaje con payload:", payload, "a conversación:", conversationId);
      await connection.invoke("SendMessage", conversationId, payload);
      console.log("✅ Mensaje enviado por SignalR");
    } catch (err) {
      console.error("❌ Error enviando mensaje:", err);
    }
  };

  // ✅ Configuración de temas
  const fallbackTextColor = "#1a1a1a";
  const fallbackBgColor = "#f5f5f5";

  const themeConfig = {
    light: {
      backgroundColor: "#ffffff",
      headerBackground: "#f5f5f5",
      textColor: "#000000",
      borderColor: "#dddddd",
      inputBg: "#ffffff",
      inputText: "#000000",
      inputBorder: "#dddddd",
      buttonBg: primaryColor,
      buttonColor: "#ffffff",
    },
    dark: {
      backgroundColor: "#1e1e1e",
      headerBackground: "#2a2a2a",
      textColor: "#ffffff",
      borderColor: "#444444",
      inputBg: "#2a2a2a",
      inputText: "#ffffff",
      inputBorder: "#444444",
      buttonBg: primaryColor,
      buttonColor: "#000000",
    },
    custom: {
      backgroundColor:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackBgColor
          : secondaryColor,
      headerBackground:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackBgColor
          : secondaryColor,
      textColor:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackTextColor
          : primaryColor,
      borderColor: secondaryColor,
      inputBg:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackBgColor
          : secondaryColor,
      inputText:
        primaryColor.toLowerCase() === secondaryColor.toLowerCase()
          ? fallbackTextColor
          : primaryColor,
      inputBorder: secondaryColor,
      buttonBg: primaryColor,
      buttonColor:
        secondaryColor.toLowerCase() === "#ffffff" || secondaryColor.toLowerCase() === "#fff"
          ? "#000000"
          : "#ffffff",
    },
  };

  const { backgroundColor, textColor, headerBackground, inputBg, inputText, inputBorder } =
    themeConfig[themeKey] || themeConfig.light;

  // ✅ Calcular color de texto del header según fondo
  const isColorDark = (hexColor) => {
    if (!hexColor) return false;
    const color = hexColor.replace("#", "");
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  const headerBg = headerBackgroundColor || headerBackground;
  const headerTextColor = isColorDark(headerBg) ? "#ffffff" : "#000000";

  // ✅ Estilos
  const widgetStyle = {
    backgroundColor,
    color: textColor,
    fontFamily,
    borderRadius: "16px",
    width: "90vw",
    maxWidth: "400px",
    height: "70vh",
    maxHeight: "650px",
    boxShadow: "0 2px 15px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    overflow: "hidden",
  };

  const positionStyles = {
    "bottom-right": { bottom: "20px", right: "20px" },
    "bottom-left": { bottom: "20px", left: "20px" },
    "top-right": { top: "20px", right: "20px" },
    "top-left": { top: "20px", left: "20px" },
    "center-left": { top: "50%", left: "20px", transform: "translateY(-50%)" },
    "center-right": { top: "50%", right: "20px", transform: "translateY(-50%)" },
  };

  const wrapperStyle = {
    position: "fixed",
    zIndex: 9999,
    ...positionStyles[position],
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // reset
      textarea.style.height = `${textarea.scrollHeight}px`; // set nueva altura
    }
  };

  const TypingDots = ({ color = "#000" }) => {
    return (
      <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "16px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: "4px",
              height: "8px",
              background: "#00bcd4",
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
  };

  TypingDots.propTypes = {
    color: PropTypes.string,
  };

  return (
    <div style={wrapperStyle}>
      {!isOpen ? (
        // 🔘 Botón flotante cuando está cerrado
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
          style={{
            backgroundColor: headerBackgroundColor,
            borderRadius: "50%",
            width: "80px",
            height: "80px",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            overflow: "hidden",
            padding: 0,
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <img
              src={avatarUrl?.trim() ? avatarUrl : voaiGif}
              alt="Avatar"
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </div>
        </button>
      ) : (
        // 💬 Widget abierto
        <div style={widgetStyle}>
          {/* 🔥 Header */}
          <div
            style={{
              backgroundColor: headerBackgroundColor || "#f5f5f5",
              width: "100%",
              height: "100px",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            {/* 📌 Avatar + Título */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingLeft: "16px",
              }}
            >
              <img
                src={avatarUrl?.trim() ? avatarUrl : voaiGif}
                alt="Avatar"
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
              <span
                style={{
                  fontSize: "18px",
                  color: headerTextColor,
                  fontFamily: fontFamily || "Arial",
                  fontWeight: "600",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                }}
              >
                {title}
              </span>
            </div>

            {/* ❌ Botón cerrar */}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              style={{
                background: "transparent",
                border: "none",
                color: headerTextColor,
                fontSize: "18px",
                cursor: "pointer",
                paddingRight: "20px",
              }}
            >
              ✕
            </button>
          </div>
          {iaWarning && (
            <div
              style={{
                color: "white",
                backgroundColor: "red",
                padding: "10px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: "500",
              }}
            >
              {iaWarning}
            </div>
          )}

          {/* 📜 Mensajes */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "16px",
            }}
          >
            <div
              style={{
                fontSize: "10.5px",
                color: isColorDark(backgroundColor) ? "#e0e0e0" : "#333333",
                backgroundColor: isColorDark(backgroundColor)
                  ? "rgba(255, 255, 255, 0.07)"
                  : "rgba(0, 0, 0, 0.04)",
                padding: "10px 16px",
                borderRadius: "14px",
                width: "100%", // 🔄 hace que ocupe todo el ancho del chat
                margin: "-6px 0 10px 0", // 🔽 margen superior reducido, espacio inferior normal
                textAlign: "center", // 🔁 centrado opcional
                boxSizing: "border-box", // 🧱 asegura que padding no desborde
              }}
            >
              Nuestro asistente virtual está potenciado por IA y supervisión humana para ofrecer
              respuestas precisas y seguras.
            </div>

            <TransitionGroup style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {messages
                .filter((msg) => !msg?.meta?.internalOnly)
                .map((msg, index) => {
                  const isUser = msg.from === "user";
                  const nodeRef = messageRefs.current[index];

                  const containerStyle = {
                    alignSelf: isUser ? "flex-end" : "flex-start",
                    backgroundColor: isUser ? "#e1f0ff" : "#f0f0f0",
                    color: "#1a1a1a",
                    padding: "8px 12px",
                    borderRadius: "12px",
                    maxWidth: "80%",
                    wordBreak: "break-word",
                    fontSize: "14px",
                    fontFamily,
                    border: "none",
                    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                    display: "flex",
                    flexDirection: "column",
                  };

                  return (
                    <CSSTransition
                      key={index}
                      timeout={300}
                      classNames="fade"
                      nodeRef={nodeRef}
                      unmountOnExit
                    >
                      <div ref={nodeRef} style={containerStyle}>
                        {/* Archivos múltiples */}
                        {msg.multipleFiles?.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {msg.multipleFiles.map((file, i) =>
                              file.fileType?.startsWith("image/") ? (
                                <img
                                  key={i}
                                  src={`data:${file.fileType};base64,${file.fileContent}`}
                                  alt={file.fileName}
                                  style={{
                                    maxWidth: "120px",
                                    maxHeight: "120px",
                                    borderRadius: "8px",
                                  }}
                                />
                              ) : (
                                <a
                                  key={i}
                                  href={`data:${file.fileType};base64,${file.fileContent}`}
                                  download={file.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    color: "#007bff",
                                    textDecoration: "underline",
                                    fontSize: "12px",
                                  }}
                                >
                                  <span style={{ fontSize: "20px" }}>📎</span>
                                  <span>{file.fileName}</span>
                                </a>
                              )
                            )}
                          </div>
                        )}

                        {/* Texto solo si NO hay archivos */}
                        {msg.text && (!msg.multipleFiles || msg.multipleFiles.length === 0) && (
                          <span>{msg.text}</span>
                        )}

                        {/* Archivo único */}
                        {!msg.files && msg.fileContent && msg.fileName ? (
                          msg.fileType?.startsWith("image/") ? (
                            <img
                              src={`data:${msg.fileType};base64,${msg.fileContent}`}
                              alt={msg.fileName}
                              style={{
                                maxWidth: "100%",
                                borderRadius: "8px",
                                marginBottom: "4px",
                              }}
                            />
                          ) : (
                            <a
                              href={`data:${msg.fileType};base64,${msg.fileContent}`}
                              download={msg.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#007bff",
                                textDecoration: "underline",
                                marginBottom: "4px",
                              }}
                            >
                              📎 {msg.fileName}
                            </a>
                          )
                        ) : null}

                        {/* Texto solo si NO hay archivos (evita duplicación) */}
                        {msg.text && !msg.multipleFiles && !msg.fileContent && (
                          <span>{msg.text}</span>
                        )}

                        {/* Timestamp */}
                        {msg.timestamp && (
                          <span
                            style={{
                              fontSize: "9px",
                              color: "#555",
                              alignSelf: "flex-end",
                              opacity: 0.7,
                            }}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
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

            <div ref={messagesEndRef} />
          </div>

          {/* 📝 Input + Adjuntar + Enviar */}
          <div
            style={{
              position: "relative",
              padding: "10px 10px", // Margen externo (opcional, puedes ajustar)
            }}
          >
            {/* 🖼️ Subir imágenes (solo imágenes, múltiples) */}
            <label
              style={{
                position: "absolute",
                left: "50px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
              title="Enviar imágenes"
            >
              <FaImage style={{ color: inputText, fontSize: "18px" }} />
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleImageUpload}
              />
            </label>

            {/* 📎 Adjuntar dentro del input */}
            <label
              style={{
                position: "absolute",
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
            >
              <FaPaperclip style={{ color: inputText, fontSize: "18px" }} />
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
            </label>

            {/* 📝 Textarea adaptativa */}
            <textarea
              ref={textareaRef}
              placeholder="Escribe un mensaje..."
              value={message}
              onChange={async (e) => {
                const text = e.target.value;
                setMessage(text);
                autoResizeTextarea();

                if (text.trim()) {
                  try {
                    console.log("✍️ Enviando Typing del usuario", conversationId);

                    await connection.invoke("Typing", conversationId, "user");
                  } catch (err) {
                    console.error("❌ Error enviando Typing del usuario:", err);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                  setMessage(""); // 🧹 Limpiar input

                  requestAnimationFrame(() => {
                    if (textareaRef.current) {
                      textareaRef.current.style.height = "auto";
                    }
                  });
                }
              }}
              rows={1}
              style={{
                width: "100%",
                minHeight: "42px",
                maxHeight: "160px",
                padding: "10px 42px 10px 70px",
                borderRadius: "12px",
                border: `1.5px solid ${inputBorder}`,
                fontFamily,
                fontSize: "14px",
                outline: "none",
                color: inputText,
                backgroundColor: inputBg,
                resize: "none",
                overflow: "",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
                lineHeight: "1.5",
              }}
            />

            {/* 🚀 Icono de enviar */}
            <FaPaperPlane
              onClick={sendMessage}
              style={{
                position: "absolute",
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                color: inputText,
                fontSize: "18px",
                cursor: "pointer",
              }}
            />
          </div>
          <div
            style={{
              textAlign: "right",
              fontSize: "11px",
              color: "#999",
              paddingBottom: "8px",
              marginRight: "15px",
              fontFamily: fontFamily || "Arial",
            }}
          >
            © {new Date().getFullYear()} <b style={{ color: primaryColor }}>VoIA</b>. Todos los
            derechos reservados.
          </div>
        </div>
      )}
    </div>
  );
}

// ✅ Esto va después de la función
ChatWidget.propTypes = {
  botId: PropTypes.number.isRequired,
  userId: PropTypes.number.isRequired,
  title: PropTypes.string,
  theme: PropTypes.oneOf(["light", "dark", "custom"]).isRequired,
  primaryColor: PropTypes.string,
  secondaryColor: PropTypes.string,
  headerBackgroundColor: PropTypes.string,
  fontFamily: PropTypes.string,
  avatarUrl: PropTypes.string,
  position: PropTypes.oneOf([
    "bottom-right",
    "bottom-left",
    "top-right",
    "top-left",
    "center-left",
    "center-right",
  ]),
};

export default ChatWidget;
