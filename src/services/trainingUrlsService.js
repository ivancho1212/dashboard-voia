import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/TrainingUrls`;

export const createTrainingUrl = async (data) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

export const getTrainingUrlsByTemplate = async (botTemplateId) => {
  const response = await axios.get(`${API_URL}/by-template/${botTemplateId}`);
  return response.data;
};

export const deleteTrainingUrl = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
