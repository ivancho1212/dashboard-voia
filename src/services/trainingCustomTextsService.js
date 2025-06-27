import axios from "axios";

const BASE_URL = "http://localhost:5006/api";
const API_URL = `${BASE_URL}/TrainingCustomTexts`;

export const createTrainingCustomText = async (data) => {
  const response = await axios.post(API_URL, data);
  return response.data;
};

export const getTrainingTextsByTemplate = async (botTemplateId) => {
  const response = await axios.get(`${API_URL}/by-template/${botTemplateId}`);
  return response.data;
};

export const deleteTrainingText = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
