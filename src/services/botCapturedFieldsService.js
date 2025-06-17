import axios from "axios";

export const getCapturedFields = (templateId) =>
  axios.get(`/api/BotCapturedFields/by-template/${templateId}`);

export const createCapturedField = (data) =>
  axios.post("/api/BotCapturedFields", data);

export const updateCapturedField = (data) =>
  axios.put(`/api/BotCapturedFields/${data.id}`, data);
