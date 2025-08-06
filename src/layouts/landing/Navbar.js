import React from "react";
import PropTypes from "prop-types";

const Navbar = ({ isDarkBackground = false }) => {
    const logoSrc = isDarkBackground ? "/via-negativo.png" : "/VIA.png";
    const textColor = isDarkBackground ? "#fff" : "#222";

    return (
        <header style={{ ...styles.header, backgroundColor: isDarkBackground ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.6)" }}>
            <div style={{ ...styles.container, color: textColor }}>
                <div style={styles.logoContainer}>
                    <img src={logoSrc} alt="Logo Voia" style={styles.logoImg} />
                </div>

                <nav>
                    <ul style={styles.navList}>
                        <li><a href="#home" style={{ ...styles.navItem, color: textColor }}>Inicio</a></li>
                        <li><a href="#services" style={{ ...styles.navItem, color: textColor }}>Servicios</a></li>
                        <li><a href="#via" style={{ ...styles.navItem, color: textColor }}>Via</a></li>
                        <li><a href="#contact" style={{ ...styles.navItem, color: textColor }}>Contacto</a></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

const styles = {
    header: {
        position: "fixed",
        top: 0,
        width: "100%",
        zIndex: 1000,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)"
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "1rem 2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: '"Varela Round", sans-serif',
    },
    logoContainer: {
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
    },
    logoImg: {
        height: "30px",
        width: "auto",
    },
    logoText: {
        fontSize: "1.5rem",
        fontFamily: '"Varela Round", sans-serif',
    },
    navList: {
        listStyle: "none",
        display: "flex",
        gap: "2rem",
        margin: 0,
        padding: 0,
    },
    navItem: {
        textDecoration: "none",
        fontWeight: "500",
        transition: "color 0.3s ease",
        fontFamily: '"Varela Round", sans-serif',
    },
};

export default Navbar;

Navbar.propTypes = {
    isDarkBackground: PropTypes.bool,
};