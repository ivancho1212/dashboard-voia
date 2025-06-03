// src/services/botIaProviderService.js
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";

export const getIaProviders = async () => {
  const response = await axios.get(`${API_BASE_URL}/api/BotIaProviders`);
  return response.data;
};
