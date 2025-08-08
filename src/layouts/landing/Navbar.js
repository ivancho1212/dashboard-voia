import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = ({ isDarkBackground = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);

  const logoSrc = isDarkBackground ? "/via-negativo.png" : "/VIA.png";
  const textColor = isDarkBackground ? "#fff" : "#222";

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
    if (window.innerWidth >= 768) {
      setMenuOpen(false); // Cierra el menú si ya no está en modo móvil
    }
  };

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleNavigateToAnchor = (anchor) => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } else {
      const el = document.getElementById(anchor);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }

    if (isMobile) setMenuOpen(false); // Cierra menú después de clic en móvil
  };

  return (
    <header
      style={{
        ...styles.header,
        backgroundColor: isDarkBackground ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.6)",
      }}
    >
      <div style={{ ...styles.container, color: textColor }}>
        <div style={styles.logoContainer}>
          <img src={logoSrc} alt="Logo Voia" style={styles.logoImg} />
        </div>

        {/* Botón hamburguesa para móviles */}
        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={styles.hamburger}>
            ☰
          </button>
        )}

        {/* Menú */}
        <nav style={{ display: isMobile ? (menuOpen ? "block" : "none") : "block" }}>
          <ul style={{ ...styles.navList, ...(isMobile ? styles.mobileNavList : {}) }}>
            <li>
              <button
                onClick={() => handleNavigateToAnchor("home")}
                style={{ ...styles.navItem, color: textColor, ...styles.buttonReset }}
              >
                Inicio
              </button>
            </li>
            <li>
              <button
                onClick={() => handleNavigateToAnchor("services")}
                style={{ ...styles.navItem, color: textColor, ...styles.buttonReset }}
              >
                Servicios
              </button>
            </li>
            <li>
              <Link to="/via" style={{ ...styles.navItem, color: textColor }}>
                Via
              </Link>
            </li>
            <li>
              <button
                onClick={() => handleNavigateToAnchor("contact")}
                style={{ ...styles.navItem, color: textColor, ...styles.buttonReset }}
              >
                Contacto
              </button>
            </li>
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
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
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
  navList: {
    listStyle: "none",
    display: "flex",
    gap: "2rem",
    margin: 0,
    padding: 0,
  },
  mobileNavList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    marginTop: "1rem",
  },
  navItem: {
    textDecoration: "none",
    fontWeight: "500",
    transition: "color 0.3s ease",
    fontFamily: '"Varela Round", sans-serif',
  },
  buttonReset: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
    font: "inherit",
  },
  hamburger: {
    fontSize: "24px",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "inherit",
    padding: "0 0.5rem",
  },
};

Navbar.propTypes = {
  isDarkBackground: PropTypes.bool,
};

export default Navbar;
