import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { services } from "../landing/services/services"; // importa tu array de servicios

const Navbar = ({ isDarkBackground = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const logoSrc = isDarkBackground ? "/via-negativo.png" : "/VIA.png";
  const textColor = isDarkBackground ? "#fff" : "#222";

  const handleResize = () => {
    setIsMobile(window.innerWidth < 768);
    if (window.innerWidth >= 768) {
      setMenuOpen(false);
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
    if (isMobile) setMenuOpen(false);
  };

  return (
    <header
      style={{
        ...styles.header,
        backgroundColor: isDarkBackground
          ? "rgba(0, 0, 0, 0.4)"
          : "rgba(255, 255, 255, 0.6)",
      }}
    >
      <div style={{ ...styles.container, color: textColor }}>
        <div style={styles.logoContainer}>
          <Link to="/">
            <img src={logoSrc} alt="Logo Voia" style={styles.logoImg} />
          </Link>
        </div>

        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} style={styles.hamburger}>
            ☰
          </button>
        )}

        <nav style={{ display: isMobile ? (menuOpen ? "block" : "none") : "block" }}>
          <ul style={{ ...styles.navList, ...(isMobile ? styles.mobileNavList : {}) }}>
            {/* Inicio */}
            <li>
              <button
                onClick={() => handleNavigateToAnchor("home")}
                style={{
                  ...styles.navItem,
                  ...styles.buttonReset,
                  color: hoveredItem === "home" ? "#00bfa5" : textColor,
                }}
                onMouseEnter={() => setHoveredItem("home")}
                onMouseLeave={() => setHoveredItem(null)}
              >
                Inicio
              </button>
            </li>

            {/* Servicios con dropdown */}
            <li
              style={{ position: "relative" }}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button
                onClick={() => handleNavigateToAnchor("services")}
                style={{
                  ...styles.navItem,
                  ...styles.buttonReset,
                  color: hoveredItem === "services" ? "#00bfa5" : textColor,
                }}
                onMouseEnter={() => setHoveredItem("services")}
                onMouseLeave={() => setHoveredItem(null)}
              >
                Servicios
              </button>


              {/* Menú desplegable */}
              {dropdownOpen && !isMobile && (
                <ul style={styles.dropdownMenu}>
                  {services.map((srv) => (
                    <li key={srv.slug}>
                      <Link
                        to={`/servicio/${srv.slug}`}
                        style={styles.dropdownItem}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = "rgba(0, 191, 166, 0.56)")}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
                        onClick={() => setDropdownOpen(false)}
                      >
                        {srv.title}
                      </Link>

                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* VIA */}
            <li>
              <Link
                to="/via"
                style={{
                  ...styles.navItem,
                  color: hoveredItem === "via" ? "#00bfa5" : textColor,
                }}
                onMouseEnter={() => setHoveredItem("via")}
                onMouseLeave={() => setHoveredItem(null)}
              >
                VIA (Próximamente)
              </Link>
            </li>

            {/* Contacto */}
            <li>
              <button
                onClick={() => handleNavigateToAnchor("contact")}
                style={{
                  ...styles.navItem,
                  ...styles.buttonReset,
                  color: hoveredItem === "contact" ? "#00bfa5" : textColor,
                }}
                onMouseEnter={() => setHoveredItem("contact")}
                onMouseLeave={() => setHoveredItem(null)}
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
    padding: "1rem clamp(1rem, 5vw, 2rem)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: '"Varela Round", sans-serif',
    boxSizing: "border-box",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  logoImg: {
    height: "40px",
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
    fontSize: "0.95rem",
    cursor: "pointer",
  },
  buttonReset: {
    background: "none",
    border: "none",
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
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    backgroundColor: "#111",
    borderRadius: "8px", // 🔹 suavizado
    listStyle: "none",
    padding: "10px 0",
    margin: 0,
    minWidth: "200px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.3)",
  },

  dropdownItem: {
    display: "block",
    padding: "8px 16px",
    fontSize: "0.85rem", // 🔹 más pequeño aún
    color: "#fff",
    textDecoration: "none",
    transition: "background 0.3s, border-radius 0.3s",
    borderRadius: "6px", // 🔹 bordes suaves para cada item
  },

  dropdownItemHover: {
    backgroundColor: "#00bfa5",
    color: "#000",
  },
};

Navbar.propTypes = {
  isDarkBackground: PropTypes.bool,
};

export default Navbar;
