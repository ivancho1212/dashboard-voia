import React from "react";
import { Link } from "react-router-dom";

const faqLinks = [
  "¿Dónde hacer páginas web en Colombia?",
  "¿Cuánto cuesta una página web en Colombia?",
  "¿Qué es un chatbot con inteligencia artificial?",
  "¿Cómo automatizar la atención al cliente?",
  "¿Qué beneficios tiene usar IA en atención?",
  "¿Qué es Voia y qué servicios ofrece?",
  "¿Cómo mejorar la experiencia del cliente?",
  "¿Voia diseña tiendas virtuales?",
  "¿Puedo integrar WhatsApp con Voia?",
  "¿Qué lenguaje usa Voia en su desarrollo?",
  "¿Voia ofrece soporte postventa?",
  "¿Qué industrias pueden usar Voia?",
  "¿Qué tan segura es la plataforma de Voia?",
  "¿Voia ofrece demos gratuitas?",
  "¿Voia tiene integración con redes sociales?",
  "¿Qué diferencia a Voia de otros bots?",
  "¿Voia permite personalizar el diseño?",
  "¿Cómo empezar a usar Voia?",
  "¿Voia funciona en dispositivos móviles?",
  "¿Qué medios de pago acepta Voia?",
  "¿Voia tiene API pública?",
  "¿Qué clientes han trabajado con Voia?",
  "¿Dónde están ubicados los servidores?",
  "¿Voia trabaja con pequeñas empresas?",
  "¿Cómo contactar con el equipo de Voia?",
];

// Divide preguntas en 5 columnas
const columns = Array.from({ length: 5 }, (_, i) =>
  faqLinks.slice(i * 5, i * 5 + 5)
);

// Convierte texto en slug amigable para URL
const slugify = (text) =>
  text.toLowerCase().replace(/[^\w\s]/gi, "").replace(/\s+/g, "-");

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.columnsContainer}>
        {columns.map((col, idx) => (
          <div key={idx} style={styles.column}>
            {col.map((question, i) => (
              <Link
                key={i}
                to={`/pregunta/${slugify(question)}`}
                title={question} // 👈 Tooltip aquí
                style={styles.link}
              >
                {question}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <p style={styles.text}>
        © {new Date().getFullYear()} Voia | Desarrollado por Ivan Herrera.
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
};

export default Footer;
