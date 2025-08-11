import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = ({ isDarkBackground = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null); // 👈 estado para hover

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
            {[
              { label: "Inicio", anchor: "home" },
              { label: "Servicios", anchor: "services" },
              { label: "Via", link: "/via" },
              { label: "Contacto", anchor: "contact" },
            ].map((item, index) => (
              <li key={index}>
                {item.link ? (
                  <Link
                    to={item.link}
                    style={{
                      ...styles.navItem,
                      color:
                        hoveredItem === index ? "#00bfa5" : textColor,
                    }}
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <button
                    onClick={() => handleNavigateToAnchor(item.anchor)}
                    style={{
                      ...styles.navItem,
                      ...styles.buttonReset,
                      color:
                        hoveredItem === index ? "#00bfa5" : textColor,
                    }}
                    onMouseEnter={() => setHoveredItem(index)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    {item.label}
                  </button>
                )}
              </li>
            ))}
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
    height: "50px",
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
    fontSize: "1.1rem",
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
};

Navbar.propTypes = {
  isDarkBackground: PropTypes.bool,
};

export default Navbar;
