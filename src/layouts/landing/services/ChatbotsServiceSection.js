import React from "react";

const ChatbotsServiceSection = () => {
  return (
    <section id="service-chatbots" style={styles.section}>
      <div style={styles.overlay}></div>
      <div style={styles.content}>
        <h2 style={styles.title}>Chatbots Personalizados</h2>
        <p style={styles.paragraph}>
          Creamos asistentes virtuales que entienden y responden de forma natural usando lenguaje humano. Integración con WhatsApp, Messenger, sitios web y más.
        </p>
      </div>
    </section>
  );
};

const styles = {
  section: {
    position: "relative",
    backgroundImage: `url('/Gemini_Generated_Image_nfja0pnfja0pnfja.png')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    color: "#fff",
    padding: "6rem 1rem",
    borderBottom: "1px solid #222",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "400px",
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
    zIndex: 1,
    maxWidth: "700px",
    textAlign: "center",
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

export default ChatbotsServiceSection;
