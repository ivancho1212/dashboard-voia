// src/layouts/landing/services/SupportServiceSection.js
import React from "react";

const SupportServiceSection = () => {
  return (
    <section id="service-support" style={styles.section}>
      <div style={styles.overlay}></div>
      <div style={styles.content}>
        <div style={styles.textContainer}>
          <h2 style={styles.title}>Soporte y Mantenimiento</h2>
          <p style={styles.paragraph}>
            Ofrecemos soporte técnico continuo, mantenimiento preventivo y correctivo para asegurar el funcionamiento óptimo de tus soluciones digitales.
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
    backgroundImage: "url('/Gemini_Generated_Image_idg6lvidg6lvidg6.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    overflow: "hidden",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // oscurecimiento
    zIndex: 1,
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

export default SupportServiceSection;
