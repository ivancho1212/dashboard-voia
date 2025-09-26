import axios from "axios";

const API_URL = "http://localhost:5006/api/BotDataCaptureFields";

export const getCapturedFields = (botId) => {
  return axios.get(`${API_URL}/by-bot/${botId}`);
};

export const createCapturedField = (fieldData) => {
  const payload = {
    botId: parseInt(fieldData.botId),
    fieldName: fieldData.fieldName,
    fieldType: "text",
    isRequired: fieldData.isRequired ?? true,  // 👈 Usa el valor real, por defecto "true"
  };

  return axios.post(API_URL, payload);
};

export const updateCapturedField = (fieldData) => {
  return axios.put(`${API_URL}/${fieldData.id}`, {
    botId: fieldData.botId,
    fieldName: fieldData.fieldName,
    fieldType: fieldData.fieldType,
    isRequired: fieldData.isRequired
  });
};

export const deleteCapturedField = (fieldId) => {
  return axios.delete(`${API_URL}/${fieldId}`);
};
