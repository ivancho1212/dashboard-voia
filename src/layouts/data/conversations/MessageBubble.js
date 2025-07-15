import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const MessageBubble = React.forwardRef(
  ({ msg, onReply, onJumpToReply, isHighlighted, setViewerOpen }, ref) => {
    const { from, text, timestamp, files = [], replyTo } = msg;
    const isRight = from === "admin" || from === "bot";
    const backgroundColor = from === "user" ? "#e0f7fa" : from === "admin" ? "#d0f0c0" : "#f1f1f1";

    const formattedTime = timestamp
      ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "";

    const [previewIndex, setPreviewIndex] = useState(null);
    const [imageOptionsOpen, setImageOptionsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState(null);
    const [isHovered, setIsHovered] = useState(false);

    const optionsRef = useRef(null);
    const iconRef = useRef(null);
    const bubbleRef = useRef(null);
    const imageFiles = (files || msg.images || []).filter((file) =>
      file.fileType?.startsWith("image/")
    );
    const showOptionsIcon = isHovered && (text || imageFiles.length > 0);

    const handlePrev = () =>
      setPreviewIndex((prev) => (prev > 0 ? prev - 1 : imageFiles.length - 1));
    const handleNext = () =>
      setPreviewIndex((prev) => (prev < imageFiles.length - 1 ? prev + 1 : 0));

    const BACKEND_URL = "http://localhost:5006"; // Usa .env en producción

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (
          optionsRef.current &&
          !optionsRef.current.contains(e.target) &&
          (!iconRef.current || !iconRef.current.contains(e.target))
        ) {
          setImageOptionsOpen(false);
        }
      };

      if (imageOptionsOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.body.style.overflow = ""; // Asegura desbloqueo en desmontaje
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [imageOptionsOpen]);

    useEffect(() => {
      const chatContainer = document.getElementById("chat-container");

      // ✅ Notificar al componente padre
      if (typeof setViewerOpen === "function") {
        setViewerOpen(imageOptionsOpen);
      }

      if (imageOptionsOpen) {
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        if (chatContainer) chatContainer.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        if (chatContainer) chatContainer.style.overflow = "auto";
      }

      return () => {
        // Al desmontarse, asegurar desbloqueo y notificar cierre
        if (typeof setViewerOpen === "function") {
          setViewerOpen(false);
        }

        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        if (chatContainer) chatContainer.style.overflow = "auto";
      };
    }, [imageOptionsOpen, setViewerOpen]);

    const buildFileUrl = (fileUrl) => {
      if (!fileUrl) return "";
      const cleanBase = BACKEND_URL.replace(/\/$/, "");
      const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
      return `${cleanBase}${cleanPath}`;
    };

    const downloadImagesAsZip = async (images) => {
      const zip = new JSZip();
      const folder = zip.folder("imagenes");

      for (const file of images) {
        try {
          const url = buildFileUrl(file.fileUrl);
          console.log("⛔ Intentando descargar:", url); // Agrega esto
          const response = await fetch(url);

          if (!response.ok) throw new Error(`Error al descargar: ${file.fileName}`);

          const blob = await response.blob();
          folder.file(file.fileName || "imagen.jpg", blob);
        } catch (err) {
          console.error("Falló al descargar archivo:", file.fileUrl, err);
          alert(`Error al descargar: ${file.fileName}`);
          return;
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "imagenes.zip");
    };

    return (
      <div
        ref={(el) => {
          ref && (typeof ref === "function" ? ref(el) : (ref.current = el));
          bubbleRef.current = el;
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="message-bubble"
        style={{
          alignSelf: isRight ? "flex-end" : "flex-start",
          backgroundColor,
          color: "#1a1a1a",
          padding: "10px 14px",
          borderRadius: "16px",
          maxWidth: "75%",
          minWidth: "120px",
          fontSize: "14px",
          fontFamily: "Arial",
          marginBottom: "8px",
          marginLeft: isRight ? "40px" : "0px",
          marginRight: isRight ? "0px" : "40px",
          boxShadow: isHighlighted
            ? "0 0 10px 4px rgba(33,150,243,0.6)"
            : "0 1px 4px rgba(0, 0, 0, 0.1)",
          transition: "box-shadow 0.3s ease-in-out",
          position: "relative",
        }}
      >
        {!isRight && (
          <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: "#555" }}>
            {from === "user" ? "Usuario" : from === "bot" ? "Bot" : "Admin"}
          </div>
        )}

        {replyTo && (
          <div
            onClick={() => onJumpToReply?.(replyTo.id)}
            style={{
              background: "#f0f0f0",
              borderLeft: "3px solid #2196f3",
              padding: "6px 10px",
              marginBottom: "6px",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#2196f3",
              fontStyle: "italic",
              maxWidth: "90%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: "pointer",
            }}
          >
            {replyTo.text || replyTo.fileName || "mensaje anterior"}
          </div>
        )}

        {showOptionsIcon && (
          <div
            ref={iconRef}
            style={{
              position: "absolute",
              top: "6px",
              right: "10px",
              zIndex: 10,
              fontSize: "20px",
              color: "gray",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            onClick={() => {
              if (!imageOptionsOpen && iconRef.current) {
                const rect = iconRef.current.getBoundingClientRect();
                const isBottomHalf = rect.top > window.innerHeight / 2;
                const left = isRight ? rect.left - 158 : rect.right + 8;

                setMenuPosition({
                  position: "fixed",
                  top: isBottomHalf ? undefined : rect.top + 20,
                  bottom: isBottomHalf ? window.innerHeight - rect.bottom + 10 : undefined,
                  left,
                  zIndex: 9999,
                });
              }
              setImageOptionsOpen((prev) => !prev);
            }}
          >
            ⋮
          </div>
        )}
        {imageOptionsOpen && menuPosition && (
          <div
            ref={optionsRef}
            style={{
              ...menuPosition,
              backgroundColor: "#fff",
              border: "1px solid #ccc",
              borderRadius: "6px",
              padding: "4px 0",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              fontSize: "12px",
              width: "160px",
            }}
          >
            {imageFiles.length > 0 && (
              <>
                {/* Ver imagen (abre visor) */}
                <div
                  style={{ padding: "6px 12px", cursor: "pointer" }}
                  onClick={() => {
                    setPreviewIndex(0);
                    setImageOptionsOpen(false);
                  }}
                >
                  Ver
                </div>

                {/* Si hay solo una imagen, opción para descargarla */}
                {imageFiles.length === 1 && (
                  <div
                    style={{ padding: "6px 12px", cursor: "pointer" }}
                    onClick={() => {
                      const file = imageFiles[0];
                      const link = document.createElement("a");
                      link.href = `${BACKEND_URL}${file.fileUrl}`;
                      link.download = file.fileName || "imagen.jpg";
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      setImageOptionsOpen(false);
                    }}
                  >
                    Descargar
                  </div>
                )}

                {/* Si hay más de una imagen, opción para descargar todo como ZIP */}
                {imageFiles.length > 1 && (
                  <div
                    style={{ padding: "6px 12px", cursor: "pointer" }}
                    onClick={async () => {
                      await downloadImagesAsZip(imageFiles);
                      setImageOptionsOpen(false);
                    }}
                  >
                    Descargar todo
                  </div>
                )}
              </>
            )}

            {text && (
              <div
                style={{ padding: "6px 12px", cursor: "pointer", color: "Gray" }}
                onClick={() => {
                  navigator.clipboard.writeText(text);
                  setImageOptionsOpen(false);
                }}
              >
                Copiar
              </div>
            )}

            <div
              style={{ padding: "6px 12px", cursor: "pointer", color: "Gray" }}
              onClick={() => {
                onReply && onReply(msg);
                setImageOptionsOpen(false);
              }}
            >
              Responder
            </div>
          </div>
        )}

        {imageFiles.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
            {imageFiles.slice(0, 4).map((file, idx) => {
              const source = buildFileUrl(file.fileUrl);
              if (!source) return null;
              const isOverlay = imageFiles.length > 4 && idx === 3;

              return (
                <div
                  key={idx}
                  style={{
                    position: "relative",
                    borderRadius: "8px",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => setPreviewIndex(idx)}
                >
                  <img
                    src={`${BACKEND_URL}${file.fileUrl}`}
                    alt={file.fileName}
                    style={{ maxWidth: "180px", borderRadius: "8px", opacity: isOverlay ? 0.5 : 1 }}
                  />
                  {isOverlay && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        color: "white",
                        fontWeight: "bold",
                        backgroundColor: "rgba(0,0,0,0.4)",
                      }}
                    >
                      +{imageFiles.length - 3}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {files
          .filter((file) => !file.fileType.startsWith("image/"))
          .map((file, idx) => {
            const source = buildFileUrl(file.fileUrl); // ✅ CORRECTO
            if (!source) return null;
            return (
              <div key={idx} style={{ marginTop: "6px" }}>
                <a
                  href={source}
                  download={file.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007bff", textDecoration: "underline", fontSize: "14px" }}
                >
                  📎 {file.fileName}
                </a>
              </div>
            );
          })}

        {text && files.length === 0 && <div>{text}</div>}

        <div style={{ fontSize: "10px", color: "#555", marginTop: "4px", textAlign: "right" }}>
          {formattedTime}
        </div>

        {previewIndex !== null && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0,0,0,0.85)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
            onClick={() => setPreviewIndex(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              style={{
                position: "absolute",
                top: "50%",
                left: "10px",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "2px solid #fff",
                borderRadius: "50%",
                color: "#fff",
                fontSize: "20px",
                cursor: "pointer",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ❮
            </button>
            <img
              src={`${BACKEND_URL}${imageFiles[previewIndex].fileUrl}`}
              alt={imageFiles[previewIndex].fileName}
              style={{
                maxWidth: "75%",
                maxHeight: "70vh",
                borderRadius: "10px",
                boxShadow: "0 0 10px rgba(0,0,0,0.3)",
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              style={{
                position: "absolute",
                top: "50%",
                right: "10px",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "2px solid #fff",
                borderRadius: "50%",
                color: "#fff",
                fontSize: "20px",
                cursor: "pointer",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ❯
            </button>
            {/* Mostrar botón individual solo si es una imagen */}
            {imageFiles.length === 1 && (
              <a
                href={`${BACKEND_URL}${imageFiles[0].fileUrl}`}
                download={imageFiles[0].fileName}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "#fff",
                  color: "#000",
                  padding: "6px 12px",
                  fontSize: "13px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                Descargar
              </a>
            )}

            {/* Mostrar botón de "descargar todo" solo si hay más de una imagen */}
            {imageFiles.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImagesAsZip(imageFiles);
                }}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "#fff",
                  color: "#000",
                  padding: "6px 12px",
                  fontSize: "13px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                Descargar todo
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

MessageBubble.propTypes = {
  msg: PropTypes.shape({
    from: PropTypes.oneOf(["user", "bot", "admin"]).isRequired,
    text: PropTypes.string,
    timestamp: PropTypes.string,
    files: PropTypes.arrayOf(
      PropTypes.shape({
        fileName: PropTypes.string.isRequired,
        fileType: PropTypes.string.isRequired,
        fileContent: PropTypes.string,
        url: PropTypes.string,
        fileUrl: PropTypes.string, // opcional si usas ambos
      })
    ),
    images: PropTypes.arrayOf(
      PropTypes.shape({
        fileName: PropTypes.string.isRequired,
        fileType: PropTypes.string.isRequired,
        fileUrl: PropTypes.string.isRequired,
      })
    ),
    replyTo: PropTypes.shape({
      id: PropTypes.any,
      text: PropTypes.string,
      fileName: PropTypes.string,
    }),
  }).isRequired,
  onReply: PropTypes.func,
  onJumpToReply: PropTypes.func,
  isHighlighted: PropTypes.bool,
  setViewerOpen: PropTypes.func,
};

export default React.memo(MessageBubble);
