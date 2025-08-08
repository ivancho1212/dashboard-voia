import React from "react";

const AboutVoiaSection = () => {
  return (
    <section style={styles.section} id="via">
      <div style={styles.container}>
        <p style={styles.subtitle}>IA para empresas</p>
        <h2 style={styles.headline}>Soluciones Full-Stack con Inteligencia Artificial</h2>
        <p style={styles.summary}>
          Resultados tangibles con datos de calidad, modelos personalizados, agentes inteligentes y despliegue ágil.
        </p>

        <div style={styles.logos}>
          <img src="/360_F_815972611_RfHmGN2bO5HAfRpennZXV5l6wJ9PVFrE.jpg" alt="IA Provider 1" style={styles.logo} />
          <img src="/pngimg.com - chatgpt_PNG3.png" alt="OpenAI" style={styles.logo} />
          <img src="/Untitled-design-7.png" alt="Anthropic" style={styles.logo} />
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: {
    backgroundColor: "#050505", // negro más profundo
    padding: "80px 20px",
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
  title: {
    fontSize: "2rem",
    marginBottom: "1.2rem",
  },
  description: {
    fontSize: "1.1rem",
    lineHeight: "1.8",
    marginBottom: "1.2rem",
    padding: "0 10px",
  },
  logos: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "40px",
    marginTop: "30px",
    flexWrap: "wrap",
  },
  logo: {
    height: "60px",
    objectFit: "contain",
    filter: "brightness(0.9)",
  },
};

export default AboutVoiaSection;
