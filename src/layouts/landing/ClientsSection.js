import React from "react";

const ClientsSection = () => {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <p style={styles.subtitle}>Empresas que confían en nosotros</p>
        <h2 style={styles.title}>Con quienes trabajamos</h2>
        <div style={styles.logos}>
          <img src="/google-logo-png-xubx3ihwtrrc42k0.jpg" alt="Google" style={styles.logo} />
          <img src="/8968d0640f2c4053333ce7334314ef83.webp" alt="AWS" style={styles.logo} />
          <img src="/650e823c6cf62f0b69f5b1a0_64c34ca5f2845578bc3b2e5f_stabilityai.png" alt="Stability AI" style={styles.logo} />
          <img src="/ce2ec8123de88ad088b618cc6f2b87f4.jpg" alt="OpenAI" style={styles.logo} />
          <img src="/claude.png" alt="Anthropic" style={styles.logo} />
          <img src="/Screen+Shot+2023-05-18+at+10.10.45+AM.webp" alt="Meta" style={styles.logo} />
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: {
    padding: "80px 20px",
    backgroundColor: "#0e0e0e",
    color: "#fff",
  },
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    textAlign: "center",
  },
  subtitle: {
    color: "#00bcd4",
    fontSize: "1rem",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "1px",
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
    gap: "40px",
  },
  logo: {
    maxWidth: "120px",
    height: "auto",
    objectFit: "contain",
  },
};

export default ClientsSection;
