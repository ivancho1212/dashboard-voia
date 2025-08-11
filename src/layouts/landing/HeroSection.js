import React from "react";
import PropTypes from "prop-types";
import { ParallaxBanner } from "react-scroll-parallax";

const HeroSection = ({ title, subtitle, backgroundImage }) => {
  const bgImage = backgroundImage || "/Gemini_Generated_Image_4fzbre4fzbre4fzb.jpg";
  const mainTitle = title || "Desarrollo web, apps móviles e inteligencia artificial para hacer crecer tu negocio";
  const mainSubtitle = subtitle || "Ofrecemos soluciones digitales personalizadas con desarrollo a la medida, integración de IA y automatización de procesos. Potencia tu empresa con tecnología escalable, segura y diseñada para destacar en el mercado digital actual.";

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/573178531533", "_blank");
  };

  return (
    <ParallaxBanner
      layers={[
        {
          image: bgImage,
          speed: -35,
        },
        {
          children: <div style={styles.overlay} />,
          speed: 0,
        },
      ]}
      style={{ minHeight: "60vh", position: "relative" }}
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
  );
};

const styles = {
  overlay: {
    position: "absolute",
    top: 0, right: 0, bottom: 0, left: 0,
    background: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6))",
    zIndex: 1,
  },
  content: {
    position: "relative",
    zIndex: 2,
    maxWidth: "900px",
    margin: "0 auto",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    padding: "0 20px",
    textAlign: "center",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: "bold",
    marginBottom: "1rem",
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
    borderRadius: "50px",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
};

HeroSection.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  backgroundImage: PropTypes.string,
};

export default HeroSection;
