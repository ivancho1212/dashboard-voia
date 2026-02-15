// src/contexts/AuthContext.js
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { getApiBaseUrl } from "config/environment";
import { Box, CircularProgress } from "@mui/material";

export const AuthContext = createContext(null);

// Permitir que el interceptor de axios cierre sesión en React (logout desde fuera del árbol)
let authLogoutCallback = null;
export function setAuthLogoutCallback(cb) {
  authLogoutCallback = cb;
}
export function runAuthLogout() {
  if (typeof authLogoutCallback === "function") authLogoutCallback();
}

// Registrar en window para que axiosConfig pueda llamarlo sin importar AuthContext directamente
if (typeof window !== 'undefined') {
  window.__runAuthLogout = runAuthLogout;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const navigate = useNavigate();
  const logoutRef = useRef(null);

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!storedToken || !storedUser) {
      setHydrated(true);
      return;
    }

    let cancelled = false;
    const baseUrl = getApiBaseUrl();
    const meUrl = baseUrl.replace(/\/api\/?$/, "") + "/api/users/me";

    fetch(meUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${storedToken}`, "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => {
        if (cancelled) return;
        if (res.status === 401 || res.status === 403) {
          clearSession();
          setHydrated(true);
          return;
        }
        if (res.ok) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setToken(storedToken);
            setIsAuthenticated(true);
          } catch (e) {
            clearSession();
          }
        } else {
          clearSession();
        }
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          setHydrated(true);
        }
      });

    return () => { cancelled = true; };
  }, []);

  const login = (userData, userToken) => {
    localStorage.setItem("token", userToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearSession();
    navigate("/authentication/sign-in", { replace: true });
  };

  logoutRef.current = logout;
  useEffect(() => {
    setAuthLogoutCallback(() => {
      if (logoutRef.current) logoutRef.current();
    });
    return () => setAuthLogoutCallback(null);
  }, []);

  if (!hydrated) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", bgcolor: "background.paper" }}>
        <CircularProgress color="info" />
      </Box>
    );
  }
  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
