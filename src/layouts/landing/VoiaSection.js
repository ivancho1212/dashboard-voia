import React from "react";

const VoiaSection = () => {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <h2 style={styles.title}>¿Por qué elegir VIA?</h2>
        <p style={styles.text}>
          VIA no es solo un chatbot. Es una plataforma integral que conecta inteligencia artificial
          con experiencia personalizada. Su diseño modular y escalable permite que empresas pequeñas y grandes se beneficien de atención automatizada sin perder el toque humano.
        </p>

        <div style={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <div key={idx} style={styles.card}>
              <div style={styles.iconContainer}>{feature.icon}</div>
              <h3 style={styles.cardTitle}>{feature.title}</h3>
              <p style={styles.cardText}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const features = [
  {
    title: "Adaptable a sectores",
    description: "Funciona en salud, ecommerce, servicios y más.",
    icon: (
      <svg width="40" height="40" fill="#1e3c72" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
      </svg>
    ),
  },
  {
    title: "Integración rápida",
    description: "Se conecta fácilmente con tu web o app.",
    icon: (
      <svg width="40" height="40" fill="#1e3c72" viewBox="0 0 24 24">
        <path d="M10.59 13.41L9.17 12l4.24-4.24 1.41 1.41L12 12l2.83 2.83-1.41 1.41z" />
      </svg>
    ),
  },
  {
    title: "Panel de control",
    description: "Administra conversaciones y estadísticas en tiempo real.",
    icon: (
      <svg width="40" height="40" fill="#1e3c72" viewBox="0 0 24 24">
        <path d="M3 13h2v-2H3v2zm4 4h2v-6H7v6zm4 2h2V7h-2v12zm4-4h2v-4h-2v4zm4-10v14H5V5h14m0-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
      </svg>
    ),
  },
  {
    title: "IA con contexto",
    description: "Aprende y mejora según la interacción.",
    icon: (
      <svg width="40" height="40" fill="#1e3c72" viewBox="0 0 24 24">
        <path d="M12 3C7 3 3 7 3 12s4 9 9 9 9-4 9-9-4-9-9-9zm0 16a7 7 0 110-14 7 7 0 010 14zm0-10a3 3 0 100 6 3 3 0 000-6z" />
      </svg>
    ),
  },
];

const styles = {
  section: {
    backgroundColor: "#f4f7fa",
    padding: "80px 20px",
    fontFamily: '"Varela Round", sans-serif',
  },
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    textAlign: "center",
  },
  title: {
    fontSize: "2.5rem",
    color: "#1e3c72",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.1rem",
    color: "#444",
    marginBottom: "3rem",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "2rem",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.08)",
    transition: "transform 0.3s ease",
  },
  iconContainer: {
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "1.2rem",
    color: "#1e3c72",
    marginBottom: "0.5rem",
  },
  cardText: {
    fontSize: "1rem",
    color: "#555",
  },
};

export default VoiaSection;
