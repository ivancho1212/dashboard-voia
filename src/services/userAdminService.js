export const deleteRole = async (id) => {
  const token = localStorage.getItem("token");
  const response = await axios.delete(`${API_BASE_URL}/Roles/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
import axios from "axios";

const API_BASE_URL = "http://localhost:5006/api";

export const getUsers = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE_URL}/Users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createUser = async (user) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_BASE_URL}/Users/register`, user, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateUser = async (id, user) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${API_BASE_URL}/Users/${id}`, user, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getRoles = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE_URL}/Roles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createRole = async (role) => {
  const token = localStorage.getItem("token");
  const response = await axios.post(`${API_BASE_URL}/Roles`, role, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const updateRole = async (id, role) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${API_BASE_URL}/Roles/${id}`, role, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const getPermissions = async () => {
  const token = localStorage.getItem("token");
  const response = await axios.get(`${API_BASE_URL}/Permissions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
