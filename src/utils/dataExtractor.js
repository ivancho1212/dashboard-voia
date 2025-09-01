import { createSubmission } from "services/botDataSubmissionsService";
import { getBotResponse } from "services/aiService"; // 👈 usar tu backend, no OpenAI directo
import { extractByRegex } from "./regexUtils";

export async function extractAndSubmitData({
  userMessage,
  currentFields,
  conversationHistory,
  botId,
  userId,
  conversationId,
}) {
  let updatedFields = [...currentFields];
  const pendingFields = updatedFields.filter(f => !f.value);

  if (pendingFields.length === 0) return updatedFields;

  // --- Paso 1: extracción por regex/heurística (igual) ---
  for (const field of pendingFields) {
    let extractedValue = extractByRegex(userMessage, field);
    if (extractedValue && validateFieldValue(extractedValue, field)) {
      updatedFields = updatedFields.map(f =>
        f.id === field.id ? { ...f, value: extractedValue } : f
      );
    }
  }

  // --- Paso 2: si aún faltan campos, pedir ayuda al backend (IA) ---
  const stillPending = updatedFields.filter(f => !f.value);
  if (stillPending.length > 0) {
    const aiResponse = await getBotResponse(botId, userId, userMessage, stillPending);

    // ojo: aiResponse es un string → parsea si tu backend devuelve JSON
    let llmResult = {};
    try {
      llmResult = JSON.parse(aiResponse);
    } catch {
      console.warn("⚠️ Respuesta IA no es JSON, se ignora:", aiResponse);
    }

    for (const field of stillPending) {
      if (llmResult[field.fieldName] && validateFieldValue(llmResult[field.fieldName], field)) {
        updatedFields = updatedFields.map(f =>
          f.id === field.id ? { ...f, value: llmResult[field.fieldName] } : f
        );
      }
    }
  }

  // --- Paso 3: guardar cambios nuevos (igual) ---
  const submissions = [];
  for (const field of updatedFields) {
    const original = currentFields.find(f => f.id === field.id);
    if (field.value && (!original || original.value !== field.value)) {
      submissions.push(
        createSubmission({
          botId,
          captureFieldId: field.id,
          submissionValue: field.value,
          userId,
          submissionSessionId: conversationId.toString(),
        })
      );
    }
  }
  if (submissions.length > 0) await Promise.all(submissions);

  return updatedFields;
}
