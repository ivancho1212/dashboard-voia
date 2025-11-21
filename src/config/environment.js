// Configuración centralizada de entorno
const isDevelopment = process.env.NODE_ENV === 'development';

// URLs base según el entorno (usando variables de entorno si están disponibles)
const config = {
  development: {
    apiBaseUrl: process.env.REACT_APP_DEV_API_URL || 'http://localhost:5006/api',
    widgetFrameUrl: process.env.REACT_APP_DEV_WIDGET_URL || 'http://localhost:3000/widget-frame',
    dashboardUrl: process.env.REACT_APP_DEV_DASHBOARD_URL || 'http://localhost:3000'
  },
  production: {
    apiBaseUrl: process.env.REACT_APP_PROD_API_URL || 'https://api.voia-dashboard.lat/api',
    widgetFrameUrl: process.env.REACT_APP_PROD_WIDGET_URL || 'https://voia-dashboard.lat/widget-frame',
    dashboardUrl: process.env.REACT_APP_PROD_DASHBOARD_URL || 'https://voia-dashboard.lat'
  }
};

// Exportar configuración actual
const currentConfig = isDevelopment ? config.development : config.production;

export default currentConfig;

// Funciones de utilidad
export const getApiBaseUrl = () => currentConfig.apiBaseUrl;
export const getWidgetFrameUrl = () => currentConfig.widgetFrameUrl;
export const getDashboardUrl = () => currentConfig.dashboardUrl;
export const isProduction = () => !isDevelopment;
export const isDev = () => isDevelopment;

// ✅ NUEVO: Validar cumplimiento de CORS (verificar que el origen coincida)
export const validateCorsCompliance = () => {
  const currentOrigin = window.location.origin;
  const expectedOrigin = currentConfig.dashboardUrl;
  
  // Extraer solo el protocolo + host para comparar
  const expectedOriginFull = expectedOrigin.includes('://')
    ? expectedOrigin.substring(0, expectedOrigin.lastIndexOf('/') || expectedOrigin.length)
    : expectedOrigin;
  
  const originMatch = currentOrigin === expectedOriginFull;
  
  if (!originMatch) {
    console.warn(
      `⚠️ [CORS] Posible problema de CORS detectado:\n` +
      `Origen actual: ${currentOrigin}\n` +
      `Origen esperado: ${expectedOriginFull}`
    );
  } else {
    console.info(`✅ [CORS] Origen verificado correctamente: ${currentOrigin}`);
  }
  
  return {
    valid: originMatch,
    currentOrigin,
    expectedOrigin: expectedOriginFull,
    message: originMatch 
      ? `✅ CORS válido: ${currentOrigin}` 
      : `❌ CORS inválido: ${currentOrigin} no coincide con ${expectedOriginFull}`
  };
};