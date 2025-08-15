// src/layouts/landing/ViaSection.js (Corregido)
import React from "react";
import widgetImg from "../../assets/images/widget-preview.webp";
import plansImg from "../../assets/images/plans-preview.png";
import { ReactComponent as AdaptableIcon } from '../../assets/icons/adaptable.svg';
import { ReactComponent as BrainIcon } from '../../assets/icons/brain.svg';
import { ReactComponent as PanelIcon } from '../../assets/icons/panel.svg';

const ViaSection = () => {
  return (
    <section id="via" style={styles.section}>
      <div style={styles.container}>
        {/* Introducción */}
        <p style={styles.subtitle}>Plataforma de agentes de inteligencia artificial</p>
        <h2 style={styles.title}>¿Por qué elegir VIA?</h2>
        <p style={styles.text}>
          VIA es mucho más que un chatbot. Es una plataforma para crear{" "}
          <strong style={{ color: "#fff" }}>agentes de inteligencia artificial</strong>{" "}
          totalmente personalizables, listos para trabajar en cualquier área
          de tu empresa. Desde atención médica hasta soporte técnico, VIA se adapta
          a tus necesidades.
        </p>

        {/* Beneficios */}
        <div style={styles.featuresGrid}>
          {features.map((feature, idx) => (
            <div key={idx} style={styles.card}>
              <div style={styles.iconContainer}>{feature.icon}</div>
              <h3 style={styles.cardTitle}>{feature.title}</h3>
              <p style={styles.cardText}>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Widget con texto al lado */}
        <div style={styles.widgetSection}>
          <div style={styles.widgetText}>
            <p style={styles.subtitle}>Vista previa del widget VIA</p>
            <h2 style={styles.widgetTitle}>Interactúa con tus clientes en tiempo real</h2>
            <p style={styles.futureText}>
              Nuestro widget de VIA se integra en tu sitio web en minutos, brindando
              atención automatizada y soporte con IA 24/7. Permite enviar imágenes,
              documentos y capturar datos clave para que nunca pierdas información valiosa.
            </p>
          </div>
          <div style={styles.widgetImage}>
            <img src={widgetImg} alt="Vista previa del widget de VIA" style={styles.image} />
          </div>
        </div>

        {/* Sección futura */}
        <section id="chat" style={styles.futureSection}>
          <p style={styles.subtitle}>Entrenamiento y personalización</p>
          <h2 style={styles.futureTitle}>Crea, entrena y personaliza tu agente de IA</h2>
          <p style={styles.futureText}>
            Con VIA puedes partir de plantillas específicas para tu sector y entrenar
            el agente con{" "}
            <strong style={{ color: "#fff" }}>la información de tu empresa</strong>.
            Personaliza el widget con tus colores, fuentes y avatar. Configura
            la captura de datos clave como{" "}
            <strong style={{ color: "#00bfa5" }}>nombre, documento o correo etc...</strong>,
            recibe imágenes y documentos, y conecta con el{" "}
            <strong style={{ color: "#fff" }}>proveedor de IA que prefieras</strong>.
          </p>
          <p style={styles.futureText}>
            Incluso podrás <strong>interrumpir a la IA</strong> para que un operador humano
            continúe la conversación en tiempo real, manteniendo siempre el control.
          </p>
        </section>

        {/* Sección de planes */}
        <section id="plans" style={styles.plansSection}>
          <p style={styles.subtitle}>Opciones flexibles para tu negocio</p>
          <h2 style={styles.plansTitle}>Planes para cada necesidad</h2>
          <p style={styles.futureText}>
            Elige el plan que mejor se adapte a tu negocio, desde pequeñas empresas hasta
            grandes corporaciones. Accede a estadísticas, exporta datos por{" "}
            <strong>API o Excel</strong> y optimiza la experiencia de tus clientes.
          </p>
          <img src={plansImg} alt="Planes de VIA" style={styles.plansImage} />
        </section>
      </div>
    </section>
  );
};

const features = [
  {
    title: "Adaptable a sectores",
    description: "Atención médica, ecommerce, soporte técnico, educación y más.",
    icon: (
      <AdaptableIcon width={40} height={40} fill="#fff" />
    ),
  },
  {
    title: "Integración rápida",
    description: "Instálalo en minutos en tu web o aplicación.",
    icon: (
      <svg width="40" height="40" fill="#fff" viewBox="0 0 24 24">
        <path d="M10.59 13.41L9.17 12l4.24-4.24 1.41 1.41L12 12l2.83 2.83-1.41 1.41z" />
      </svg>
    ),
  },
  {
    title: "Panel de control",
    description: "Monitorea y administra conversaciones en tiempo real.",
    icon: (
      <PanelIcon width={40} height={40} fill="#fff" />
    ),
  },
  {
    title: "IA con contexto",
    description: "Aprende de cada interacción para mejorar respuestas.",
    icon: (
      <BrainIcon width={40} height={40} fill="#fff" />
    ),
  },

];

const styles = {
  section: {
    backgroundColor: "#000",
    padding: "150px 20px",
    fontFamily: '"Varela Round", sans-serif',
    color: "#ccc",
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
  title: {
    fontSize: "2.5rem",
    color: "#fff",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.1rem",
    color: "#aaa",
    marginBottom: "3rem",
  },
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "2rem",
  },
  card: {
    backgroundColor: "#111",
    padding: "2rem",
    borderRadius: "1rem",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.4)",
    transition: "transform 0.3s ease",
  },
  iconContainer: {
    marginBottom: "1rem",
  },
  cardTitle: {
    fontSize: "1.2rem",
    color: "#fff",
    marginBottom: "0.5rem",
  },
  cardText: {
    fontSize: "1rem",
    color: "#ccc",
  },
  widgetSection: {
    marginTop: "280px",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "40px",
    textAlign: "left",
  },
  widgetText: {
    flex: "1",
    minWidth: "300px",
  },
  widgetTitle: {
    fontSize: "2rem",
    color: "#fff",
    marginBottom: "1rem",
  },
  widgetImage: {
    flex: "1",
    minWidth: "280px",
    textAlign: "center",
  },
  image: {
    width: "60%",
    maxWidth: "350px",
    borderRadius: "1rem",
    filter: `
    drop-shadow(0 0 10px rgba(0, 191, 165, 0.8))
    drop-shadow(0 0 20px rgba(0, 191, 165, 0.6))
    drop-shadow(0 0 30px rgba(0, 191, 165, 0.4))
  `,
    transition: "transform 0.3s ease",
  },
  futureSection: {
    marginTop: "150px",
    paddingTop: "150px",
    borderTop: "1px solid #222",
  },
  futureTitle: {
    color: "#fff",
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  futureText: {
    maxWidth: "800px",
    margin: "0 auto 1rem",
    color: "#aaa",
    lineHeight: "1.6",
  },
  plansSection: {
    marginTop: "150px", // antes 60px
    paddingTop: "150px", // antes 40px
    borderTop: "1px solid #222",
  },
  plansTitle: {
    color: "#fff",
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  plansImage: {
    width: "100%",
    maxWidth: "700px",
    borderRadius: "1rem",
    marginTop: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
  },

};

export default ViaSection;