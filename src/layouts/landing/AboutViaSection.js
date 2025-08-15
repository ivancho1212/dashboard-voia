// src/layouts/landing/AboutViaSection.js (Corregido)
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

// El componente AboutViaSection ahora renderiza directamente el contenido.
const AboutViaSection = () => {
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    console.log("AboutViaSection montada / visible");
  }, []);

  return (
    <section id="via" style={styles.section}>
      <div style={styles.container}>
        <p style={styles.subtitle}>IA para empresas</p>
        <h2 style={styles.headline}>
          Soluciones Full-Stack con Inteligencia Artificial
        </h2>
        <p style={styles.summary}>
          Resultados tangibles con datos de calidad, modelos personalizados,
          agentes inteligentes y despliegue ágil.
        </p>

        <div style={styles.logos}>
          <img
            src="/logo-gemini.webp"
            alt="Gemini"
            style={{ ...styles.logoGemini, ...hoverEffect(hovered === "gemini") }}
            onMouseEnter={() => setHovered("gemini")}
            onMouseLeave={() => setHovered(null)}
          />
          <img
            src="/logo-chatgpt.webp"
            alt="ChatGPT"
            style={{ ...styles.logoChatgpt, ...hoverEffect(hovered === "chatgpt") }}
            onMouseEnter={() => setHovered("chatgpt")}
            onMouseLeave={() => setHovered(null)}
          />
          <img
            src="/logo-claude.webp"
            alt="Claude"
            style={{ ...styles.logoClaude, ...hoverEffect(hovered === "claude") }}
            onMouseEnter={() => setHovered("claude")}
            onMouseLeave={() => setHovered(null)}
          />
          <img
            src="/logo-DeepSeek.webp"
            alt="DeepSeek"
            style={{ ...styles.logoDeepSeek, ...hoverEffect(hovered === "deepseek") }}
            onMouseEnter={() => setHovered("deepseek")}
            onMouseLeave={() => setHovered(null)}
          />
        </div>
      </div>
    </section>
  );
};

// Se eliminó el componente AboutViaContent, ya que no es necesario
// para este caso. Su lógica se integró directamente en AboutViaSection.

// Se eliminó la validación de props para AboutViaContent
// y se movieron los propTypes directamente a AboutViaSection si fueran necesarios.

// Función para aplicar el efecto hover
const hoverEffect = (isHovered) => ({
  transform: isHovered ? "scale(1.12)" : "scale(1)",
  filter: isHovered ? "brightness(1.15)" : "brightness(1)",
  transition: "transform 0.3s ease, filter 0.3s ease",
});

const styles = {
  section: {
    backgroundColor: "#0e0e0e",
    padding: "100px 20px",
    color: "#fff",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    textAlign: "center",
  },
  subtitle: {
    color: "#00bfa5",
    fontWeight: "bold",
    fontSize: "1rem",
    textTransform: "uppercase",
    marginBottom: "0.8rem",
  },
  headline: {
    fontSize: "2.2rem",
    fontWeight: "700",
    marginBottom: "0.4rem",
  },
  summary: {
    fontSize: "1.1rem",
    color: "#ccc",
    marginBottom: "2rem",
  },
  logos: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "100px",
    marginTop: "30px",
    flexWrap: "wrap",
  },
  logoGemini: {
    width: "90px",
    height: "90px",
    marginBottom: "10px",
    objectFit: "contain",
  },
  logoChatgpt: {
    width: "120px",
    height: "120px",
    marginTop: "10px",
    objectFit: "contain",
  },
  logoClaude: {
    width: "100px",
    height: "100px",
    objectFit: "contain",
  },
  logoDeepSeek: {
    width: "100px",
    height: "100px",
    objectFit: "contain",
  },
};

export default AboutViaSection;