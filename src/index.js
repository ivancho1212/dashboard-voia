import React from "react";
import ReactDOM from "react-dom/client";
import PropTypes from "prop-types";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Soft UI Dashboard React Context Provider
import { SoftUIControllerProvider } from "context";
import { AuthProvider } from "contexts/AuthContext";

// Reducir impacto de OOM: no dejar que el overlay intente renderizar (evita OOM en cadena)
if (typeof window !== "undefined") {
  const isOOM = (e) => {
    const msg = (e && (e.message || e.reason && (e.reason.message || String(e.reason)))) || "";
    return msg === "out of memory" || String(msg).includes("out of memory");
  };
  window.addEventListener("unhandledrejection", (ev) => {
    if (isOOM(ev)) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  });
  window.addEventListener("error", (ev) => {
    if (isOOM(ev)) ev.preventDefault();
  });
}

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    const msg = error?.message ?? String(error);
    const isOOM = msg === "out of memory" || msg.includes("out of memory");
    return {
      hasError: true,
      error: isOOM ? { message: "out of memory" } : error
    };
  }

  componentDidCatch(error, info) {
    if (error?.message !== "out of memory") {
      console.error("ErrorBoundary:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message ?? String(this.state.error);
      const isOOM = msg === "out of memory";
      return (
        <div style={{ padding: 20, fontFamily: "sans-serif", background: "#fff", color: "#c00" }}>
          <h1>Error en la aplicación</h1>
          <p style={{ fontSize: 14 }}>{isOOM ? "Memoria insuficiente. Recarga la página o cierra otras pestañas." : msg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <SoftUIControllerProvider>
          <App />
        </SoftUIControllerProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
