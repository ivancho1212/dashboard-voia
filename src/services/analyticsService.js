import axios from "axios";

const API_BASE_URL = "http://localhost:5006/api";

const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getAdminOverview = async () => {
  const response = await axios.get(`${API_BASE_URL}/analytics/admin/overview`, {
    headers: authHeader(),
  });
  return response.data;
};

export const getBotStats = async (botId) => {
  const response = await axios.get(`${API_BASE_URL}/analytics/bot/${botId}/stats`, {
    headers: authHeader(),
  });
  return response.data;
};

export const getAllBotsAdmin = async () => {
  const response = await axios.get(`${API_BASE_URL}/analytics/admin/bots`, {
    headers: authHeader(),
  });
  return response.data;
};
