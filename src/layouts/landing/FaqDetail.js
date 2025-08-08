import React from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { ParallaxBanner } from "react-scroll-parallax";

// Datos simulados (esto podría venir de un backend o JSON)
const faqData = {
  "donde-hacer-paginas-web-en-colombia": {
    title: "¿Dónde hacer páginas web en Colombia?",
    image: "/banners/web-colombia.jpg",
    content: "En Voia, creamos páginas web modernas, rápidas y optimizadas para clientes en toda Colombia...",
  },
  "como-integrar-chatbots-en-mi-negocio": {
    title: "¿Cómo integrar chatbots en mi negocio?",
    image: "/banners/chatbots.jpg",
    content: "Los chatbots de Voia permiten escalar tu atención sin sacrificar calidad. Te ayudamos desde la estrategia hasta la implementación...",
  },
  // ... agrega más preguntas
};

const FaqDetail = () => {
  const { slug } = useParams();
  const data = faqData[slug];

  if (!data) return <p>Pregunta no encontrada</p>;

  return (
    <>
      <Navbar />

      <ParallaxBanner
        layers={[
          {
            image: data.image,
            speed: -20,
          },
        ]}
        style={{ height: "300px" }}
      >
        <div style={styles.bannerOverlay}>
          <h1 style={styles.title}>{data.title}</h1>
        </div>
      </ParallaxBanner>

      <section style={styles.content}>
        <div style={styles.container}>
          <p style={styles.text}>{data.content}</p>
        </div>
      </section>
    </>
  );
};

const styles = {
  bannerOverlay: {
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: "2.5rem",
    textAlign: "center",
  },
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
};

export default FaqDetail;
