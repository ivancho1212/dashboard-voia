import axios from "axios";

const API_BASE_URL = "http://localhost:5006/api";

export const getDocumentTypes = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE_URL}/DocumentTypes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
