// Simple sanitization utility for chat messages
// Removes script tags and encodes HTML entities
export function sanitizeMessage(text) {
  if (!text || typeof text !== "string") return "";
  // Remove script tags
  let sanitized = text.replace(/<script.*?>.*?<\/script>/gi, "");
  // Encode < > & " ' characters
  sanitized = sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return sanitized;
}
