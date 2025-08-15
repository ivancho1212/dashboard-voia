// src/layouts/landing/Footer.js

import React, { useEffect } from "react";
import { Link } from "react-router-dom";

const faqLinks = [
  "¿Dónde hacer páginas web en Colombia?",
  "¿Cuánto vale el desarrollo de una página web en Colombia?",
  "¿Dónde desarrollar mi página web?",
  "¿Cómo automatizar la atención al cliente?",
  "¿Qué beneficios tiene usar IA en atención?",
  "¿Cuál es la mejor plataforma para crear páginas web?",
  "¿Cómo integrar IA en tu sitio web?",
  "¿Cómo puedo integrar IA en una aplicación web?",
  "¿Dónde es mejor crear mi página web?",
  "¿Dónde puedo crear mi propia página web?",
  "¿Cómo implementar IA en mi negocio?",
  "¿Puedo agregar un chatbot de IA a mi sitio web?",
  "¿Cuánto cuesta crear una app con IA?",
  "¿Puedo publicar contenido de IA en mi sitio web?",
  "¿Cómo integrar un agente de IA a un sitio web?",
  "¿Cuáles son los 10 tipos de IA?",
  "¿Cómo puedo incorporar la IA a mi trabajo?",
  "¿Puedo construir un negocio con IA?",
  "¿Cuánto cuesta agregar IA a una aplicación?",
  "¿Puedo utilizar IA para diseñar mi sitio web?",
  "¿Puedo agregar chat gpt a mi sitio web?",
  "¿Dónde es recomendable crear una página web?",
  "¿Cuáles son las mejores agencias de diseño en Colombia?",
  "¿Cuánto cuesta el desarrollo de un sitio web?",
  "¿Cuánto gana un creador de páginas web en Colombia?",
];

const columns = Array.from({ length: 5 }, (_, i) =>
  faqLinks.slice(i * 5, i * 5 + 5)
);

const slugify = (text) =>
  text.toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s+/g, "-");

const Footer = () => {
  useEffect(() => {
    console.log("Footer montado");
  }, []);

  return (
    <footer id="footer" style={styles.footer}>
      <div style={styles.columnsContainer}>
        {columns.map((col, idx) => (
          <div key={idx} style={styles.column}>
            {col.map((question, i) => (
              <Link
                key={i}
                to={`/pregunta/${slugify(question)}`}
                title={question}
                style={styles.link}
              >
                {question}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <p style={styles.text}>
        © {new Date().getFullYear()} Via | Desarrollado por Via Company.
        
        <Link to="/politica-de-privacidad" style={styles.footerLink}>
          Política de Privacidad
        </Link>
      </p>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: "#000",
    color: "#fff",
    padding: "60px 20px 30px 20px",
  },
  columnsContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    maxWidth: "1200px",
    margin: "0 auto 30px auto",
    rowGap: "20px",
  },
  column: {
    flex: "1 1 20%",
    minWidth: "200px",
    padding: "0 20px",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    display: "block",
    marginBottom: "12px",
    fontSize: "0.8rem",
    lineHeight: "1.6",
    textAlign: "left",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  text: {
    textAlign: "center",
    fontSize: "0.7rem",
    marginTop: "10px",
    color: "#aaa",
  },
  footerLink: { // ✅ Estilos para el nuevo enlace
    color: "#00bfa5",
    textDecoration: "none",
    marginLeft: "10px",
  },
};

export default Footer;