// src/services/fileValidationService.js
/**
 * Servicio de validación de archivos para el frontend
 * Sincronizado con FileAccessAuthorizationService del backend
 */

// Extensiones bloqueadas (coincide con backend FileAccessAuthorizationService)
export const BLOCKED_EXTENSIONS = new Set([
    // Ejecutables
    'exe', 'dll', 'so', 'dylib', 'bin', 'elf',
    // Scripts
    'py', 'sh', 'ps1', 'cmd', 'bat', 'vbs', 'js', 'vb', 'pl', 'rb',
    // Macros
    'docm', 'xlsm', 'pptm', 'xlam', 'potm', 'ppsm',
    // Archivos de sistema
    'sys', 'drv', 'com', 'scr', 'pif', 'cpl',
    // Otros ejecutables
    'msi', 'wsl', 'app', 'dmg', 'deb', 'rpm'
]);

// MIME types bloqueados
export const BLOCKED_MIME_TYPES = new Set([
    'application/x-executable',
    'application/x-elf',
    'application/x-mach-binary',
    'text/x-shellscript',
    'text/x-python',
    'text/x-perl',
    'text/x-ruby',
    'application/x-sh',
    'application/x-bash',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-msi',
    'application/x-wine-extension-msp',
]);

// MIME types seguros permitidos
export const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',         // .xlsx
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/msword',                                                         // .doc
    'application/vnd.ms-excel',                                                   // .xls
    'application/vnd.ms-powerpoint',                                              // .ppt
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
]);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Valida que un archivo sea seguro para cargar
 * @param {File} file - El archivo a validar
 * @returns {Object} { valid: boolean, error?: string, code?: string }
 */
export const validateFileForUpload = (file) => {
    if (!file) {
        return {
            valid: false,
            error: 'Archivo no especificado',
            code: 'NO_FILE'
        };
    }

    // 1. Validar extensión
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
        return {
            valid: false,
            error: `❌ Extensión .${ext} no permitida por razones de seguridad`,
            code: 'BLOCKED_EXTENSION'
        };
    }

    // 2. Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (MAX_FILE_SIZE / 1024 / 1024).toFixed(0);
        return {
            valid: false,
            error: `❌ Archivo muy grande (máx. ${sizeMB}MB, tu archivo: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
            code: 'FILE_TOO_LARGE'
        };
    }

    // 3. Validar MIME type (si está bloqueado)
    if (BLOCKED_MIME_TYPES.has(file.type)) {
        return {
            valid: false,
            error: `❌ Tipo de archivo (${file.type}) no permitido por seguridad`,
            code: 'BLOCKED_MIME_TYPE'
        };
    }

    // 4. Si el archivo no tiene extensión, avisar
    if (!ext) {
        return {
            valid: false,
            error: '❌ El archivo debe tener una extensión',
            code: 'NO_EXTENSION'
        };
    }

    return { valid: true };
};

/**
 * Valida múltiples archivos
 * @param {File[]} files - Array de archivos a validar
 * @returns {Object} { valid: boolean, errors: Object[] }
 */
export const validateMultipleFiles = (files) => {
    const errors = [];
    
    for (let i = 0; i < files.length; i++) {
        const validation = validateFileForUpload(files[i]);
        if (!validation.valid) {
            errors.push({
                fileName: files[i].name,
                ...validation
            });
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Obtiene información del archivo para debugging
 */
export const getFileInfo = (file) => ({
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    type: file.type,
    extension: file.name.split('.').pop()?.toLowerCase(),
    lastModified: new Date(file.lastModified).toLocaleString(),
});

/**
 * Log de intento de carga peligrosa
 */
export const warnBlockedFileUpload = (file, validationResult) => {
    console.warn(
        `🚨 [FILE UPLOAD] Blocked Upload Attempt`,
        {
            file: getFileInfo(file),
            reason: validationResult.code,
            error: validationResult.error,
            timestamp: new Date().toISOString()
        }
    );
};
