// src/layouts/landing/HeroSection.js
import React from "react";

const HeroSection = () => {
    const handleWhatsAppClick = () => {
        window.open(
            "https://wa.me/573178531533",
            "_blank"
        );
    };

    return (
        <section id="home" style={styles.hero}>
            <div style={styles.content}>
                <h1 style={styles.title}>
                    Desarrollo web, apps móviles e inteligencia artificial para hacer crecer tu negocio
                </h1>
                <p style={styles.subtitle}>
                    Ofrecemos soluciones digitales personalizadas con desarrollo a la medida, integración de IA y automatización de procesos. Potencia tu empresa con tecnología escalable, segura y diseñada para destacar en el mercado digital actual.
                </p>

                <button
                    style={styles.button}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = "#00bfa5";
                        e.target.style.color = "#fff";
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = "transparent";
                        e.target.style.color = "#00bfa5";
                    }}
                    onClick={handleWhatsAppClick}
                >
                    Contáctanos
                </button>
            </div>
        </section>
    );
};

const styles = {
    hero: {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("/Gemini_Generated_Image_4fzbre4fzbre4fzb.jpg")`,
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"Varela Round", sans-serif',
    },
    content: {
        maxWidth: "900px",
        margin: "0 auto",
        textAlign: "center",
        color: "#fff",
        padding: "100px clamp(1rem, 5vw, 2rem)",
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
        color: "#00bfa5",
        border: "2px solid #ccc",
        padding: "0.8rem 2rem",
        fontSize: "1.1rem",
        fontWeight: "bold",
        borderRadius: "50px",
        cursor: "pointer",
        transition: "all 0.3s ease",
    },
};

export default HeroSection;
