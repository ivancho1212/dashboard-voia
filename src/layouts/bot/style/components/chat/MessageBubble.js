import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { sanitizeMessage } from "../../../../../utils/sanitizeUtils";
import { FaExclamationCircle } from "react-icons/fa";
import { getSenderColor } from "utils/colors";

function MessageBubble({ message, index, messageRef, fontFamily, openImageModal, isMobileView }) {
  const isUser = message.from === "user";
  const isAI = message.from === "ai" || message.from === "bot";
  const isAdmin = message.from === "admin";
  const isSending = isUser && message.status === "sending";
  const isError = isUser && message.status === "error";

  let backgroundColor = "#f5f5f5";
  let textColor = "#1a1a1a";

  // Colores para los estados del usuario
  if (isUser) {
    if (isSending) backgroundColor = "#e0f7fa"; // celeste claro (enviando)
    else if (isError) backgroundColor = "#fcd6d6"; // rojo claro (error)
    else backgroundColor = "#d6e7fa"; // azul claro (enviado)
    textColor = "#1a1a1a";
  } else if (isAI || isAdmin) {
    const { backgroundColor: bg, textColor: tc } = getSenderColor(message.from);
    backgroundColor = bg;
    textColor = tc;
  }

  const files = message.multipleFiles || (message.file ? [message.file] : []) || [];
  // ✅ FIX: Usar files si message.images es array vacío ([] es truthy en JS, causaba que no se detecten imágenes)
  const imageSource = (message.images && message.images.length > 0) ? message.images : files;
  const imageFiles = imageSource.filter((f) => f?.fileType?.startsWith("image/"));
  const hasImage = imageFiles.length > 0 || message.file?.fileType?.startsWith("image/");
  const hasFiles = Boolean(message.file || (message.multipleFiles && message.multipleFiles.length > 0) || (message.images && message.images.length > 0));
  const hasOnlyFiles = !message.text && hasFiles;
  
  const singleImageOnly = hasOnlyFiles && ( (message.file && message.file.fileType?.startsWith("image/")) || imageFiles.length === 1 );
  const multipleImagesOnly = hasOnlyFiles && imageFiles.length > 1;

  const containerStyle = {
    alignSelf: isUser ? "flex-end" : "flex-start",
    alignItems: hasImage ? "center" : (isUser ? "flex-end" : "flex-start"),
    backgroundColor,
    color: textColor,
  // Reduce padding when the message contains only an image so the bubble hugs the image
  padding: singleImageOnly ? "4px" : (hasOnlyFiles ? "4px" : hasImage ? "2px" : "2px 10px"),
  borderRadius: hasImage ? "12px" : "14px",
  // Single image: 180px. Grupo: widget 220px. Móvil: mismo tamaño (min 180px, max 220px)
  maxWidth: singleImageOnly ? "180px" : (multipleImagesOnly ? "220px" : (hasOnlyFiles ? "none" : "80%")),
  minWidth: singleImageOnly ? "0" : (multipleImagesOnly && isMobileView ? "180px" : (hasOnlyFiles ? "0" : "80px")),
  width: singleImageOnly ? "auto" : (hasOnlyFiles ? "auto" : "fit-content"),
    wordBreak: "break-word",
    fontSize: "13px",
    fontFamily,
    display: singleImageOnly ? "inline-block" : "inline-flex",
    flexDirection: "column",
    boxSizing: "border-box",
    opacity: isSending ? 0.95 : 1,
    boxShadow: "0 1px 4px rgba(0, 0, 0, 0.06)",
    marginBottom: "4px",
    marginLeft: isUser ? "8px" : "0px",
    marginRight: isUser ? "0px" : "8px",
  };


  const truncateName = (name, max = 28) => {
    if (!name) return "";
    if (name.length <= max) return name;
    const extMatch = name.match(/(\.[^.]*)$/);
    const ext = extMatch ? extMatch[1] : "";
    const base = ext ? name.slice(0, name.length - ext.length) : name;
    const head = base.slice(0, Math.max(8, Math.floor((max - 3) / 2)));
    const tail = base.slice(-Math.max(6, Math.floor((max - 3) / 4)));
    return `${head}...${tail}${ext}`;
  };

  // Local preview handling: if the message contains a raw File object (client-side temp message),
  // create an object URL so we can render an immediate thumbnail while upload is in progress.
  const [localPreview, setLocalPreview] = React.useState(null);
  React.useEffect(() => {
    setLocalPreview(null);
    const filesList = message.multipleFiles || (message.file ? [message.file] : []);
    if (filesList && filesList.length === 1) {
      const f = filesList[0];
      const raw = (typeof File !== "undefined" && f instanceof File) ? f : (f && (f.file instanceof File ? f.file : (f.raw instanceof File ? f.raw : null)));
      if (raw) {
        const url = URL.createObjectURL(raw);
        setLocalPreview(url);
        return () => {
          try { URL.revokeObjectURL(url); } catch (e) {}
          setLocalPreview(null);
        };
      }
    }
    return undefined;
  }, [message.multipleFiles, message.file]);

  // State to store blob URLs for images
  const [imageBlobUrls, setImageBlobUrls] = useState({});
  const [blobsLoading, setBlobsLoading] = useState(false);
  const blobUrlsRef = React.useRef({});

  // Evitar doble/triple prefijo data:...;base64, (caché, payload legacy o backend)
  const normalizeDataUrl = (url) => {
    if (!url || typeof url !== "string") return url;
    let s = url;
    while (/^data:[^;]+;base64,data:/i.test(s)) {
      s = s.replace(/^data:[^;]+;base64,/, "");
    }
    return s;
  };

  // Helper function to get the backend API URL
  const getBackendUrl = () => {
    if (window.__VOIA_BACKEND_URL__) return window.__VOIA_BACKEND_URL__;
    const envUrl = typeof process !== "undefined" && process.env?.REACT_APP_API_URL;
    if (envUrl) return envUrl.replace(/\/$/, "");
    const { protocol, hostname } = typeof window !== "undefined" ? window.location : { protocol: "http:", hostname: "localhost" };
    return `${protocol}//${hostname}:5006`;
  };

  // Fetch image as blob and convert to blob URL
  const fetchImageAsBlob = async (fileUrl) => {
    if (!fileUrl) return null;
    
    try {
      // Build full URL
      let fullUrl = fileUrl;
      if (!fileUrl.startsWith("http")) {
        fullUrl = `${getBackendUrl()}${fileUrl.includes("/api/files/chat/") && !fileUrl.includes("/inline") ? fileUrl + "/inline" : fileUrl}`;
      }
      
      
      // 🔹 CORS FIX: No incluir credenciales para URLs públicas de archivos
      // Esto evita OpaqueResponseBlocking cuando el servidor tiene Access-Control-Allow-Credentials: *
      const fetchOptions = {
        method: 'GET'
      };
      
      // Solo incluir credenciales si es una URL interna protegida (no de archivos públicos)
      if (!fullUrl.includes('/api/files/chat/') && !fullUrl.includes('/uploads/')) {
        fetchOptions.credentials = 'include';
      }
      
      const response = await fetch(fullUrl, fetchOptions);
      
      if (!response.ok) {
        console.warn(`[fetchImageAsBlob] Failed to fetch: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      return { fileUrl, blobUrl };
    } catch (error) {
      console.error(`[fetchImageAsBlob] Error fetching image: ${fileUrl}`, error);
      return null;
    }
  };

  // Load images as blobs when multipleFiles change
  // Para /uploads/ NO usamos fetch (CORS falla en widget embebido) - usamos URL directa en <img>
  const isPublicUpload = (url) => url && (url.startsWith("/uploads/") || url.startsWith("http"));
  useEffect(() => {
    const loadImages = async () => {
      if (!message.multipleFiles || message.multipleFiles.length === 0) {
        setBlobsLoading(false);
        return;
      }
      const imageFiles = message.multipleFiles.filter((f) =>
        f.fileType?.startsWith("image/") || ["jpg", "jpeg", "png", "gif", "webp"].some((ext) => (f.fileName || "").toLowerCase().endsWith(ext))
      );
      if (imageFiles.length === 0) {
        setBlobsLoading(false);
        return;
      }
      setBlobsLoading(true);
      const newBlobUrls = {};
      for (const file of imageFiles) {
        if (!file.fileUrl || imageBlobUrls[file.fileUrl]) continue;
        if (isPublicUpload(file.fileUrl)) continue; // Usar buildUrl directo para /uploads/
        const result = await fetchImageAsBlob(file.fileUrl);
        if (result && result.blobUrl) newBlobUrls[result.fileUrl] = result.blobUrl;
      }
      if (Object.keys(newBlobUrls).length > 0) setImageBlobUrls((prev) => ({ ...prev, ...newBlobUrls }));
      setBlobsLoading(false);
    };
    loadImages();
  }, [message.multipleFiles?.map((f) => f.fileUrl).join(",")]);

  blobUrlsRef.current = imageBlobUrls;

  // Cleanup blob URLs on unmount (usa ref para capturar el valor actual, evita fuga de memoria)
  useEffect(() => {
    return () => {
      Object.values(blobUrlsRef.current).forEach(blobUrl => {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (e) {}
      });
    };
  }, []);

  const buildUrl = (url) => {
    if (!url) return null;
    if (imageBlobUrls[url]) return imageBlobUrls[url];
    if (url.startsWith("http")) return url;
    if (url.startsWith("/api/") || url.startsWith("/uploads/")) {
      if (url.includes("/api/files/chat/") && !url.includes("/inline")) {
        return `${getBackendUrl()}${url}/inline`;
      }
      return `${getBackendUrl()}${url}`;
    }
    return `${getBackendUrl()}${url}`;
  };

  // Some servers return a presigned-upload URL (e.g. /api/ChatUploadedFiles/presigned-upload/{token})
  // that only accepts PUT. Browsers will try to GET image src and that results in OpaqueResponseBlocking
  // or aborted requests. Avoid returning such paths as image srcs — treat them as non-public until
  // the server provides a public filePath (e.g. /uploads/...).
  const safeImageUrl = (url) => {
    if (!url) return null;
    try {
      const full = url.startsWith("http") ? url : `http://localhost:5006${url}`;
      // If this looks like the presigned-upload PUT endpoint, don't use it as an <img> src
      if (full.includes("/presigned-upload")) return null;
      return full;
    } catch (e) {
      return null;
    }
  };

  return (
    <div ref={messageRef} style={containerStyle}>
      {/* Multiple files (images grid + docs) */}
      {message.multipleFiles?.length > 0 && (() => {
        const files = message.multipleFiles || [];
        // If there's exactly one file in multipleFiles and it's an image, render it like the single-image case
        if (files.length === 1 && files[0]?.fileType?.startsWith("image/")) {
          const file = files[0];
          const rawSrc = file.fileContent || file.preview || imageBlobUrls[file.fileUrl] || localPreview || (file.fileUrl ? buildUrl(file.fileUrl) : null);
          const srcCandidate = normalizeDataUrl(rawSrc);
          return (
            <div style={{ marginTop: "4px", display: "inline-block", width: "auto", maxWidth: "180px" }}>
                {srcCandidate ? (
                  <img
                    src={srcCandidate}
                    alt={file.fileName}
                    onClick={() => {
                      const blobMap = srcCandidate && srcCandidate.startsWith('blob:') ? { [file.fileUrl]: srcCandidate } : {};
                      openImageModal([file], srcCandidate, blobMap);
                    }}
                    onLoad={() => {}}
                    onError={(e) => console.error(`❌ [MessageBubble] Image failed to load: ${srcCandidate}`, e.target.status)}
                    style={{ display: "block", width: "100%", height: "auto", maxHeight: "300px", borderRadius: "10px", margin: 0, cursor: "pointer", objectFit: "contain" }}
                  />
                ) : (
                  <div style={{ padding: "8px 10px", backgroundColor: "#fff7e6", borderRadius: "8px", color: "#6a5a00", fontSize: "13px" }}>
                    Cargando imagen…<br />
                    <a href={buildUrl(file.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#0b63d6" }}>
                      📎 {file.fileName}
                    </a>
                  </div>
                )}
              </div>
          );
        }

        // Si hay un solo archivo y es documento (no imagen), renderizar como enlace de descarga
        if (files.length === 1 && !files[0]?.fileType?.startsWith("image/")) {
          const file = files[0];
          const href = buildUrl(file.fileUrl);
          return (
            <a href={href} download={file.fileName} target="_blank" rel="noopener noreferrer" title={file.fileName} style={{ padding: "8px 12px", backgroundColor: "#f5f9ff", borderRadius: "12px", textDecoration: "none", color: "#0b63d6", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.02)", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              📎 {truncateName(file.fileName)}
            </a>
          );
        }
        
        return (
          <>
            {/* Image thumbnails: widget compacto (200px). Móvil: mismo tamaño que widget (clamp 180–220px) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: isMobileView ? "6px" : "4px",
                marginBottom: "4px",
                width: isMobileView ? "clamp(180px, 55vw, 220px)" : "clamp(120px, 28vw, 200px)",
                boxSizing: "border-box",
              }}
            >
              {files.filter((file) =>
                ["jpg", "jpeg", "png", "gif", "webp"].some((ext) => file.fileName?.toLowerCase().endsWith(ext))
              )
                .slice(0, 4)
                .map((file, i, arr) => {
                  const isOverflowFourth = i === 3 && files.length > 4;
                  const rawSrc = file.fileContent || file.preview || imageBlobUrls[file.fileUrl] || (file.fileUrl ? buildUrl(file.fileUrl) : null);
                  const srcCandidate = normalizeDataUrl(rawSrc);

                  return (
                    <div
                      key={i}
                      style={{ position: "relative", aspectRatio: "1 / 1", overflow: "hidden", borderRadius: "8px", cursor: "pointer" }}
                      onClick={() => {
                        // Open modal starting at THIS image
                        // 🔹 Crear blobMap con todos los archivos que tengan blob URLs
                        const blobMap = {};
                        files.forEach(f => {
                          if (imageBlobUrls[f.fileUrl]) {
                            blobMap[f.fileUrl] = imageBlobUrls[f.fileUrl];
                          }
                        });
                        // 🔹 Pasar el índice CORRECTO del archivo clickeado
                        const clickedIndex = files.findIndex(f => f.fileUrl === file.fileUrl);
                        if (srcCandidate) openImageModal(files, srcCandidate, blobMap, clickedIndex >= 0 ? clickedIndex : i);
                      }}
                    >
                      {srcCandidate ? (
                        <img src={srcCandidate} alt={file.fileName} onError={(e) => { if (process.env.NODE_ENV === 'development') console.error(`❌ Image failed: ${file.fileName}`, e); }} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", color: "#666" }}>
                          ⏳
                        </div>
                      )}
                      {isOverflowFourth && (
                        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", color: "white", display: "flex", justifyContent: "center", alignItems: "center", fontSize: "18px", fontWeight: "700", borderRadius: "8px" }}>
                          +{files.length - 4}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Documents - NO MOSTRAR EN MÓVIL si solo hay imágenes */}
            {!(isMobileView && files.every(f => ["jpg", "jpeg", "png", "gif", "webp"].some((ext) => f.fileName?.toLowerCase().endsWith(ext)))) && (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {files.filter((file) => !["jpg", "jpeg", "png", "gif", "webp"].some((ext) => file.fileName?.toLowerCase().endsWith(ext)))
                  .map((file, i) => {
                    // 🔹 Usar buildUrl que agrega /inline para protegidos
                    const href = buildUrl(file.fileUrl);
                    return (
                      <a key={i} href={href} download={file.fileName} target="_blank" rel="noopener noreferrer" title={file.fileName} style={{ padding: "6px 10px", backgroundColor: "#f8f8f8", borderRadius: "6px", textDecoration: "none", color: "#007bff", fontSize: "14px", fontWeight: "500", wordBreak: "break-word", display: "inline-block", maxWidth: "220px" }}>
                          📎 {truncateName(file.fileName)}
                        </a>
                    );
                  })}
            </div>
            )}
          </>
        );
      })()}

      {/* Single file */}
      {message.file && (
          message.file.fileType?.startsWith("image/") ? (
            <div style={{ marginTop: "4px", display: "inline-block", width: "auto", maxWidth: "180px" }}>
              {(() => {
                const rawSrc = localPreview || message.file.fileContent || message.file.preview || imageBlobUrls[message.file.fileUrl] || (message.file.fileUrl ? buildUrl(message.file.fileUrl) : null);
                const srcCandidate = normalizeDataUrl(rawSrc);
                return (
                  srcCandidate ? (
                    <img
                      src={srcCandidate}
                      alt={message.file.fileName}
                      onClick={() => openImageModal([message.file], srcCandidate)}
                      onLoad={() => {}}
                      onError={(e) => console.error(`❌ Single file image failed: ${message.file.fileName}`, e)}
                      style={{ display: "block", width: "100%", height: "auto", maxHeight: "300px", borderRadius: "10px", margin: 0, cursor: "pointer", objectFit: "contain" }}
                    />
                  ) : (
                    <div style={{ padding: "8px 10px", backgroundColor: "#fff7e6", borderRadius: "8px", color: "#6a5a00", fontSize: "13px" }}>
                      Cargando imagen…<br />
                      <a href={buildUrl(message.file.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ color: "#0b63d6" }}>
                        📎 {message.file.fileName}
                      </a>
                    </div>
                  )
                );
              })()}
            {isSending && (
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.6)", borderRadius: "8px" }}>
                <svg width="36" height="36" viewBox="0 0 50 50">
                  <circle cx="25" cy="25" r="20" fill="none" stroke="#1976d2" strokeWidth="4" strokeDasharray="31.4 31.4">
                    <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.9s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
            )}
          </div>
        ) : (
                      <a href={buildUrl(message.file.fileUrl)} download={message.file.fileName} target="_blank" rel="noopener noreferrer" title={message.file.fileName} style={{ padding: "8px 12px", backgroundColor: "#f5f9ff", borderRadius: "12px", textDecoration: "none", color: "#0b63d6", marginBottom: "6px", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.02)", maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            📎 {truncateName(message.file.fileName)}
          </a>
        )
      )}

      {/* Grouped images (message.images) - widget y móvil (con vista previa al hacer click) */}
      {message.images?.length > 0 && (() => {
        const imgs = message.images || [];
        const visible = imgs.slice(0, 4);
        const total = imgs.length;

        // Grid templates depending on count to match layout rules:
        // 1 => single full-width
        // 2 => a b (one row)
        // 3 => a b / c . (third under first)
        // 4 => a b / c d (2x2)
        let gridTemplateAreas = "";
        let gridTemplateColumns = "repeat(2, 1fr)";
        let gridTemplateRows = "auto";
        if (visible.length === 1) {
          gridTemplateAreas = '"a"';
          gridTemplateColumns = '1fr';
        } else if (visible.length === 2) {
          gridTemplateAreas = '"a b"';
        } else if (visible.length === 3) {
          gridTemplateAreas = '"a b" "c ."';
          gridTemplateRows = 'auto auto';
        } else {
          // 4
          gridTemplateAreas = '"a b" "c d"';
        }

        const areaNames = ['a', 'b', 'c', 'd'];

        return (
          <div style={{ display: 'grid', gridTemplateColumns, gridTemplateRows, gridTemplateAreas, gap: '4px', width: 'clamp(120px, 28vw, 200px)', marginBottom: '6px' }}>
            {visible.map((img, i) => {
              const area = areaNames[i] || areaNames[areaNames.length - 1];
              const isOverflowFourth = i === 3 && total > 4;
              const rawFull = imageBlobUrls[img.fileUrl] || img.fileContent || img.preview || (img.fileUrl ? buildUrl(img.fileUrl) : null);
              const fullUrl = normalizeDataUrl(rawFull);

              return (
                <div
                  key={i}
                  style={{ gridArea: area, position: 'relative', width: '100%', height: visible.length === 1 ? 'auto' : '90px', borderRadius: '6px', overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => fullUrl && openImageModal(imgs, fullUrl)}
                >
                  {fullUrl ? (
                    <img src={fullUrl} alt={img.fileName} style={{ width: '100%', height: '100%', objectFit: visible.length === 1 ? 'contain' : 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', color: '#666' }}>⏳</div>
                  )}
                  {isOverflowFourth && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: '700' }}>
                      +{total - 4}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Reply preview */}
      {message.replyToText && (
        <div style={{ padding: "8px", margin: "4px -2px 2px -2px", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: "6px", borderLeft: `3px solid ${isUser ? "#88a8c4" : "#b0b0b0"}`, fontSize: "13px", opacity: 0.9 }}>
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }} dangerouslySetInnerHTML={{ __html: sanitizeMessage(message.replyToText) }} />
        </div>
      )}

      {message.text && <span style={{ paddingRight: isUser ? "45px" : "0px", paddingLeft: isUser ? "0px" : "0px" }} dangerouslySetInnerHTML={{ __html: sanitizeMessage(message.text) }} />}

      {/* Timestamp and status */}
      <div style={{ display: "flex", alignSelf: "flex-end", alignItems: "center", width: "100%", marginTop: "0px", gap: "2px" }}>
        {/* Hora alineada como antes: flex-end para usuario, flex-start para bot/admin */}
        <div style={{ flex: 1 }}></div>
        {message.timestamp && (
          <span style={{ fontSize: "10px", color: "rgba(0, 0, 0, 0.5)", opacity: 0.8, whiteSpace: "nowrap", paddingLeft: !isUser ? "20px" : "0px" }}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
          </span>
        )}
      </div>
    </div>
  );
}

MessageBubble.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tempId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    from: PropTypes.string,
    status: PropTypes.string,
    text: PropTypes.string,
    timestamp: PropTypes.string,
    replyToText: PropTypes.string,
    file: PropTypes.shape({
      fileType: PropTypes.string,
      fileUrl: PropTypes.string,
      fileContent: PropTypes.string,
      preview: PropTypes.string,
      fileName: PropTypes.string,
    }),
    multipleFiles: PropTypes.arrayOf(
      PropTypes.shape({
        fileType: PropTypes.string,
        fileContent: PropTypes.string,
        preview: PropTypes.string,
        fileName: PropTypes.string,
        fileUrl: PropTypes.string,
      })
    ),
    images: PropTypes.arrayOf(PropTypes.shape({ fileUrl: PropTypes.string, fileName: PropTypes.string, fileContent: PropTypes.string, preview: PropTypes.string })),
  }).isRequired,
  index: PropTypes.number.isRequired,
  messageRef: PropTypes.object.isRequired,
  fontFamily: PropTypes.string,
  openImageModal: PropTypes.func.isRequired,
  isMobileView: PropTypes.bool,
};

export default MessageBubble;



