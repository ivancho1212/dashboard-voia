// src/layouts/landing/AboutVoiaSection.js
import React from "react";

const AboutVoiaSection = () => {
  return (
    <section style={styles.section} id="via">
      <div style={styles.overlay}>
        <div style={styles.content}>
          <h2 style={styles.title}>¿Qué es Via?</h2>
          <p style={styles.description}>
            Via es una solución de atención automatizada que combina inteligencia artificial con interacción humana. Diseñada para escalar, entrenar y adaptarse a tus necesidades empresariales.
          </p>
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: {
    position: "relative",
    backgroundImage: "url('/Gemini_Generated_Image_4ohro64ohro64ohr.jpg')",
    backgroundAttachment: "fixed",
    backgroundSize: "cover",
    backgroundPosition: "center",
    height: "400px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 20px",
  },
  content: {
    color: "#fff",
    textAlign: "center",
    maxWidth: "800px",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
  },
  description: {
    fontSize: "1.2rem",
    lineHeight: "1.6",
  },
};

export default AboutVoiaSection;
