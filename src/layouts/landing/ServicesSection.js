import React from "react";

const icons = {
  web: (
    <svg width="40" height="40" fill="#1e3c72" viewBox="0 0 24 24">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zM4 12a8 8 0 0110.32-7.6 8.05 8.05 0 00-5.1 7.6 8.05 8.05 0 005.1 7.6A8 8 0 014 12zm14.66 4.24A8.04 8.04 0 0112 20a8 8 0 010-16c2.22 0 4.22.9 5.66 2.34a8.02 8.02 0 010 11.3z" />
    </svg>
  ),
  mobile: (
    <svg width="40" height="40" fill="#1e3c72" viewBox="0 0 24 24">
      <path d="M7 2C5.9 2 5 2.9 5 4v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2H7zm5 19c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm4-3H8V5h8v13z" />
    </svg>
  ),
  ai: (
    <svg width="40" height="40" fill="#1e3c72" viewBox="0 0 24 24">
      <path d="M12 2a5 5 0 00-5 5v1H6a4 4 0 000 8h1v1a5 5 0 005 5 5 5 0 005-5v-1h1a4 4 0 000-8h-1V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H9V7a3 3 0 013-3zm-6 7a2 2 0 010 4H6a2 2 0 010-4h1zm12 0a2 2 0 010 4h-1a2 2 0 010-4h1zm-4 4v2a3 3 0 11-6 0v-2h6z" />
    </svg>
  ),
  support: (
    <svg width="40" height="40" fill="#1e3c72" viewBox="0 0 24 24">
      <path d="M12 1a11 11 0 00-11 11c0 5.24 3.97 9.57 9 10.73V21a1 1 0 112 0v1c5.03-1.16 9-5.49 9-10.73A11 11 0 0012 1zm0 2a9 9 0 019 9c0 3.87-2.44 7.16-6 8.44V17a1 1 0 00-2 0v3.44A9 9 0 013 12a9 9 0 019-9z" />
    </svg>
  ),
};

const services = [
  {
    title: "Desarrollo Web",
    description: "Aplicaciones web modernas, seguras y escalables adaptadas a tu negocio.",
    icon: icons.web,
  },
  {
    title: "Aplicaciones Móviles",
    description: "Apps para Android y iOS con excelente rendimiento y diseño intuitivo.",
    icon: icons.mobile,
  },
  {
    title: "Integración de IA",
    description: "Automatizamos tareas con inteligencia artificial y aprendizaje automático.",
    icon: icons.ai,
  },
  {
    title: "Chatbots Inteligentes",
    description: "Desarrollamos asistentes virtuales que entienden y responden como humanos.",
    icon: icons.ai,
  },
  {
    title: "Automatización de Procesos",
    description: "Optimiza tu flujo de trabajo y reduce tiempos con soluciones automatizadas.",
    icon: icons.web,
  },
  {
    title: "Mantenimiento y Soporte",
    description: "Monitoreo, actualizaciones y mejoras continuas para tus sistemas existentes.",
    icon: icons.support,
  },
];

const ServicesSection = () => {
  return (
    <section id="services" style={styles.section}>
      <h2 style={styles.title}>Servicios</h2>
      <div style={styles.grid}>
        {services.map((service, index) => (
          <div
            key={index}
            style={{
              ...styles.card,
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-8px) scale(1.03)";
              e.currentTarget.style.boxShadow = "0 12px 30px rgba(0, 0, 0, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = styles.card.boxShadow;
            }}
          >
            <div style={styles.icon}>{service.icon}</div>
            <h3 style={styles.cardTitle}>{service.title}</h3>
            <p style={styles.cardDesc}>{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const styles = {
  section: {
    padding: "80px 20px",
    backgroundColor: "#000",
    textAlign: "center",
  },
  title: {
    fontSize: "2.5rem",
    marginBottom: "2rem",
    color: "#00bfa5",
    fontWeight: 600,
    fontFamily: "'Varela Round', sans-serif",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "2rem",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  card: {
    backgroundColor: "#fff",
    padding: "2rem",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.05)",
    cursor: "pointer",
  },
  icon: {
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "1.4rem",
    fontWeight: "bold",
    color: "#333",
    marginBottom: "0.5rem",
    fontFamily: "'Varela Round', sans-serif",
  },
  cardDesc: {
    fontSize: "1rem",
    color: "#555",
    fontFamily: "'Varela Round', sans-serif",
  },
};

export default ServicesSection;
