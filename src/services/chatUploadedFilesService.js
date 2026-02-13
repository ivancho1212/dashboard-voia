/**
 * Envía un archivo a una conversación mediante SignalR.
 * @param {object} connection - Instancia activa de SignalR.
 * @param {number} conversationId - ID de la conversación.
 * @param {File} file - Objeto File del input.
 * @param {number} userId - ID del usuario que envía el archivo.
 */
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";

// ✅ Helper: Convert File to data URL (ya incluye "data:image/...;base64,")
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// ✅ Usar como src de imagen sin duplicar prefijo (fileToBase64 ya devuelve data URL completa)
const asImageDataUrl = (value, mimeType) => {
  if (!value) return null;
  if (typeof value === "string" && value.startsWith("data:")) return value;
  return mimeType ? `data:${mimeType};base64,${value}` : value;
};

/**
 * ✅ ARQUITECTURA PROFESIONAL: Upload con messageId único, progress tracking y UpdateMessage
 * 
 * Flujo (como WhatsApp):
 * 1. Generar messageId único (UUID)
 * 2. Generar thumbnail local (blob URL)
 * 3. Crear mensaje temporal con estado "pending"
 * 4. RENDERIZAR INMEDIATAMENTE con blob URL
 * 5. UPLOAD EN BACKGROUND con progress tracking
 * 6. Cuando completa → SendMessage con estado "uploading"
 * 7. Cliente recibe fileUrl del servidor
 * 8. Invoca UpdateMessage para notificar cambio
 * 9. MessageBubble actualiza silenciosamente (blob → CDN)
 */
export const sendChatFileWithProgress = async ({
  connection,
  conversationId,
  file,
  userId,
  onProgress,  // ← Callback para actualizaciones de progreso
  onMessageCreated  // ← Callback cuando se crea el mensaje temporal
}) => {
  if (!file) return null;

  const token = localStorage.getItem("token");
  const messageId = uuidv4();  // ← CRÍTICO: ID único del cliente

  // 1️⃣ Generar thumbnail local INMEDIATAMENTE
  let thumbnailUrl = null;
  if (file.type.startsWith("image/")) {
    try {
      thumbnailUrl = await fileToBase64(file);
      _logger?.info(`✅ Thumbnail generado para ${file.name}`);
    } catch (e) {
      console.warn("⚠️ No se pudo generar thumbnail:", e);
    }
  }

  // 2️⃣ Crear mensaje temporal con estado "pending"
  const tempMessage = {
    messageId,
    status: "pending",
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    thumbnailUrl,  // ← Blob URL local
    uploadProgress: 0,
    from: "user"
  };

  // 3️⃣ RENDERIZAR INMEDIATAMENTE (callback)
  if (onMessageCreated) {
    onMessageCreated(tempMessage);
  }

  try {
    // 4️⃣ Upload en background (multipart con progress tracking)
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("conversationId", String(conversationId));
    uploadForm.append("messageId", messageId);  // ← Vincular con el mensaje

    const response = await axios.post(
      `${API_BASE_URL}/api/ChatUploadedFiles`,
      uploadForm,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
          "Content-Type": "multipart/form-data"
        },
        onUploadProgress: (event) => {
          const progress = Math.round((event.loaded / event.total) * 100);
          
          // 5️⃣ Notificar progreso al UI
          if (onProgress) {
            onProgress({
              messageId,
              uploadProgress: progress,
              status: "uploading"
            });
          }

          // 6️⃣ Enviar UpdateMessage para notificar a otros usuarios
          if (connection?.invoke && progress > 0 && progress % 10 === 0) {
            // Actualizar cada 10% para no saturar
            connection.invoke("UpdateMessage", {
              messageId,
              conversationId,
              status: "uploading",
              uploadProgress: progress
            }).catch(err => console.warn("⚠️ Error enviando progreso:", err));
          }
        }
      }
    );

    const data = response.data || {};
    const fileUrl = data.fileUrl || data.filePath || null;
    const fileId = data.id || null;

    if (!fileUrl) {
      throw new Error("El servidor no devolvió URL del archivo");
    }

    _logger?.info(`✅ Upload completado: ${fileUrl}`);

    // 7️⃣ Archivo subido exitosamente → Enviar UpdateMessage
    if (connection?.invoke) {
      try {
        await connection.invoke("UpdateMessage", {
          messageId,
          conversationId,
          fileId,
          fileUrl,
          status: "sent"  // ← Marcar como completado
        });
        
        _logger?.info(`✅ UpdateMessage enviado. messageId: ${messageId}`);
      } catch (hubErr) {
        console.error("❌ Error en UpdateMessage:", hubErr);
        // No fallar: el archivo está subido, solo la notificación falló
      }
    }

    return {
      success: true,
      messageId,
      fileUrl,
      fileId,
      thumbnailUrl,
      fileType: data.fileType || file.type
    };

  } catch (error) {
    console.error("❌ Error en upload:", error);

    // 8️⃣ Si falla → Notificar estado "failed"
    if (connection?.invoke) {
      try {
        await connection.invoke("UpdateMessage", {
          messageId,
          conversationId,
          status: "failed"
        });
      } catch (hubErr) {
        console.warn("⚠️ No se pudo notificar fallo:", hubErr);
      }
    }

    // Notificar al callback
    if (onProgress) {
      onProgress({
        messageId,
        status: "failed",
        error: error.message
      });
    }

    throw error;
  }
};

