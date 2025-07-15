/**
 * Envía un archivo a una conversación mediante SignalR.
 * @param {object} connection - Instancia activa de SignalR.
 * @param {number} conversationId - ID de la conversación.
 * @param {File} file - Objeto File del input.
 * @param {number} userId - ID del usuario que envía el archivo.
 */
// ✅ Envía una imagen o documento individual
export const sendChatFile = async ({ connection, conversationId, file, userId }) => {
  if (!file || !connection?.invoke) return;

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  try {
    const fileContent = await toBase64(file);

    const payload = {
      fileName: file.name,
      fileType: file.type,
      fileContent,
      userId,
    };

    await connection.invoke("SendFile", conversationId, payload);
  } catch (error) {
    console.error("❌ Error al enviar archivo individual:", error);
  }
};

// ✅ Envía varias imágenes agrupadas
export const sendGroupedImages = async ({ connection, conversationId, files, userId }) => {
  if (!files || files.length === 0 || !connection?.invoke) return;

  const convertFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // ⚠️ limpio solo el contenido
        resolve({
          fileName: file.name,
          fileType: file.type,
          fileContent: base64,
        });
      };
      reader.onerror = reject;
    });

  try {
    const multipleFiles = await Promise.all(files.map(convertFile));
    await connection.invoke("SendGroupedImages", conversationId, userId, multipleFiles);
  } catch (err) {
    console.error("❌ Error al enviar imágenes agrupadas:", err);
  }
};
// ✅ Obtener archivos ya subidos a una conversación
export const getFilesByConversation = async (conversationId) => {
  try {
    const response = await axios.get(`/api/ChatUploadedFiles/conversation/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("❌ Error al obtener archivos de la conversación:", error);
    return [];
  }
};
