// services/botTemplatePromptsService.js
import axios from "axios";

export const createBotTemplatePrompt = (promptData) => {
  return axios.post("http://localhost:5006/api/bottemplateprompts", promptData);
};
