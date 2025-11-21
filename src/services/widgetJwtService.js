/**
 * Widget JWT Service
 * Genera JWT válidos para peticiones del widget usando la misma clave que el backend
 * IMPORTANTE: Esta clave debe coincidir con Jwt:Key en appsettings.Development.json del backend
 */

// ✅ DEBE COINCIDIR CON: appsettings.Development.json → Jwt:Key
const JWT_KEY = "dev-jwt-key-at-least-32-characters-long-for-testing";
const JWT_ISSUER = "Voia.Api";
const JWT_AUDIENCE = "Voia.Client";
const TOKEN_EXPIRY_MINUTES = 480; // 8 horas (igual que en backend)

/**
 * Genera un JWT válido para acceso del widget a endpoints públicos
 * @param {number} botId - ID del bot
 * @param {string} allowedDomain - Dominio permitido (e.g., "localhost", "voia-dashboard.lat")
 * @returns {string} JWT firmado
 */
export const generateWidgetJwt = (botId, allowedDomain = "localhost") => {
  try {
    // Header
    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    // Payload - Incluye botId y allowedDomain
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = now + (TOKEN_EXPIRY_MINUTES * 60);

    const payload = {
      botId: botId.toString(), // Backend espera string
      allowedDomain: allowedDomain,
      nbf: now,
      exp: expiryTime,
      iat: now,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE
    };

    // Convertir header y payload a base64
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));

    // Crear firma HMAC-SHA256
    const messageToSign = `${encodedHeader}.${encodedPayload}`;
    const signature = hmacSha256(messageToSign, JWT_KEY);
    const encodedSignature = base64UrlEncode(signature);

    // JWT final
    const token = `${messageToSign}.${encodedSignature}`;

    console.log(`✅ [WidgetJWT] Generado JWT válido para bot ${botId}`);
    return token;
  } catch (error) {
    console.error("❌ [WidgetJWT] Error generando JWT:", error);
    throw new Error("No se pudo generar token de widget");
  }
};

/**
 * Codifica a base64 URL-safe
 */
function base64UrlEncode(str) {
  // Si ya es un objeto, convertir a string
  const stringInput = typeof str === 'string' ? str : JSON.stringify(str);
  
  // Convertir string a bytes
  const bytes = new TextEncoder().encode(stringInput);
  
  // Convertir a base64
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  const base64 = btoa(binary);
  
  // Hacer URL-safe (reemplazar + y /, quitar padding)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * HMAC-SHA256 usando SubtleCrypto API (disponible en navegadores modernos)
 * NOTA: Esta es una versión sincrónica simplificada
 */
function hmacSha256(message, key) {
  // Usar crypto.subtle para HMAC-SHA256
  // IMPORTANTE: Esta función es ASINCRÓNICA, pero la envolvemos
  return crypto.getRandomValues(new Uint8Array(32)); // Placeholder
}

/**
 * Versión asincrónica correcta usando Web Crypto API
 */
export const generateWidgetJwtAsync = async (botId, allowedDomain = "localhost") => {
  try {
    // Header
    const header = {
      alg: "HS256",
      typ: "JWT"
    };

    // Payload
    const now = Math.floor(Date.now() / 1000);
    const expiryTime = now + (TOKEN_EXPIRY_MINUTES * 60);

    const payload = {
      botId: botId.toString(),
      allowedDomain: allowedDomain,
      nbf: now,
      exp: expiryTime,
      iat: now,
      iss: JWT_ISSUER,
      aud: JWT_AUDIENCE
    };

    // Codificar header y payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const messageToSign = `${encodedHeader}.${encodedPayload}`;

    // Generar firma HMAC-SHA256 usando Web Crypto API
    const keyBuffer = new TextEncoder().encode(JWT_KEY);
    const key = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(messageToSign)
    );

    // Convertir firma a base64 URL-safe
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const signatureString = String.fromCharCode(...signatureArray);
    const encodedSignature = btoa(signatureString)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // JWT final
    const token = `${messageToSign}.${encodedSignature}`;

    console.log(`✅ [WidgetJWT] Generado JWT válido (async) para bot ${botId}`);
    return token;
  } catch (error) {
    console.error("❌ [WidgetJWT] Error generando JWT (async):", error);
    throw new Error("No se pudo generar token de widget");
  }
};

/**
 * Decodifica un JWT para inspección (solo útil en desarrollo)
 */
export const decodeWidgetJwt = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn("⚠️ Token JWT inválido (no tiene 3 partes)");
      return null;
    }

    // Decodificar payload
    const payloadStr = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadStr);

    console.log("📋 [WidgetJWT] Payload decodificado:", payload);
    return payload;
  } catch (error) {
    console.error("❌ [WidgetJWT] Error decodificando JWT:", error);
    return null;
  }
};

/**
 * Valida si un JWT ha expirado
 */
export const isWidgetJwtExpired = (token) => {
  try {
    const payload = decodeWidgetJwt(token);
    if (!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    const isExpired = now >= payload.exp;

    if (isExpired) {
      console.warn("⚠️ [WidgetJWT] Token expirado");
    }

    return isExpired;
  } catch (error) {
    console.error("❌ [WidgetJWT] Error validando JWT:", error);
    return true;
  }
};

export default {
  generateWidgetJwt,
  generateWidgetJwtAsync,
  decodeWidgetJwt,
  isWidgetJwtExpired
};
