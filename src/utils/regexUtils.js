// Función auxiliar para extraer datos con expresiones regulares
export function extractByRegex(userMessage, field) {
  if (!userMessage || !field?.fieldName) return null;

  const fieldName = field.fieldName.toLowerCase();

  // Email
  if (fieldName.includes("email") || fieldName.includes("correo")) {
    const match = userMessage.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/);
    return match ? match[0] : null;
  }

  // Teléfono
  if (fieldName.includes("phone") || fieldName.includes("tel") || fieldName.includes("cel")) {
    const match = userMessage.match(/\+?\d{7,15}/);
    return match ? match[0] : null;
  }

  // Nombre
  if (fieldName.includes("name") || fieldName.includes("nombre")) {
    const match = userMessage.match(/\b([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*)\b/);
    return match ? match[0] : null;
  }

  // Números (ej: edad, monto, etc.)
  if (fieldName.includes("edad") || fieldName.includes("años") || fieldName.includes("monto") || fieldName.includes("valor")) {
    const match = userMessage.match(/\d+/);
    return match ? match[0] : null;
  }

  return null; // si no hay match
}
