import React from "react";

const AutomationServiceSection = () => {
  return (
    <section id="service-automation" style={styles.section}>
      <div style={styles.overlay}></div>
      <div style={styles.content}>
        <div style={styles.textContainer}>
          <h2 style={styles.title}>Automatización de Procesos</h2>
          <p style={styles.paragraph}>
            Diseñamos flujos automatizados para reducir tiempos, errores y costos en tareas repetitivas.
            Usamos herramientas como RPA, APIs y scripts personalizados.
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
    backgroundImage: "url('/Gemini_Generated_Image_w5knk9w5knk9w5kn.png')",
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
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    zIndex: 1,
  },
  content: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1000px",
    margin: "0 auto",
    textAlign: "left",
  },
  textContainer: {
    padding: "2rem",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
    color: "#00bfa5",
  },
  paragraph: {
    fontSize: "1.2rem",
    lineHeight: "1.6",
    color: "#ddd",
  },
};

export default AutomationServiceSection;
