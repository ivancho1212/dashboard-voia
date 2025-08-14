// dashboard-via/src/layouts/landing/FaqDetail.js
import React from "react";
import { useParams } from "react-router-dom";
import HeroSection from "./HeroSection";
import { faqData } from "./faqs";
import ContactSection from "./ContactSection";
import ClientsSection from "./ClientsSection";

const FaqDetail = () => {
  const { slug } = useParams();
  const data = faqData.find((item) => item.slug === slug);

  if (!data) {
    return (
      <section style={styles.content}>
        <div style={styles.container}>
          <h2 style={{ textAlign: "center" }}>Pregunta no encontrada</h2>
          <p style={{ textAlign: "center" }}>
            La pregunta que buscas no existe o fue eliminada.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <HeroSection
        title={data.question}
        subtitle={data.shortDescription || data.content.substring(0, 150) + "..."}
        backgroundImage={data.image}
      />

      {/* Nueva sección con fondo negro, título y subtítulo */}
      <section style={styles.blackSection}>
        <div style={styles.blackContainer}>
          <p style={styles.blackSubtitle}>Información detallada</p>
          <h2 style={styles.blackTitle}>{data.sectionTitle || "Detalles y contexto"}</h2>
          <p style={styles.blackContent}>{data.content}</p>
        </div>
      </section>


      <section id="clients">
        <ClientsSection />
      </section>
      <section id="contact">
        <ContactSection />
      </section>
    </>
  );
};

const styles = {
  content: {
    padding: "60px 20px",
    backgroundColor: "#f9f9f9",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  text: {
    fontSize: "1.2rem",
    lineHeight: "1.8",
    color: "#333",
    textAlign: "justify",
  },

  blackSection: {
    backgroundColor: "#000",
    padding: "80px 20px",
    color: "#fff",
  },
  blackContainer: {
    maxWidth: "900px",
    margin: "0 auto",
    textAlign: "center",
  },
  blackSubtitle: {
    color: "#00bfa5",
    fontWeight: "bold",
    fontSize: "1rem",
    textTransform: "uppercase",
    marginBottom: "0.8rem",
  },
  blackTitle: {
    fontSize: "1.8rem",
    fontWeight: "700",
    marginBottom: "1rem",
  },
  blackContent: {
    fontSize: "1.2rem",
    lineHeight: "1.8",
    color: "#ccc",
    textAlign: "justify",
  },
};

export default FaqDetail;
