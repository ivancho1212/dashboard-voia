import axios from "axios";

const API_BASE_URL = "http://localhost:5006/api/Users";

// Función para iniciar sesión
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      email,
      password,
    });

    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }

    return response.data;
  } catch (error) {
    console.error("Error de inicio de sesión:", error.response ? error.response.data : error.message);
    throw error.response ? error.response.data : new Error("Error al intentar iniciar sesión");
  }
};

// Función para registrar un usuario
export const register = async (newUser) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, newUser);
    return response.data;
  } catch (error) {
    console.error("Error al registrar:", error.response?.data?.Details || error.message);
    throw new Error(error.response?.data?.message || "Error desconocido");
  }
};

export const getMyProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_BASE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error al obtener perfil:", error.response?.data || error.message);
    throw error;
  }
};

// authService.js
export const updateMyProfile = async (data) => {
  const token = localStorage.getItem("token");
  const response = await axios.put(`${API_BASE_URL}/me`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
