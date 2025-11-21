// src/services/promptInjectionService.js
/**
 * Servicio de protección contra Prompt Injection
 * Sincronizado con PromptInjectionProtectionService del backend
 */

// Patrones de inyección de prompt (coincide con backend)
export const INJECTION_PATTERNS = [
    // Ignorar instrucciones
    /ignore.*previous.*instruction/i,
    /forget.*everything/i,
    /disregard.*all.*above/i,
    /forget.*all.*prior/i,
    /ignore.*all.*prior/i,

    // Revelar system prompt
    /show.*system.*prompt/i,
    /print.*system.*prompt/i,
    /what.*your.*system.*prompt/i,
    /reveal.*your.*instructions/i,
    /tell.*me.*your.*prompt/i,
    /display.*your.*prompt/i,

    // Cambiar rol
    /you.*are.*now/i,
    /from.*now.*on/i,
    /pretend.*you.*are/i,
    /act.*as.*if.*you.*were/i,
    /roleplay.*as/i,
    /you.*should.*now/i,

    // Ejecutar código
    /execute.*command/i,
    /run.*this.*code/i,
    /\beval\(/i,
    /\bexec\(/i,
    /\bbash\b/i,
    /\bshell\b/i,
    /system\(/i,

    // Jailbreaks conocidos
    /\bDAN\b/i,
    /Do Anything Now/i,
    /\bjailbreak\b/i,
    /\bunrestricted\b/i,
    /bypass.*filter/i,
    /circumvent.*restriction/i,

    // Técnicas adicionales
    /\[SYSTEM\]/i,
    /\[INSTRUCTIONS\]/i,
    /\[PROMPT\]/i,
];

/**
 * Detecta si un input contiene intentos de prompt injection
 * @param {string} input - El input a validar
 * @returns {Object} { detected: boolean, pattern?: string, matched?: string }
 */
export const detectPromptInjection = (input) => {
    if (!input || typeof input !== 'string') {
        return { detected: false };
    }

    for (const pattern of INJECTION_PATTERNS) {
        const match = input.match(pattern);
        if (match) {
            return {
                detected: true,
                pattern: pattern.toString(),
                matched: match[0]
            };
        }
    }

    return { detected: false };
};

/**
 * Valida longitud del input (previene token overflow)
 * @param {string} input - El input a validar
 * @param {number} maxChars - Máximo de caracteres permitido (default: 2000)
 * @returns {Object} { valid: boolean, error?: string }
 */
export const validateInputLength = (input, maxChars = 2000) => {
    if (!input) return { valid: true };

    if (input.length > maxChars) {
        return {
            valid: false,
            error: `Input demasiado largo (${input.length}/${maxChars} caracteres)`
        };
    }

    return { valid: true };
};

/**
 * Valida seguridad completa del input para chat
 * @param {string} input - El input a validar
 * @returns {Object} { safe: boolean, issues: string[], riskScore: number }
 */
export const validatePromptSafety = (input) => {
    const issues = [];
    let riskScore = 0;

    if (!input) {
        return { safe: true, issues: [], riskScore: 0 };
    }

    // 1. Detectar inyección
    const injection = detectPromptInjection(input);
    if (injection.detected) {
        issues.push(`Patrón de inyección detectado: ${injection.matched}`);
        riskScore += 50;
    }

    // 2. Validar longitud
    const lengthValidation = validateInputLength(input);
    if (!lengthValidation.valid) {
        issues.push(lengthValidation.error);
        riskScore += 30;
    }

    // 3. Detectar múltiples delimitadores de prompt
    const delimiters = ['[SYSTEM', '[USER', '[TASK', '[CONTEXT', '[INSTRUCTION'];
    const delimiterCount = delimiters.filter(d => input.toUpperCase().includes(d)).length;
    if (delimiterCount > 2) {
        issues.push(`Múltiples delimitadores de prompt detectados (${delimiterCount})`);
        riskScore += 25;
    }

    // 4. Detectar cambios de rol
    if (/you\s+(are|should be|will be|must be).+(now|from now|henceforth)/i.test(input)) {
        issues.push('Intento de cambio de rol detectado');
        riskScore += 35;
    }

    return {
        safe: riskScore < 40,
        issues,
        riskScore,
        maxScore: 100
    };
};

/**
 * Log de intento de inyección detectado
 */
export const logInjectionAttempt = (input, detection) => {
    console.warn(
        `🚨 [PROMPT INJECTION] Attempt Detected`,
        {
            pattern: detection.pattern,
            matched: detection.matched,
            input: input.substring(0, 150) + (input.length > 150 ? '...' : ''),
            timestamp: new Date().toISOString()
        }
    );

    // Enviar a backend para auditoría
    try {
        fetch('/api/audit/injection-attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'prompt_injection',
                pattern: detection.pattern,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            })
        }).catch(() => {}); // Silent fail
    } catch (e) {
        // Ignore
    }
};

/**
 * Sugiere al usuario que su mensaje podría ser sospechoso
 * @returns {string} Mensaje de advertencia
 */
export const getInjectionWarningMessage = () => {
    return `⚠️ Tu mensaje contiene patrones que podrían ser interpretados como una instrucción alternativa. ` +
           `¿Deseas continuar? El sistema sanitizará tu mensaje automáticamente.`;
};
