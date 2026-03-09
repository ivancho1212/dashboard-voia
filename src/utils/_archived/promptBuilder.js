import { findBestMatch } from "string-similarity";

/**
 * Construye el estado actual de la captura de datos.
 */
function buildDataCaptureStatusPrompt(fields) {
  if (!fields || fields.length === 0) return "";

  const captured = fields.filter((f) => f.value);
  const missing = fields.filter((f) => !f.value);

  if (missing.length === 0) {
    return `--- GESTIÓN DE DATOS ---
✅ Todos los datos requeridos fueron capturados. Ahora responde normalmente.
-----------------------`;
  }

  return `--- GESTIÓN DE DATOS ---
DATOS CAPTURADOS: ${
    captured.length > 0
      ? captured.map((f) => `${f.fieldName}='${f.value}'`).join(", ")
      : "Ninguno"
  }.
DATOS PENDIENTES: ${missing.map((f) => f.fieldName).join(", ")}.
ACCIÓN: Pregunta únicamente por '${missing[0].fieldName}'. No repitas saludos ni confirmes datos anteriores.
-----------------------`;
}

/**
 * Construye el prompt dinámico para enviar al modelo.
 */
export function buildDynamicPrompt(
  systemMessage,
  userMessage,
  relevantContext,
  conversationSummary,
  capturedFields
) {
  const contextInfo =
    relevantContext?.trim() || "Sin resultados relevantes en la base de conocimiento.";
  const historyInfo =
    conversationSummary?.trim() || "No hay historial previo.";

  return `
${systemMessage}

${buildDataCaptureStatusPrompt(capturedFields)}

---
📚 Contexto (Qdrant/MySQL):
${contextInfo}

🗨️ Conversación previa:
${historyInfo}

👤 Usuario dice:
${userMessage}
`;
}

/**
 * Busca coincidencias en el payload de FAQs.
 */
export function searchInPayload(userMessage, faqPayload) {
  if (!faqPayload || faqPayload.length === 0) return null;

  const questions = faqPayload
    .filter((m) => m.role === "user" && m.content)
    .map((m) => m.content);

  if (questions.length === 0) return null;

  const bestMatch = findBestMatch(
    userMessage.toLowerCase(),
    questions.map((q) => q.toLowerCase())
  );

  const SIMILARITY_THRESHOLD = 0.8;

  if (bestMatch.bestMatch.rating > SIMILARITY_THRESHOLD) {
    const idx = faqPayload.findIndex(
      (m) =>
        m.role === "user" &&
        m.content.toLowerCase() === bestMatch.bestMatch.target
    );

    if (idx !== -1 && faqPayload[idx + 1]?.role === "assistant") {
      return `📌 Respuesta rápida: ${faqPayload[idx + 1].content}`;
    }
  }

  return null;
}

/**
 * Da formato al contexto vectorial recuperado de Qdrant.
 */
export function formatVectorContext(results) {
  if (!results || results.length === 0) return "Sin información relevante.";

  return results
    .map(
      (hit, i) =>
        `📎 Fragmento ${i + 1}: "${hit.text || "N/A"}" (Fuente: ${
          hit.source || "Desconocida"
        })`
    )
    .join("\n\n");
}
