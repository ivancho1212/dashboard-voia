// src/utils/errorHandler.js
/**
 * Gestor centralizado de errores de API
 * Sincronizado con cambios de seguridad del backend
 */

/**
 * Procesa errores de API y retorna información legible
 * @param {Error} error - El error de axios o similar
 * @param {string} context - Contexto donde ocurrió el error (para logging)
 * @returns {Object} { severity, message, userMessage, action, details }
 */
export const handleApiError = (error, context = 'API Call') => {
    const status = error.response?.status;
    const data = error.response?.data;
    const message = data?.message || data?.detail || error.message;

    console.error(`[${context}] API Error:`, {
        status,
        message,
        data,
        timestamp: new Date().toISOString()
    });

    // 2xx - Success (no debería llegara aquí)
    if (status >= 200 && status < 300) {
        return {
            severity: 'success',
            message: message || 'Operación exitosa',
            userMessage: 'La operación se completó correctamente',
            action: null
        };
    }

    // 4xx - Client errors
    if (status === 400) {
        return {
            severity: 'warning',
            message: message || 'Solicitud inválida',
            userMessage: 'Verifica que los datos sean correctos. ' + (message ? `Detalle: ${message}` : ''),
            action: 'SHOW_DETAILS',
            details: data
        };
    }

    if (status === 401) {
        return {
            severity: 'error',
            message: 'No autenticado',
            userMessage: 'Tu sesión ha expirado. Por favor inicia sesión nuevamente.',
            action: 'LOGOUT',
            details: { reason: 'unauthorized' }
        };
    }

    if (status === 403) {
        return {
            severity: 'error',
            message: 'Acceso denegado',
            userMessage: 'No tienes permiso para realizar esta acción. ' + (message || ''),
            action: 'REDIRECT_HOME',
            details: { reason: 'forbidden' }
        };
    }

    if (status === 404) {
        return {
            severity: 'warning',
            message: 'Recurso no encontrado',
            userMessage: 'El recurso que buscas no existe o fue eliminado.',
            action: 'NAVIGATE_BACK',
            details: { reason: 'not_found' }
        };
    }

    if (status === 409) {
        return {
            severity: 'warning',
            message: message || 'Conflicto',
            userMessage: 'Este recurso ya existe o fue modificado por otro usuario. Recarga la página.',
            action: 'RELOAD',
            details: { reason: 'conflict' }
        };
    }

    if (status === 413) {
        return {
            severity: 'warning',
            message: 'Archivo demasiado grande',
            userMessage: 'El archivo que intentas cargar es demasiado grande. Máximo 50MB.',
            action: null,
            details: { reason: 'payload_too_large' }
        };
    }

    if (status === 422) {
        return {
            severity: 'warning',
            message: 'Datos inválidos',
            userMessage: 'Verifica que todos los campos requeridos estén llenos y sean válidos.',
            action: 'SHOW_VALIDATION',
            details: data?.errors || data
        };
    }

    // 5xx - Server errors
    if (status >= 500 && status < 600) {
        return {
            severity: 'error',
            message: `Error del servidor (${status})`,
            userMessage: 'Ocurrió un error en el servidor. Intenta más tarde o contacta a soporte.',
            action: 'SHOW_ERROR_CODE',
            details: { status, message }
        };
    }

    // Network errors
    if (!status) {
        if (error.message === 'Network Error') {
            return {
                severity: 'error',
                message: 'Error de conexión',
                userMessage: 'No hay conexión a internet. Verifica tu conexión e intenta nuevamente.',
                action: 'RETRY',
                details: { reason: 'no_network' }
            };
        }

        if (error.code === 'ECONNABORTED') {
            return {
                severity: 'error',
                message: 'Tiempo de espera agotado',
                userMessage: 'La solicitud tardó demasiado. Intenta nuevamente.',
                action: 'RETRY',
                details: { reason: 'timeout' }
            };
        }
    }

    // Default error
    return {
        severity: 'error',
        message: message || 'Error desconocido',
        userMessage: 'Ocurrió un error inesperado. Por favor intenta nuevamente.',
        action: 'SHOW_ERROR',
        details: { error: error.message }
    };
};

/**
 * Hook para usar manejo de errores en componentes
 * @returns { executeCall, loading, error }
 */
export const useApiCall = () => {
    const [loading, setLoading] = require('react').useState(false);
    const [error, setError] = require('react').useState(null);

    const executeCall = async (apiFunction, context = 'API Call') => {
        try {
            setLoading(true);
            setError(null);
            const result = await apiFunction();
            return result;
        } catch (err) {
            const errorInfo = handleApiError(err, context);
            setError(errorInfo);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { executeCall, loading, error };
};

/**
 * Convierte errores a formato de validación para formularios
 * @param {Object} errors - Errores del backend
 * @returns {Object} Mapa de field -> error message
 */
export const convertToFormErrors = (errors) => {
    if (Array.isArray(errors)) {
        return errors.reduce((acc, err) => {
            acc[err.field || 'general'] = err.message || err;
            return acc;
        }, {});
    }

    if (typeof errors === 'object') {
        return errors;
    }

    return { general: errors };
};

/**
 * Determina si un error es "recoverable" (se puede reintentar)
 */
export const isRecoverableError = (status) => {
    // Errores recuperables
    const recoverableStatuses = [408, 429, 500, 502, 503, 504];
    return recoverableStatuses.includes(status);
};

/**
 * Determina si un error es "fatal" (requiere logout)
 */
export const isFatalError = (status) => {
    const fatalStatuses = [401, 403];
    return fatalStatuses.includes(status);
};
