// src/layouts/landing/ClientsSection.js (Corregido)
import React, { useEffect } from "react";
// Ya no es necesario importar LazySection aquí
// import LazySection from "./LazySection";
import NeuralBackground from "../../components/NeuralBackground";

const ClientsSection = () => {
  useEffect(() => {
    console.log("ClientsSection montada / visible");
  }, []);

  return (
    <section id="clients" style={styles.section}>
      <NeuralBackground />
      <div style={styles.container}>
        <p style={styles.subtitle}>
          Empresas líderes en tecnología e inteligencia artificial
        </p>
        <h4 style={styles.title}>Socios estratégicos que confían en nosotros</h4>

        <div style={styles.logos}>
          <img src="/logo-google.webp" alt="Google" style={styles.logo} />
          <img src="/logo-openAI.webp" alt="Open AI" style={styles.logo} />
          <img src="/logo-mistarl.webp" alt="Misatral" style={styles.logo} />
          <img src="/logo-anthropic.webp" alt="Anthropic" style={styles.logo} />
          <img src="/logo-microsoft.webp" alt="Microsoft" style={styles.logo} />
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: {
    position: "relative",
    padding: "250px 20px",
    backgroundColor: "#0e0e0e",
    color: "#fff",
    overflow: "hidden",
  },
  container: {
    position: "relative",
    zIndex: 1,
    maxWidth: "1200px",
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
  title: {
    fontSize: "2.2rem",
    marginBottom: "2.5rem",
  },
  logos: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: "100px",
  },
  logo: {
    maxWidth: "120px",
    height: "auto",
    objectFit: "contain",
  },
};

export default ClientsSection;