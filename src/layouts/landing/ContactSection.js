// src/layouts/landing/ContactSection.js
import React, { useState } from "react";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

const ContactSection = () => {
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    mensaje: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Mensaje enviado 🚀");
  };

  return (
    <section id="contacto" style={styles.section}>
      <div style={styles.wrapper}>
        {/* INFO DE CONTACTO */}
        <div style={styles.infoBox}>
          <h5 style={styles.title}>¿Tienes alguna duda?</h5>
          <p style={styles.text}>
            Contáctanos para conocer cómo podemos ayudarte a automatizar y escalar tu atención al cliente.
          </p>
          <div style={styles.contactDetails}>
            <div style={styles.contactItem}>
              <FaPhoneAlt style={styles.icon} />
              <span>+57 300 123 4567</span>
            </div>
            <div style={styles.contactItem}>
              <FaEnvelope style={styles.icon} />
              <span>contacto@voia.com</span>
            </div>
            <div style={styles.contactItem}>
              <FaMapMarkerAlt style={styles.icon} />
              <span>Calle 123 #45-67, Bogotá, Colombia</span>
            </div>
          </div>
        </div>

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="text"
            name="nombre"
            placeholder="Tu nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            type="email"
            name="correo"
            placeholder="Tu correo electrónico"
            value={formData.correo}
            onChange={handleChange}
            required
            style={styles.input}
          />
          <input
            type="tel"
            name="telefono"
            placeholder="Tu teléfono"
            value={formData.telefono}
            onChange={handleChange}
            style={styles.input}
          />
          <textarea
            name="mensaje"
            placeholder="¿En qué podemos ayudarte?"
            value={formData.mensaje}
            onChange={handleChange}
            rows={4}
            required
            style={styles.textarea}
          />
          <button type="submit" style={styles.button}>Enviar</button>
        </form>
      </div>
    </section>
  );
};

// 🎨 ESTILOS
const styles = {
  section: {
    backgroundColor: "#0e0e0e",
    color: "#fff",
    padding: "60px 20px",
  },
  wrapper: {
    display: "flex",
    flexDirection: "row",
    gap: "40px",
    justifyContent: "center",
    alignItems: "flex-start",
    flexWrap: "wrap",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  infoBox: {
    flex: "1 1 300px",
    minWidth: "280px",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.1rem",
    marginBottom: "1.5rem",
    textAlign: "justify",
  },
  contactDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  contactItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "1rem",
  },
  icon: {
    fontSize: "1.2rem",
    color: "#00bfa5",
  },
  form: {
    flex: "1 1 300px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    minWidth: "280px",
  },
  input: {
    padding: "12px",
    borderRadius: "6px",
    border: "none",
    fontSize: "1rem",
  },
  textarea: {
    padding: "12px",
    borderRadius: "6px",
    border: "none",
    fontSize: "1rem",
    resize: "vertical",
  },
  button: {
    padding: "12px",
    backgroundColor: "#00bfa5",
    color: "#fff",
    fontSize: "1rem",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default ContactSection;
