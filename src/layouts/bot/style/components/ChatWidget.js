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
  const messagesEndRef = useRef(null);

  const conversationId = `bot-${botId}-user-${userId}`;
  const [iaWarning, setIaWarning] = useState(null);
  const textareaRef = useRef(null);
  const [typingSender, setTypingSender] = useState(null);

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
  // ⬇️ Pega esto después de `waitForConnection` y antes de `useEffect`
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    const filePayloads = [];

    const promises = files.map((file) => {
      return new Promise((resolve) => {
        if (!file || file.type.startsWith("image/")) {
          console.warn(`❌ ${file?.name} es una imagen o archivo inválido.`);
          return resolve(null);
        }

        if (file.size > maxSizeInBytes) {
          alert(`❌ ${file.name} excede los ${maxSizeInMB}MB permitidos.`);
          return resolve(null);
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result.split(",")[1]; // Quita el "data:...base64,"
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
      if (filePayloads.length === 0) {
        console.warn("⚠️ Archivo inválido o vacío.");
        return;
      }

      const payload = {
        botId,
        userId,
        multipleFiles: filePayloads,
      };

      try {
        await waitForConnection();
        await connection.invoke("SendFile", conversationId, payload);
        // 👉 Este mensaje es simbólico, solo para que la IA lo vea como texto
        const phantomMessage = {
          botId,
          userId,
          question:
            "📎 El usuario ha enviado un archivo para revisión manual. No es necesario procesarlo.",
        };

        try {
          await connection.invoke("SendMessage", conversationId, phantomMessage);
          console.log("📨 Mensaje fantasma enviado a la IA");
        } catch (err) {
          console.error("❌ Error enviando mensaje fantasma:", err);
        }
      } catch (err) {
        console.error("❌ Error enviando documentos:", err);
      }
    });
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const maxSizeInMB = 5;
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

    const imagePayloads = [];

    const promises = files.map((file) => {
      return new Promise((resolve) => {
        if (!file.type.startsWith("image/")) {
          alert(`❌ ${file.name} no es una imagen válida.`);
          return resolve(null);
        }

        if (file.size > maxSizeInBytes) {
          alert(`❌ ${file.name} excede los ${maxSizeInMB}MB permitidos.`);
          return resolve(null);
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result.split(",")[1]; // Elimina el header "data:image/..."
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

      const payload = {
        botId,
        userId,
        multipleFiles: imagePayloads,
      };

      try {
        await waitForConnection();
        await connection.invoke("SendFile", conversationId, payload);
        // 👉 Este mensaje es simbólico, solo para que la IA lo vea como texto
        const phantomMessage = {
          botId,
          userId,
          question:
            "📎 El usuario ha enviado un archivo para revisión manual. No es necesario procesarlo.",
          meta: { internalOnly: true },
        };

        try {
          await connection.invoke("SendMessage", conversationId, phantomMessage);
          console.log("📨 Mensaje fantasma enviado a la IA");
        } catch (err) {
          console.error("❌ Error enviando mensaje fantasma:", err);
        }
      } catch (err) {
        console.error("❌ Error enviando imágenes agrupadas:", err);
      }
    });
  };

  // ✅ SignalR Setup
  useEffect(() => {
    const startConnection = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
          console.log("✅ Conectado a SignalR");
        } else {
          console.log("🔄 SignalR ya está conectado o en proceso:", connection.state);
        }

        await waitForConnection();
        await connection.invoke("JoinRoom", conversationId);
      } catch (err) {
        console.error("❌ Error conectando a SignalR:", err);
      }
    };

    startConnection();

    const handleReceiveMessage = async (msg) => {
      setIsTyping(true);

      // 🕐 Simula latencia de IA (1.5s - 3s)
      const delay = Math.random() * 1500 + 1500;
      await new Promise((res) => setTimeout(res, delay));

      // 🔒 Evitar mostrar mensajes fantasma al usuario
      const isPhantomMessage = msg.text?.includes(
        "📎 El usuario ha enviado un archivo para revisión manual"
      );
      if (isPhantomMessage) {
        setIsTyping(false);
        return; // ❌ No lo agregues al chat
      }

      if (msg.multipleFiles && Array.isArray(msg.multipleFiles)) {
        setMessages((prev) => [
          ...prev,
          {
            from: msg.from,
            files: msg.multipleFiles,
            timestamp: msg.timestamp || new Date().toISOString(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            from: msg.from,
            text: msg.text || null,
            fileName: msg.fileName || null,
            fileType: msg.fileType || null,
            fileContent: msg.fileContent || null,
            timestamp: msg.timestamp || new Date().toISOString(),
          },
        ]);
      }

      if (msg.text?.includes("aún no está conectado")) {
        setIaWarning("Este bot aún no está conectado a una IA. Pronto estará disponible.");
      }

      setIsTyping(false);
    };

    const handleTyping = (sender = "bot") => {
      setIsTyping(true);
      setTypingSender(sender); // puede ser "bot" o "user" si en el futuro lo usas
    };

    const handleClose = (error) => {
      console.warn("🔌 Conexión cerrada:", error);
    };

    connection.on("ReceiveMessage", handleReceiveMessage);
    connection.on("Typing", handleTyping);
    connection.onclose(handleClose);

    return () => {
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

  // ✅ Enviar mensaje
  const sendMessage = async () => {
    if (!message.trim()) return;

    const msg = message.trim();
    setMessage("");

    const payload = { botId, userId, question: msg };

    // 🔌 Asegura conexión antes de enviar
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
      await createConversation({ userId, botId });
    } catch (error) {
      console.warn(
        "⚠️ Conversación ya existente o error al crearla:",
        error?.response?.data || error.message
      );
    }

    try {
      await connection.invoke("SendMessage", conversationId, payload);
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

  const {
    backgroundColor,
    textColor,
    headerBackground,
    borderColor,
    inputBg,
    inputText,
    inputBorder,
    buttonBg,
    buttonColor,
  } = themeConfig[themeKey] || themeConfig.light;

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

  const avatarFloatingStyle = {
    width: "70px",
    height: "70px",
    borderRadius: "50%",
    objectFit: "contain",
    border: `2px solid ${primaryColor}`,
  };

  const avatarHeaderStyle = {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "contain",
    border: `1px solid ${primaryColor}`,
  };

  const inputContainerStyle = {
    position: "relative",
    marginTop: "10px",
    width: "100%",
  };

  const inputStyle = {
    width: "80%",
    padding: "10px 40px 10px 35px",
    borderRadius: "12px",
    border: `1.5px solid ${inputBorder}`,
    fontFamily,
    fontSize: "14px",
    outline: "none",
    color: inputText,
    backgroundColor: inputBg,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
  };

  const iconStyleLeft = {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: inputText,
    fontSize: "16px",
    cursor: "pointer",
  };

  const iconStyleRight = {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: inputText,
    fontSize: "16px",
    cursor: "pointer",
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

            {messages.map((msg, index) => {
              const isUser = msg.from === "user";

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
                <div key={index} style={containerStyle}>
                  {/* 📎 Archivos múltiples */}
                  {msg.files && Array.isArray(msg.files) && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {msg.files.map((file, i) =>
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
                              display: "block",
                              color: "#007bff",
                              textDecoration: "underline",
                            }}
                          >
                            📎 {file.fileName}
                          </a>
                        )
                      )}
                    </div>
                  )}

                  {/* 📄 Archivo o imagen individual */}
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

                  {/* 💬 Texto */}
                  {msg.text && <span>{msg.text}</span>}

                  {/* 🕒 Timestamp */}
                  {msg.timestamp && (
                    <span
                      style={{
                        fontSize: "10px",
                        color: "#555",
                        marginTop: "4px",
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
              );
            })}

            {isTyping && typingSender === "bot" && (
              <div
                style={{
                  alignSelf: "flex-start",
                  backgroundColor:
                    primaryColor.toLowerCase() === secondaryColor.toLowerCase()
                      ? fallbackBgColor
                      : secondaryColor,
                  color:
                    primaryColor.toLowerCase() === secondaryColor.toLowerCase()
                      ? fallbackTextColor
                      : primaryColor,
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
                Escribiendo...
              </div>
            )}

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
              onChange={(e) => {
                setMessage(e.target.value);
                autoResizeTextarea();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                  setMessage(""); // 🧹 Limpiar input

                  // Esperar al siguiente ciclo de render y resetear altura
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
                maxHeight: "160px", // opcional: altura máxima
                padding: "10px 42px 10px 70px",
                borderRadius: "12px",
                border: `1.5px solid ${inputBorder}`,
                fontFamily,
                fontSize: "14px",
                outline: "none",
                color: inputText,
                backgroundColor: inputBg,
                resize: "none",
                overflow: "", // ⛔ oculta scroll
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
