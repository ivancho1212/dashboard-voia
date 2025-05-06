import axios from "axios";

const API_BASE_URL = "http://localhost:5006/api/Users"; 

// Función para iniciar sesión
export const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });
  
      // Almacenar el token en localStorage
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);  // Almacena el token en localStorage
      }
  
      return response.data; // { token, user }
    } catch (error) {
      console.error("Error de inicio de sesión:", error.response ? error.response.data : error.message);
      throw error.response ? error.response.data : new Error('Error al intentar iniciar sesión');
    }
  };
  

  export const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/register`, userData);
      return response.data; // Respuesta de éxito
    } catch (error) {
      console.error("Error al registrar:", error.response ? error.response.data : error.message);
      throw error; // Propaga el error para que se maneje en el componente
    }
  };
