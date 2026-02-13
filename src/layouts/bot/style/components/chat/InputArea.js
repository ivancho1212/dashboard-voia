import { sendChatFile, sendGroupedImages } from "services/chatUploadedFilesService";
import { FaPaperclip, FaImage, FaPaperPlane } from "react-icons/fa";
import React, { useRef } from "react";
import PropTypes from "prop-types";

const InputArea = ({
  inputText,
  inputBg,
  inputBorder,
  fontFamily,
  message,
  setMessage,
  textareaRef,
  sendMessage,
  connectionRef,
  conversationId,
  isInputDisabled,
  disabledPlaceholder,
  userId,
  allowImageUpload,
  allowFileUpload,
  onFileSent, // Callback cuando se envía un archivo (para mostrar optimista)
}) => {
  const typingTimeoutRef = useRef(null);

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // ✅ Lógica para detener el indicador de escritura
  const handleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    const connection = connectionRef.current;
    if (connection && connection.state === "Connected" && conversationId) {
              connection.invoke("StopTyping", conversationId, "user").catch(err => console.error("Error en StopTyping:", err));
    }
  };

  // ✅ Lógica para iniciar el indicador de escritura con debounce
  const handleTyping = (text) => {
    setMessage(text);
    autoResizeTextarea();

    const connection = connectionRef.current;
    if (connection && connection.state === "Connected" && conversationId) {
      if (text.trim()) {
        // ✅ Usa el nombre correcto del método: SendTyping
        connection.invoke("Typing", conversationId, "user").catch(err => console.error("Error en Typing:", err));
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(handleStopTyping, 2000); // 2 segundos de inactividad
      } else {
        handleStopTyping(); // Si el texto está vacío, detener inmediatamente
      }
    }
  };

  const handleSendMessage = () => {
    if (isInputDisabled || !message.trim()) return;
    handleStopTyping(); // Detener el typing al enviar
    sendMessage();
    setMessage("");
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    });
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files);
    event.target.value = null;

    const maxSizeInBytes = 5 * 1024 * 1024;
    const isImage = (file) => file.type.startsWith("image/");

    const images = files.filter(isImage);
    const documents = files.filter((file) => !isImage(file));

    const connection = connectionRef.current;
    if (!connection || connection.state !== "Connected") {
      console.error("❌ No hay conexión SignalR activa para subir archivos");
      return;
    }

    if (images.length > 0) {
      for (const img of images) {
        if (img.size > maxSizeInBytes) {
          alert(`❌ La imagen ${img.name} excede los 5MB.`);
          return;
        }
      }

      if (images.length === 1) {
        const res = await sendChatFile({ connection, conversationId, file: images[0], userId });
        if (onFileSent && res?.fileUrl) {
          // res.base64 ya es data URL completa (fileToBase64 usa readAsDataURL)
          const preview = res.base64 && res.base64.startsWith("data:") ? res.base64 : (res.base64 ? `data:${images[0].type};base64,${res.base64}` : null);
          onFileSent({ fileUrl: res.fileUrl, fileName: res.data?.fileName || images[0].name, fileType: res.data?.fileType || images[0].type, fileContent: preview });
        }
      } else {
        if (images.length > 10) {
          alert("❌ Máximo 10 imágenes.");
          return;
        }
        const res = await sendGroupedImages({ connection, conversationId, files: images, userId });
        if (onFileSent && res?.multipleFiles?.length) onFileSent({ multipleFiles: res.multipleFiles });
      }
      return;
    }

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

      const res = await sendChatFile({ connection, conversationId, file, userId });
      if (onFileSent && res?.fileUrl) {
        onFileSent({ fileUrl: res.fileUrl, fileName: res.data?.fileName || file.name, fileType: res.data?.fileType || file.type });
      }
    }
  };

  return (
    <div
      style={{
        position: "relative",
        padding: "10px 10px",
      }}
    >
      {(allowImageUpload || allowFileUpload) && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            position: "absolute",
            left: "20px",
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          {allowFileUpload && (
            <label style={{ cursor: isInputDisabled ? "not-allowed" : "pointer" }}>
              <FaPaperclip style={{ color: inputText, fontSize: "18px" }} />
              <input
                type="file"
                name="document"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx"
                style={{ display: "none" }}
                onChange={handleUpload}
                disabled={isInputDisabled}
                aria-label="Subir documento"
              />
            </label>

          )}
          {allowImageUpload && (
            <label style={{ cursor: isInputDisabled ? "not-allowed" : "pointer" }}>
              <FaImage
                style={{ color: inputText, fontSize: "18px", }}
              />
              <input
                type="file"
                name="image"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={handleUpload}
                disabled={isInputDisabled}
              />
            </label>
          )}
        </div>
      )}

      <textarea
        ref={textareaRef}
        placeholder={
          isInputDisabled ? (disabledPlaceholder || "Chat no disponible.") : "Escribe un mensaje..."
        }
        value={message}
        disabled={isInputDisabled}
        onChange={(e) => {
          handleTyping(e.target.value);
          if (typeof onUserActivity === 'function') onUserActivity();
        }}
        onBlur={handleStopTyping}
        onKeyDown={(e) => {
          if (isInputDisabled) return;

          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
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
          fontSize: "13px",
          outline: "none",
          color: "#000",
          backgroundColor: inputBg,
          resize: "none",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
          lineHeight: "1.5",
        }}
      />

      <button
        onClick={handleSendMessage}
        disabled={isInputDisabled || !message.trim()}
        style={{
          position: "absolute",
          right: "20px",
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          cursor: isInputDisabled || !message.trim() ? "not-allowed" : "pointer",
          padding: 0,
        }}
        aria-label="Enviar mensaje"
      >
        <FaPaperPlane style={{ color: inputText, fontSize: "18px" }} />
      </button>

    </div>
  );
};

InputArea.propTypes = {
  inputText: PropTypes.string,
  inputBg: PropTypes.string,
  inputBorder: PropTypes.string,
  fontFamily: PropTypes.string,
  message: PropTypes.string.isRequired,
  setMessage: PropTypes.func.isRequired,
  textareaRef: PropTypes.object.isRequired,
  sendMessage: PropTypes.func.isRequired,
  connectionRef: PropTypes.object,
  conversationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isInputDisabled: PropTypes.bool,
  disabledPlaceholder: PropTypes.string,
  allowImageUpload: PropTypes.bool,
  allowFileUpload: PropTypes.bool,
  onFileSent: PropTypes.func,
  onUserActivity: PropTypes.func,
};

export default InputArea;
