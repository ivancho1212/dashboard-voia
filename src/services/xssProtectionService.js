// src/services/xssProtectionService.js
/**
 * Servicio de protección contra XSS en el frontend
 * Sincronizado con SanitizationService del backend
 */

// Patrones peligrosos de XSS
export const DANGEROUS_PATTERNS = [
    // Script tags
    /<script[^>]*>.*?<\/script>/gi,
    /<\/script>/gi,
    /<script/gi,
    
    // Event handlers
    /on\w+\s*=/gi,  // onerror=, onclick=, onload=, etc.
    
    // javascript protocol
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    
    // Iframes y embeds
    /<iframe/gi,
    /<frame/gi,
    /<embed/gi,
    /<object/gi,
    /<applet/gi,
    /<meta/gi,
    /<link/gi,
    /<style[^>]*>.*?<\/style>/gi,
    
    // Otros
    /<img[^>]*on/gi,
    /<svg[^>]*on/gi,
    /<body[^>]*on/gi,
];

/**
 * Valida si un string contiene patrones XSS
 * @param {string} input - El input a validar
 * @returns {boolean} true si es seguro, false si contiene XSS
 */
export const validateXSS = (input) => {
    if (!input || typeof input !== 'string') {
        return true;
    }

    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(input)) {
            return false;
        }
    }
    return true;
};

/**
 * Detecta qué patrón XSS fue encontrado
 * @param {string} input - El input a validar
 * @returns {Object} { xssDetected: boolean, pattern?: string }
 */
export const detectXSSPattern = (input) => {
    if (!input || typeof input !== 'string') {
        return { xssDetected: false };
    }

    for (const pattern of DANGEROUS_PATTERNS) {
        const match = input.match(pattern);
        if (match) {
            return {
                xssDetected: true,
                pattern: pattern.toString(),
                matched: match[0]
            };
        }
    }

    return { xssDetected: false };
};

/**
 * Log de intento XSS detectado
 */
export const logXSSAttempt = (fieldName, input, pattern) => {
    console.warn(
        `🚨 [XSS PROTECTION] Possible XSS Attempt Detected`,
        {
            field: fieldName,
            pattern: pattern,
            input: input.substring(0, 200) + (input.length > 200 ? '...' : ''),
            timestamp: new Date().toISOString()
        }
    );

    // También enviar a backend para auditoría si es necesario
    try {
        fetch('/api/audit/xss-attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                field: fieldName,
                pattern: pattern.toString(),
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        }).catch(() => {}); // Silent fail, no bloquear UI
    } catch (e) {
        // Ignore
    }
};

/**
 * Sanitiza un string removiendo potenciales XSS
 * NOTA: Esto es una sanitización básica. Para producción
 * considera usar DOMPurify o similar
 */
export const basicSanitize = (input) => {
    if (!input) return input;

    // Crear elemento temporal
    const temp = document.createElement('div');
    temp.textContent = input;
    return temp.innerHTML;
};

/**
 * Valida campos críticos de formulario
 * @param {Object} data - Object con campos a validar
 * @param {string[]} criticalFields - Array de campos a validar
 * @returns {Object} { valid: boolean, errors: Object[] }
 */
export const validateFormXSS = (data, criticalFields = []) => {
    const errors = [];

    for (const field of criticalFields) {
        const value = data[field];
        if (value && typeof value === 'string') {
            const detection = detectXSSPattern(value);
            if (detection.xssDetected) {
                errors.push({
                    field,
                    error: `El campo contiene patrones potencialmente peligrosos`,
                    pattern: detection.pattern
                });
                logXSSAttempt(field, value, detection.pattern);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};
