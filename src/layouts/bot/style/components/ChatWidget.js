import { TransitionGroup, CSSTransition } from "react-transition-group";
import React, { useState, useEffect, useRef } from "react";
import { FaPaperclip, FaPaperPlane, FaImage } from "react-icons/fa";
import PropTypes from "prop-types";
import connection from "services/signalr";
import { sendChatFile, sendGroupedImages } from "services/chatUploadedFilesService";

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
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageGroup, setImageGroup] = useState([]); // todas las imágenes
  const [activeImageIndex, setActiveImageIndex] = useState(0); // imagen activa

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

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);
    event.target.value = null;

    const maxSizeInBytes = 5 * 1024 * 1024;
    const isImage = (file) => file.type.startsWith("image/");

    const images = files.filter(isImage);
    const documents = files.filter((file) => !isImage(file));

    // ✅ MULTI-IMAGENES
    if (images.length > 0) {
      for (const img of images) {
        if (img.size > maxSizeInBytes) {
          alert(`❌ La imagen ${img.name} excede los 5MB.`);
          return;
        }
      }

      if (images.length === 1) {
        // ✅ Imagen individual
        await sendChatFile({ connection, conversationId, file: images[0], userId });
      } else {
        // ✅ Varias imágenes agrupadas
        if (images.length > 10) {
          alert("❌ Máximo 10 imágenes.");
          return;
        }
        await sendGroupedImages({ connection, conversationId, files: images, userId });
      }

      return;
    }

    // ✅ DOCUMENTO INDIVIDUAL
    if (documents.length > 1) {
      alert("❌ Solo puedes subir un documento a la vez.");
      return;
    }

    if (documents.length === 1) {
      const file = documents[0];
      if (file.size > maxSizeInBytes) {
        alert(`❌ El archivo ${file.name} excede los 5MB.`);
        return;
      }

      await sendChatFile({ connection, conversationId, file, userId });
    }
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
        if (conversationId) {
          await connection.invoke("JoinRoom", conversationId);
        }
      } catch (err) {
        console.error("❌ Error conectando a SignalR:", err);
      }
    };

    const handleReceiveMessage = async (msg) => {
      // 🆕 Captura el conversationId si viene en el mensaje y aún no está definido
      if (msg.conversationId && !conversationId) {
        setConversationId(msg.conversationId);
        console.log("🎯 conversationId recibido y establecido desde SignalR:", msg.conversationId);
      }

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

      const hasText = !!msg.text?.trim();
      const hasMultipleFiles = msg.multipleFiles?.length > 0;
      const hasFile = !!msg.file;
      const hasImages = Array.isArray(msg.images) && msg.images.length > 0;

      if (!hasText && !hasMultipleFiles && !hasFile && !hasImages) {
        console.warn("🚫 Mensaje ignorado por estar vacío.");
        return;
      }

      const newMessage = {
        from: msg.from,
        text: hasMultipleFiles ? null : msg.text || null,
        multipleFiles: msg.multipleFiles || null,
        file: msg.file || null,
        images: hasImages ? msg.images : null,
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
        const createdConversationId = await connection.invoke("InitializeContext", {
          botId,
          userId,
        });
        setConversationId(createdConversationId);
        await connection.invoke("JoinRoom", createdConversationId);
        console.log("📡 Contexto inicial enviado al bot, ID:", createdConversationId);
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

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      console.log(
        "⌛ conversationId aún no disponible. Esperando que InitializeContext lo cree..."
      );
      return; // Esperamos a que el backend cree y lo envíe por ReceiveMessage
    }

    if (connection.state !== "Connected") {
      try {
        await connection.start();
        await waitForConnection();
        await connection.invoke("JoinRoom", activeConversationId);
      } catch (error) {
        console.error("❌ Error reconectando SignalR:", error);
        return;
      }
    }

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(true);
        setTypingSender("bot");
      }, 500);

      console.log(
        "📤 Enviando mensaje con payload:",
        payload,
        "a conversación:",
        activeConversationId
      );
      await connection.invoke("SendMessage", activeConversationId, payload);
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
  const openImageModal = (images, clickedImageUrl) => {
    // Limpiar primero
    setImageGroup([]);
    setActiveImageIndex(0);
    setIsImageModalOpen(false);

    // Esperar al siguiente frame para asegurar que el estado se "limpie"
    setTimeout(() => {
      const index = images.findIndex((img) => {
        const url = img.fileUrl.startsWith("http")
          ? img.fileUrl
          : `http://localhost:5006${img.fileUrl}`;
        return url === clickedImageUrl;
      });

      setImageGroup(images);
      setActiveImageIndex(index >= 0 ? index : 0);
      setIsImageModalOpen(true);
    }, 10); // Pequeño delay para asegurar la limpieza
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
                    padding: "10px",
                    borderRadius: "12px",
                    maxWidth: "62%",
                    minWidth: "80px",
                    width: "fit-content", // 👈 que se adapte al contenido
                    wordBreak: "break-word",
                    fontSize: "14px",
                    fontFamily,
                    display: "flex",
                    flexDirection: "column",
                    boxSizing: "border-box",
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
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(2, 1fr)", // 2 columnas
                              gap: "6px",
                              marginBottom: "6px",
                              width: "100%", // ✅ para que se alinee con la burbuja
                              boxSizing: "border-box",
                            }}
                          >
                            {msg.multipleFiles.slice(0, 4).map((file, i) => {
                              const isLastVisible = i === 3 && msg.multipleFiles.length > 4;

                              return (
                                <div
                                  key={i}
                                  style={{
                                    position: "relative",
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <img
                                    src={`data:${file.fileType};base64,${file.fileContent}`}
                                    alt={file.fileName}
                                    onClick={() => {
                                      if (!isLastVisible) {
                                        setPreviewImageUrl(
                                          `data:${file.fileType};base64,${file.fileContent}`
                                        );
                                        setIsImageModalOpen(true);
                                      }
                                    }}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      display: "block",
                                      filter: isLastVisible ? "brightness(0.5)" : "none",
                                      cursor: isLastVisible ? "default" : "pointer", // 👈 sólo si no es la imagen 4+
                                    }}
                                  />

                                  {isLastVisible && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                                        color: "white",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                        borderRadius: "8px",
                                      }}
                                    >
                                      +{msg.multipleFiles.length - 4}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Archivo único */}
                        {msg.file ? (
                          msg.file.fileType?.startsWith("image/") ? (
                            <img
                              src={
                                msg.file.fileUrl.startsWith("http")
                                  ? msg.file.fileUrl
                                  : `http://localhost:5006${msg.file.fileUrl}`
                              }
                              alt={msg.file.fileName}
                              onClick={() => {
                                const fullUrl = msg.file.fileUrl.startsWith("http")
                                  ? msg.file.fileUrl
                                  : `http://localhost:5006${msg.file.fileUrl}`;

                                // Agrupar todas las imágenes del chat (msg.file e imágenes múltiples)
                                const allImages = messages
                                  .flatMap((m) => {
                                    const imgs = [];
                                    if (m.file && m.file.fileType?.startsWith("image/")) {
                                      imgs.push({
                                        fileUrl: m.file.fileUrl,
                                        fileName: m.file.fileName,
                                      });
                                    }
                                    if (Array.isArray(m.images)) {
                                      imgs.push(...m.images);
                                    }
                                    return imgs;
                                  })
                                  .filter((img) => img.fileUrl); // Limpiar nulls

                                openImageModal(allImages, fullUrl);
                              }}
                              style={{
                                maxWidth: "100%",
                                borderRadius: "8px",
                                marginBottom: "4px",
                                cursor: "pointer", // 👈 importante para UX
                              }}
                            />
                          ) : (
                            <a
                              href={
                                msg.file.fileUrl.startsWith("http")
                                  ? msg.file.fileUrl
                                  : `http://localhost:5006${msg.file.fileUrl}`
                              }
                              download={msg.file.fileName}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                color: "#007bff",
                                textDecoration: "underline",
                                marginBottom: "4px",
                                display: "inline-block",
                              }}
                            >
                              📎 {msg.file.fileName}
                            </a>
                          )
                        ) : null}

                        {/* Imágenes agrupadas recibidas */}
                        {msg.images?.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              marginBottom: "8px",
                            }}
                          >
                            {msg.images.slice(0, 4).map((img, i) => {
                              const isLastVisible = i === 3 && msg.images.length > 4;
                              const fullUrl = img.fileUrl.startsWith("http")
                                ? img.fileUrl
                                : `http://localhost:5006${img.fileUrl}`;

                              return (
                                <div
                                  key={i}
                                  style={{
                                    position: "relative",
                                    width: "100px",
                                    height: "100px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                  }}
                                  onClick={() => {
                                    openImageModal(msg.images, fullUrl);
                                  }}
                                >
                                  <img
                                    src={fullUrl}
                                    alt={img.fileName}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      filter: isLastVisible ? "brightness(0.5)" : "none",
                                      cursor: "pointer",
                                    }}
                                  />
                                  {isLastVisible && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        height: "100%",
                                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                                        color: "white",
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        fontSize: "16px",
                                        fontWeight: "bold",
                                        borderRadius: "8px",
                                      }}
                                    >
                                      +{msg.images.length - 4}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {msg.text && <span>{msg.text}</span>}

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
            {/* 📎 Adjuntar documentos (solo uno, no imágenes) */}
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
                name="document"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx,.csv,.zip"
                style={{ display: "none" }}
                onChange={handleUpload}
              />
            </label>

            {/* 🖼️ Subir imágenes múltiples */}
            <label
              style={{
                position: "absolute",
                left: "50px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
            >
              <FaImage style={{ color: inputText, fontSize: "18px" }} />
              <input
                type="file"
                name="image"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleUpload}
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
          {/* 🖼️ Modal de vista previa de imagen */}
          {isImageModalOpen && (
            <div
              onClick={() => setIsImageModalOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                flexDirection: "row",
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev - 1 + imageGroup.length) % imageGroup.length);
                }}
                style={{
                  position: "absolute",
                  left: "20px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "32px",
                  cursor: "pointer",
                }}
              >
                ‹
              </button>

              <img
                src={
                  imageGroup[activeImageIndex]?.fileUrl.startsWith("http")
                    ? imageGroup[activeImageIndex]?.fileUrl
                    : `http://localhost:5006${imageGroup[activeImageIndex]?.fileUrl}`
                }
                alt="Vista previa"
                style={{
                  maxWidth: "90%",
                  maxHeight: "90%",
                  borderRadius: "10px",
                  boxShadow: "0 0 10px #000",
                }}
              />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev + 1) % imageGroup.length);
                }}
                style={{
                  position: "absolute",
                  right: "20px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: "32px",
                  cursor: "pointer",
                }}
              >
                ›
              </button>
            </div>
          )}
        </div> // 👈 Este cierra el widget abierto
      )}
    </div> // 👈 Este cierra el contenedor principal
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