// ✅ Envía una imagen o documento individual (LEGACY - mantener para compatibilidad)
/**
 * Subir un archivo al endpoint multipart del servidor y notificar al hub.
 * - Flujo anterior: el cliente convertía el archivo a base64 y lo enviaba por SignalR (SendFile).
 *   Esto causa sobrecarga de memoria y aumento del tamaño (~33%).
 * - Cambio: subimos por multipart/form-data a `POST /api/ChatUploadedFiles` (streaming en servidor),
 *   luego notificamos al hub invocando `SendFile` con un payload que contenga `fileUrl`.
 *   `ChatHub.SendFile` fue actualizado para soportar `fileUrl` (retrocompatible).
 *
 * - ACTUALIZACIÓN: Ahora también incluimos base64 en el payload para preview LOCAL inmediato
 *   (se renderiza mientras se espera que el servidor procese el archivo).
 */
export const sendChatFile = async ({ connection, conversationId, file, userId, invokeHub = true }) => {
  if (!file) return null;

  const token = localStorage.getItem("token");

  // Pre-generate base64 for local preview while upload is in progress
  let base64Str = null;
  if (file.type.startsWith("image/")) {
    try {
      base64Str = await fileToBase64(file);
    } catch (e) {
      console.warn("⚠️ Could not generate base64 for preview:", e);
    }
  }

  // 1) Try multipart POST first — more reliable and server should return the public filePath
  try {
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("conversationId", String(conversationId));

    const resp = await axios.post(`${API_BASE_URL}/api/ChatUploadedFiles`, uploadForm, {
      headers: { Authorization: token ? `Bearer ${token}` : undefined, "Content-Type": "multipart/form-data" },
    });

  const data = resp.data || {};
  // Prefer API file URL (secure, re-validated) when available; fallback to legacy public path
  const fileUrl = data.fileUrl || data.filePath || null;

    if (invokeHub && connection?.invoke) {
      // 🔴 Backend espera userId como int? (nullable int), no string
      let numericUserId = null;
      if (userId !== null && userId !== undefined && userId !== 'anon') {
        const parsed = parseInt(userId, 10);
        if (!isNaN(parsed) && parsed > 0) numericUserId = parsed;
      }
      const payload = {
        fileName: data.fileName || file.name,
        fileType: data.fileType || file.type,
        fileUrl,
        fileContent: base64Str, // ← AGREGADO: base64 para preview local
        userId: numericUserId,
      };
      try {
        await connection.invoke("SendFile", conversationId, payload);
      } catch (hubErr) {
        console.error("❌ Hub invoke SendFile failed after multipart:", hubErr);
        const msg = hubErr?.message || String(hubErr);
        alert(`Error sending file to server: ${msg}`);
        throw hubErr;
      }
    }

    return { multipart: true, fileUrl, data, base64: base64Str };
  } catch (mpErr) {
    console.warn("⚠️ Multipart upload failed, will try presigned fallback:", mpErr?.message || mpErr);
  }

  // 2) Try presigned PUT flow as a fallback (no base64 fallback anymore)
  try {
    const presignedResp = await axios.post(
      `${API_BASE_URL}/api/ChatUploadedFiles/presigned`,
      { fileName: file.name, fileType: file.type, conversationId, userId },
      { headers: { Authorization: token ? `Bearer ${token}` : undefined } }
    );

    const { uploadUrl } = presignedResp.data || {};
    if (uploadUrl) {
      await axios.put(uploadUrl, file, {
        headers: { "Content-Type": file.type }
      });

      // Try to derive a server-relative path from the uploadUrl if possible
      let filePath = null;
      try {
        const u = new URL(uploadUrl);
        if (u.hostname.includes("localhost") || u.hostname === window.location.hostname) {
          filePath = u.pathname + (u.search || "");
        }
      } catch (e) {
        // not a full URL, ignore
      }

      if (invokeHub && connection?.invoke) {
        let numericUserId = null;
        if (userId !== null && userId !== undefined && userId !== 'anon') {
          const parsed = parseInt(userId, 10);
          if (!isNaN(parsed) && parsed > 0) numericUserId = parsed;
        }
        try {
          await connection.invoke("SendFile", conversationId, {
            fileName: file.name,
            fileType: file.type,
            fileUrl: filePath || uploadUrl,
            fileContent: base64Str, // ← AGREGADO: base64 para preview local
            userId: numericUserId,
          });
        } catch (hubErr) {
          console.error("❌ Hub invoke SendFile failed after presigned PUT:", hubErr);
          const msg = hubErr?.message || String(hubErr);
          alert(`Error sending file to server: ${msg}`);
          throw hubErr;
        }
      }

      return { presigned: true, fileUrl: filePath || uploadUrl, base64: base64Str };
    }
  } catch (presErr) {
    console.error("❌ Presigned flow failed:", presErr);
    throw presErr;
  }
};

