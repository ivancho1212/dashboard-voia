import React from "react";

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <p style={styles.text}>
        © {new Date().getFullYear()} Voia | Desarrollado por Ivan Herrera.
      </p>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: "#1e3c72",
    color: "#fff",
    textAlign: "center",
    padding: "20px 0",
    marginTop: "40px",
  },
  text: {
    margin: 0,
    fontSize: "0.9rem",
  },
};

export default Footer;
