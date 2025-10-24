import axios from "axios";

const API_URL = "http://localhost:5006/api/BotDataSubmissions";

// Obtener las capturas agrupadas por sesión para un bot específico
export const getCapturedSubmissionsByBot = async (botId) => {
  const response = await axios.get(`${API_URL}/by-bot/${botId}`);

  return {
    data: response.data.map((entry) => ({
      sessionId: entry.sessionId,
      userId: entry.userId,
      values: entry.values ?? {}, // 👈 asegúrate de que siempre haya values
      createdAt: entry.createdAt,
    })),
  };
};

// Obtener todas las capturas (sin agrupar)
export const getAllSubmissions = () => {
  return axios.get(API_URL);
};

// Obtener una sola captura por ID
export const getSubmissionById = (id) => {
  return axios.get(`${API_URL}/${id}`);
};

// Crear una nueva captura de dato
export const createSubmission = (submissionData) => {
  const payload = {
    botId: submissionData.botId,
    captureFieldId: submissionData.captureFieldId,
    submissionValue: submissionData.submissionValue ?? "",
  };
  if (submissionData.userId != null && submissionData.userId !== undefined) payload.userId = submissionData.userId;
  if (submissionData.submissionSessionId != null && submissionData.submissionSessionId !== undefined) payload.submissionSessionId = submissionData.submissionSessionId;
  return axios.post(API_URL, payload);
};

// Actualizar una captura existente
export const updateSubmission = (id, updatedData) => {
  return axios.put(`${API_URL}/${id}`, {
    botId: updatedData.botId,
    captureFieldId: updatedData.captureFieldId,
    submissionValue: updatedData.submissionValue,
  });
};

// Eliminar una captura por ID
export const deleteSubmission = (id) => {
  return axios.delete(`${API_URL}/${id}`);
};

// Obtener capturas públicas agrupadas por sesión (API sin login)
export const getPublicCapturedSubmissionsByBot = async (botId) => {
  const response = await axios.get(
    `http://localhost:5006/api/BotDataSubmissions/public/by-bot/${botId}`
  );

  // El endpoint público devuelve filas individuales por cada submission (cada campo capturado).
  // Mapear al formato crudo para que el frontend pueda mostrarlas sin agrupar.
  return {
    data: response.data.map((entry) => ({
      sessionId: entry.sessionId,
      userId: entry.userId,
      fieldName: entry.field ?? entry.Field ?? null,
      value: entry.value ?? entry.Value ?? null,
      createdAt: entry.createdAt ?? entry.CreatedAt ?? null,
      conversationId: entry.conversationId ?? entry.ConversationId ?? null,
      captureIntent: entry.captureIntent ?? entry.CaptureIntent ?? null,
      captureSource: entry.captureSource ?? entry.CaptureSource ?? null,
      metadataJson: entry.metadataJson ?? entry.MetadataJson ?? null,
    })),
  };
};

// Obtener submissions crudas (una fila por registro) para un bot (requiere auth si no es público)
export const getCapturedSubmissionsRaw = async (botId) => {
  const response = await axios.get(`${API_URL}/by-bot-raw/${botId}`);
  return { data: response.data.map((s) => ({
    id: s.id,
    botId: s.botId,
    captureFieldId: s.captureFieldId,
    fieldName: s.fieldName || s.FieldName || null,
    value: s.submissionValue || s.SubmissionValue || null,
    createdAt: s.submittedAt || s.SubmittedAt || null,
    userId: s.userId,
    sessionId: s.submissionSessionId || s.SubmissionSessionId,
    conversationId: s.conversationId,
    captureIntent: s.captureIntent,
    captureSource: s.captureSource,
    metadataJson: s.metadataJson
  })) };
}

// Descargar export CSV desde el servidor
export const exportCapturedSubmissions = (params, options = {}) => {
  // params: { botId, sessionId, userId, from, to, intent }
  // options: { format: 'csv'|'xlsx' }
  const query = new URLSearchParams();
  Object.keys(params || {}).forEach(k => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== "") query.append(k, params[k]);
  });
  if (options.format) query.append('format', options.format);
  return axios.get(`http://localhost:5006/api/BotDataSubmissions/export?${query.toString()}`, { responseType: 'blob' });
};
