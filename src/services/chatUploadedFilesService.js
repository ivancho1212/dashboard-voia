/**
 * Envía un archivo a una conversación mediante SignalR.
 * @param {object} connection - Instancia activa de SignalR.
 * @param {number} conversationId - ID de la conversación.
 * @param {File} file - Objeto File del input.
 * @param {number} userId - ID del usuario que envía el archivo.
 */
import axios from "axios";
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";
// ✅ Envía una imagen o documento individual
/**
 * Subir un archivo al endpoint multipart del servidor y notificar al hub.
 * - Flujo anterior: el cliente convertía el archivo a base64 y lo enviaba por SignalR (SendFile).
 *   Esto causa sobrecarga de memoria y aumento del tamaño (~33%).
 * - Cambio: subimos por multipart/form-data a `POST /api/ChatUploadedFiles` (streaming en servidor),
 *   luego notificamos al hub invocando `SendFile` con un payload que contenga `fileUrl`.
 *   `ChatHub.SendFile` fue actualizado para soportar `fileUrl` (retrocompatible).
 */
export const sendChatFile = async ({ connection, conversationId, file, userId, invokeHub = true }) => {
  if (!file) return null;

  const token = localStorage.getItem("token");

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
      const payload = {
        fileName: data.fileName || file.name,
        fileType: data.fileType || file.type,
        fileUrl,
        userId,
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

    return { multipart: true, fileUrl, data };
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
        try {
          await connection.invoke("SendFile", conversationId, {
            fileName: file.name,
            fileType: file.type,
            fileUrl: filePath || uploadUrl,
            userId,
          });
        } catch (hubErr) {
          console.error("❌ Hub invoke SendFile failed after presigned PUT:", hubErr);
          const msg = hubErr?.message || String(hubErr);
          alert(`Error sending file to server: ${msg}`);
          throw hubErr;
        }
      }

      return { presigned: true, fileUrl: filePath || uploadUrl };
    }
  } catch (presErr) {
    console.error("❌ Presigned flow failed:", presErr);
    throw presErr;
  }
};

// ✅ Envía varias imágenes agrupadas
export const sendGroupedImages = async ({ connection, conversationId, files, userId }) => {
  if (!files || files.length === 0) return;

  try {
    // Upload each file via sendChatFile but do NOT invoke the hub individually (invokeHub=false).
    const uploads = await Promise.all(
      files.map((f) => sendChatFile({ connection, conversationId, file: f, userId, invokeHub: false }))
    );

    // Build payloads with fileUrl (prefer server-returned fileUrl/filePath)
    const payload = uploads.map((u, idx) => ({
      fileName: files[idx].name,
      fileType: files[idx].type,
      fileUrl: u?.fileUrl || (u?.data && (u.data.filePath || u.data.fileUrl)) || null,
    }));

    // Only include uploaded items that actually have a fileUrl
    const filtered = payload.filter((p) => p.fileUrl);
    if (filtered.length === 0) {
      console.warn("⚠️ Ningún archivo subido para enviar en grouped images.");
      return { uploaded: uploads };
    }

    // Invoke grouped send on hub with array of file metadata
    if (connection?.invoke) {
      try {
        await connection.invoke("SendGroupedImages", conversationId, userId, filtered);
      } catch (err) {
        console.error("❌ SendGroupedImages invoke failed:", err);
        // Surface a user-friendly message with server detail if present
        const m = err?.message || String(err);
        alert(`Error al enviar imágenes agrupadas: ${m}`);
        throw err;
      }
    }
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
