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
      localStorage.setItem("authToken", response.data.token);
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
    console.error("Error al registrar:", error.response?.data?.message || error.message);
    throw new Error(error.response?.data?.message || "Error desconocido");
  }
};
