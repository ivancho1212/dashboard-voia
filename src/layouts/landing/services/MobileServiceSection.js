import React from "react";

const MobileServiceSection = () => {
  return (
    <section id="service-mobile" style={styles.section}>
      <div style={styles.overlay}></div>
      <div style={styles.content}>
        <h2 style={styles.title}>Desarrollo Móvil</h2>
        <p style={styles.paragraph}>
          Desarrollamos aplicaciones móviles para iOS y Android usando tecnologías como React Native y Flutter. Nos enfocamos en rendimiento, experiencia de usuario y escalabilidad.
        </p>
      </div>
    </section>
  );
};

const styles = {
  section: {
    position: "relative",
    backgroundImage: `url('/Gemini_Generated_Image_k1rhrfk1rhrfk1rh.png')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    padding: "6rem 2rem",
    borderBottom: "1px solid #222",
    display: "flex",
    alignItems: "center",
    justifyContent: "center", // Centrado horizontal
    minHeight: "400px",
    textAlign: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Filtro oscuro
    zIndex: 0,
  },
  content: {
    position: "relative",
    maxWidth: "700px",
    zIndex: 1,
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
  },
  paragraph: {
    fontSize: "1.2rem",
    lineHeight: "1.6",
    color: "#ddd",
  },
};

export default MobileServiceSection;
