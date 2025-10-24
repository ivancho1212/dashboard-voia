import axios from "axios";

const API_URL = "http://localhost:5006/api/BotDataCaptureFields";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const getCapturedFields = (botId) => {
  const headers = getAuthHeaders();
  const auth = headers.headers?.Authorization || null;
  console.debug('[botCapturedFieldsService] GET', `${API_URL}/by-bot/${botId}`, { hasAuth: !!auth, authPreview: auth ? `${auth.slice(0,20)}...[len=${auth.length}]` : null });
  return axios.get(`${API_URL}/by-bot/${botId}`, headers);
};

export const createCapturedField = (fieldData) => {
  const payload = {
    botId: parseInt(fieldData.botId),
    fieldName: fieldData.fieldName,
    fieldType: "text",
    isRequired: fieldData.isRequired ?? true,
  };
  const headers = getAuthHeaders();
  const auth = headers.headers?.Authorization || null;
  console.debug('[botCapturedFieldsService] POST', API_URL, { payload, hasAuth: !!auth, authPreview: auth ? `${auth.slice(0,20)}...[len=${auth.length}]` : null });
  return axios.post(API_URL, payload, headers);
};

export const updateCapturedField = (fieldData) => {
  const body = {
    botId: fieldData.botId,
    fieldName: fieldData.fieldName,
    fieldType: fieldData.fieldType,
    isRequired: fieldData.isRequired
  };
  const headers = getAuthHeaders();
  const auth = headers.headers?.Authorization || null;
  console.debug('[botCapturedFieldsService] PUT', `${API_URL}/${fieldData.id}`, { body, hasAuth: !!auth, authPreview: auth ? `${auth.slice(0,20)}...[len=${auth.length}]` : null });
  return axios.put(`${API_URL}/${fieldData.id}`, body, headers);
};

export const deleteCapturedField = (fieldId) => {
  const headers = getAuthHeaders();
  const auth = headers.headers?.Authorization || null;
  console.debug('[botCapturedFieldsService] DELETE', `${API_URL}/${fieldId}`, { hasAuth: !!auth, authPreview: auth ? `${auth.slice(0,20)}...[len=${auth.length}]` : null });
  return axios.delete(`${API_URL}/${fieldId}`, headers);
};
