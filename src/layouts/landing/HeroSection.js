// src/layouts/landing/HeroSection.js
import React from "react";

const HeroSection = () => {
    return (
        <section id="home" style={styles.hero}>
            <div style={styles.overlay}>
                <div style={styles.content}>
                    <h1 style={styles.title}>
                        Desarrollo web, apps móviles e inteligencia artificial para hacer crecer tu negocio
                    </h1>
                    <p style={styles.subtitle}>
                        Ofrecemos soluciones digitales personalizadas con desarrollo a la medida, integración de IA y automatización de procesos. Potencia tu empresa con tecnología escalable, segura y diseñada para destacar en el mercado digital actual.
                    </p>
                </div>
            </div>
        </section>

    );
};

const styles = {
    hero: {
        backgroundImage: `url("/Gemini_Generated_Image_b0upz2b0upz2b0up.jpg")`,
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
    overlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)", // oscurecer para mejor lectura
        width: "100%",
        height: "100%",
        padding: "100px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    content: {
        maxWidth: "900px",
        margin: "0 auto",
        textAlign: "center",
        color: "#fff",
    },
    title: {
        fontSize: "2.5rem",
        fontWeight: "bold",
        marginBottom: "1rem",
    },
    subtitle: {
        fontSize: "1.2rem",
        lineHeight: "1.6",
    },
};

export default HeroSection;
