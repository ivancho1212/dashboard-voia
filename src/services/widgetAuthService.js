import axios from "axios";

const API_URL = "http://localhost:5006/api";

class WidgetAuthService {
  constructor() {
    this.tokenCache = new Map();
    this.invalidTokens = new Set(); // Cache de tokens que fallaron (401)
  }

  /**
   * Valida si un JWT está expirado (solo validación de tiempo, no de seguridad)
   * @param {string} token - JWT token
   * @returns {boolean} - true si token NO está expirado
   */
  isTokenNotExpired(token) {
    if (!token || typeof token !== 'string') return false;
    
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      
      const now = Math.floor(Date.now() / 1000);
      const isExpired = now > payload.exp;
      
      if (isExpired) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Marcar un token como inválido (rechazado por servidor con 401)
   */
  markTokenAsInvalid(token) {
    if (token) {
      this.invalidTokens.add(token);
    }
  }

  /**
   * Verificar si un token fue previamente rechazado
   */
  wasTokenRejected(token) {
    return this.invalidTokens.has(token);
  }

  async getWidgetToken(botId) {
    try {
      const response = await axios.post(`${API_URL}/BotIntegrations/generate-widget-token`, {
        botId: botId,
        allowedDomain: 'localhost' // Para desarrollo
      }, {
        headers: {
          "Content-Type": "application/json"
        }
      });

      const tokenData = response.data;
      return tokenData.token;
    } catch (error) {
      throw error;
    }
  }

  async getWidgetSettings(botId, token) {
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await axios.get(`${API_URL}/BotStyles/widget/${botId}`, {
        headers
      });
      
      if (response.data && response.data.styles) {
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
      throw new Error(`No se pudieron cargar los datos del bot ${botId} desde la base de datos. Error: ${error.message}`);
    }
  }
}

const widgetAuthService = new WidgetAuthService();
export default widgetAuthService;
