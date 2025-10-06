import axios from "axios";

const API_URL = "http://localhost:5006/api";

class WidgetAuthService {
  constructor() {
    this.tokenCache = new Map();
  }

  async getWidgetToken(botId) {
    try {
      console.log(`🔑 Generando token para bot ${botId}...`);
      
      const response = await axios.post(`${API_URL}/BotIntegrations/generate-widget-token`, {
        botId: botId,
        allowedDomain: 'localhost' // Para desarrollo
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const tokenData = response.data;
      console.log(`🔑 Token generado para bot: ${botId}`, {
        token: tokenData.token?.substring(0, 20) + '...',
        expiresAt: tokenData.expiresAt
      });
      
      return tokenData.token;
    } catch (error) {
      console.error('❌ Error generando token de widget:', error);
      throw error;
    }
  }

  async getWidgetSettings(botId, token) {
    try {
      console.log(` Cargando configuración del bot ${botId} desde la base de datos...`);
      const response = await axios.get(`${API_URL}/BotStyles/widget/${botId}`);
      
      if (response.data && response.data.styles) {
        console.log(" Datos obtenidos directamente de la DB:", response.data);
        return {
          settings: response.data,
          isValid: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          botId
        };
      } else {
        throw new Error(`Datos incompletos recibidos de la API para el bot ${botId}`);
      }
    } catch (error) {
      console.error(` Error crítico al obtener datos del bot ${botId} desde la DB:`, error.message);
      throw new Error(`No se pudieron cargar los datos del bot ${botId} desde la base de datos. Error: ${error.message}`);
    }
  }
}

const widgetAuthService = new WidgetAuthService();
export default widgetAuthService;