// ✅ Envía varias imágenes agrupadas (LEGACY - mantener para compatibilidad)
export const sendGroupedImages = async ({ connection, conversationId, files, userId }) => {
  if (!files || files.length === 0) return;

  try {
    // Subir cada archivo; si uno falla, seguir con los que sí subieron (allSettled)
    const results = await Promise.allSettled(
      files.map((f) => sendChatFile({ connection, conversationId, file: f, userId, invokeHub: false }))
    );
    const uploads = results.map((r, idx) => {
      if (r.status === "fulfilled") return r.value;
      console.warn(`⚠️ [sendGroupedImages] Falló subida ${idx + 1}/${files.length}:`, r.reason?.message || r.reason);
      return null;
    });

    // Build payloads con el mismo índice que files (los fallidos quedan fileUrl null y se filtran)
    const payload = uploads.map((u, idx) => ({
      fileName: files[idx].name,
      fileType: files[idx].type,
      fileUrl: u?.fileUrl || (u?.data && (u.data.filePath || u.data.fileUrl)) || null,
      fileContent: u ? asImageDataUrl(u.base64, files[idx].type) : null,
    }));

    // Only include uploaded items that actually have a fileUrl
    const filtered = payload.filter((p) => p.fileUrl);
    if (filtered.length === 0) {
      console.warn("⚠️ Ningún archivo subido para enviar en grouped images.");
      return { uploaded: uploads };
    }
    if (filtered.length < files.length) {
      console.warn(`⚠️ [sendGroupedImages] Solo ${filtered.length}/${files.length} imágenes se subieron correctamente. Revisa la consola por errores de subida.`);
    }

    // Invoke grouped send on hub with array of file metadata (sin fileContent en payload SignalR)
    // 🔴 Backend espera userId como int? (nullable int), no string
    let numericUserId = null;
    if (userId !== null && userId !== undefined && userId !== 'anon') {
      const parsed = parseInt(userId, 10);
      if (!isNaN(parsed) && parsed > 0) numericUserId = parsed;
    }
    if (connection?.invoke) {
      try {
        const hubPayload = filtered.map(({ fileName, fileType, fileUrl }) => ({ fileName, fileType, fileUrl }));
        await connection.invoke("SendGroupedImages", conversationId, numericUserId, hubPayload);
      } catch (err) {
        console.error("❌ SendGroupedImages invoke failed:", err);
        const m = err?.message || String(err);
        alert(`Error al enviar imágenes agrupadas: ${m}`);
        throw err;
      }
    }
    return { multipleFiles: filtered };
  } catch (err) {
    console.error("❌ Error al enviar imágenes agrupadas:", err);
    // Optional: rethrow or surface to caller
  }
};

// ✅ Obtener archivos ya subidos a una conversación
export const getFilesByConversation = async (conversationId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/api/ChatUploadedFiles/conversation/${conversationId}`, {
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener archivos de la conversación:", error);
    return [];
  }
};
