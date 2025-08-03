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
  userId,
  allowImageUpload,
  allowFileUpload,
}) => {

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
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
        await sendChatFile({ connection, conversationId, file: images[0], userId });
      } else {
        if (images.length > 10) {
          alert("❌ Máximo 10 imágenes.");
          return;
        }
        await sendGroupedImages({ connection, conversationId, files: images, userId });
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

      await sendChatFile({ connection, conversationId, file, userId });
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
              <FaPaperclip
                style={{ color: inputText, fontSize: "18px", }}
              />
              <input
                type="file"
                name="document"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.xlsx"
                style={{ display: "none" }}
                onChange={handleUpload}
                disabled={isInputDisabled}
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

      {/* 📝 Textarea */}
      <textarea
        ref={textareaRef}
        placeholder={
          isInputDisabled ? "Modo demo activo: no puedes escribir." : "Escribe un mensaje..."
        }
        value={message}
        disabled={isInputDisabled}
        onChange={async (e) => {
          const text = e.target.value;
          setMessage(text);
          autoResizeTextarea();

          if (text.trim()) {
            const connection = connectionRef.current;
            if (connection && connection.state === "Connected") {
              try {
                await connection.invoke("Typing", conversationId, "user");
              } catch (err) {
                console.error("❌ Error enviando Typing del usuario:", err);
              }
            }
          }
        }}
        onKeyDown={(e) => {
          if (isInputDisabled) return;

          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
            setMessage("");

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
          color: "#000",
          backgroundColor: inputBg,
          resize: "none",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
          lineHeight: "1.5",
        }}
      />

      {/* 🚀 Icono de enviar */}
      <FaPaperPlane
        onClick={!isInputDisabled ? sendMessage : undefined}
        style={{
          position: "absolute",
          right: "20px",
          top: "50%",
          transform: "translateY(-50%)",
          color: inputText,
          fontSize: "18px",
          cursor: isInputDisabled ? "not-allowed" : "pointer",
        }}
      />
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
  conversationId: PropTypes.string,
  userId: PropTypes.string,
  isInputDisabled: PropTypes.bool,
  allowImageUpload: PropTypes.bool,
  allowFileUpload: PropTypes.bool,
};

export default InputArea;
