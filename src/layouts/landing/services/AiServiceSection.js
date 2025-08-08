// src/layouts/landing/services/AiServiceSection.js
import React from "react";

const AiServiceSection = () => {
  return (
    <section id="service-ai" style={styles.section}>
      <div style={styles.overlay}></div>
      <div style={styles.content}>
        <div style={styles.textContainer}>
          <h2 style={styles.title}>Soluciones con Inteligencia Artificial</h2>
          <p style={styles.paragraph}>
            Integramos IA en tus procesos para automatizar tareas, tomar decisiones inteligentes y
            mejorar la atención al cliente. Utilizamos modelos de lenguaje, visión computarizada y
            machine learning.
          </p>
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: {
    position: "relative",
    padding: "4rem 1.5rem",
    borderBottom: "1px solid #eee",
    backgroundColor: "#000",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    overflow: "hidden",
  },

  content: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1000px",
    margin: "0 auto",
    textAlign: "right", // texto alineado a la derecha
  },
  textContainer: {
    padding: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
    color: "#fff",
  },
  paragraph: {
    fontSize: "1.2rem",
    lineHeight: "1.6",
    color: "#ddd",
  },
};

export default AiServiceSection;
