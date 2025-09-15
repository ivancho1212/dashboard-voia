// src/layouts/landing/HeroSection.js
import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { ParallaxBanner } from "react-scroll-parallax";

const HeroSection = ({ title, subtitle, backgroundImage }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    console.log("HeroSection montada / visible");

    // Adelantar un poco el video al montarse para evitar el frame negro inicial
    if (videoRef.current) {
      videoRef.current.currentTime = 1;
    }
  }, []);

  // ✅ Imagen o video de fondo
  const bgContent = backgroundImage ? (
    <img
      src={backgroundImage}
      alt="Background"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  ) : (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      poster="/poster-inicial.jpg"
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    >
      <source src="/Video_IA_Neuronal_Neón_Bucle.mp4" type="video/mp4" />
      Tu navegador no soporta el video.
    </video>
  );

  // ✅ Forzamos título en dos líneas
  const mainTitle =
    title || (
      <>
        Desarrollo web, apps móviles <br />
        e inteligencia artificial
      </>
    );

  const mainSubtitle =
    subtitle ||
    "Ofrecemos soluciones digitales personalizadas con desarrollo a la medida, integración de IA y automatización de procesos. Potencia tu empresa con tecnología escalable, segura y diseñada para destacar en el mercado digital actual.";

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/573178531533", "_blank");
  };

  return (
    <section id="hero-section" style={{ height: "100vh" }}>
      <ParallaxBanner
        layers={[
          { children: bgContent, speed: -2 },
          { children: <div style={styles.overlay} />, speed: 0 },
        ]}
        style={{ height: "100vh", position: "relative" }}
      >
        <div style={styles.content}>
          <h1 style={styles.title}>{mainTitle}</h1>
          <p style={styles.subtitle}>{mainSubtitle}</p>

          <button
            style={styles.button}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#00bfa5";
              e.target.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#fff";
            }}
            onClick={handleWhatsAppClick}
          >
            Contáctanos
          </button>
        </div>
      </ParallaxBanner>
    </section>
  );
};

HeroSection.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  backgroundImage: PropTypes.string,
};

const styles = {
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))",
    zIndex: 1,
  },
  content: {
    position: "relative",
    zIndex: 2,
    maxWidth: "900px",
    margin: "0 auto",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    padding: "0 20px",
    textAlign: "center",
  },
  title: {
    fontSize: "2.8rem",
    fontWeight: "bold",
    marginBottom: "1rem",
    lineHeight: "1.2",
  },
  subtitle: {
    fontSize: "1.2rem",
    lineHeight: "1.6",
    marginBottom: "2rem",
  },
  button: {
    backgroundColor: "transparent",
    color: "#fff",
    border: "2px solid #ccc",
    padding: "0.8rem 2rem",
    fontSize: "1.1rem",
    fontWeight: "bold",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};

export default HeroSection;
