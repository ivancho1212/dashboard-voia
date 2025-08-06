import React from "react";

const UseCasesSection = () => {
  return (
    <section style={styles.section}>
      <div style={styles.container}>
        <h2 style={styles.title}>Casos de uso</h2>
        <div style={styles.grid}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Soporte Técnico</h3>
            <p>Resuelve preguntas frecuentes automáticamente y redirige casos complejos a un agente.</p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Ecommerce</h3>
            <p>Asiste a tus clientes durante el proceso de compra y brinda seguimiento post-venta.</p>
          </div>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Agendamiento de Citas</h3>
            <p>Permite a los usuarios programar citas médicas, legales o consultorías sin intervención humana.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

const styles = {
  section: {
    padding: "80px 20px",
    backgroundColor: "#ffffff",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    textAlign: "center",
  },
  title: {
    fontSize: "2rem",
    color: "#1e3c72",
    marginBottom: "2rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
  },
  card: {
    backgroundColor: "#f0f4f8",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: "1.2rem",
    marginBottom: "10px",
    color: "#1e3c72",
  },
};

export default UseCasesSection;
