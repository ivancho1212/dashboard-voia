// src/layouts/landing/ContactSection.js
import React, { useState } from "react";

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
    // Aquí podrías enviar a un backend, email, o usar EmailJS, Formspree, etc.
    alert("Mensaje enviado 🚀");
  };

  return (
    <section id="contacto" style={styles.section}>
      <div style={styles.container}>
        <h2 style={styles.title}>¿Tienes alguna dudá?</h2>
        <p style={styles.text}>
          Contáctanos para conocer cómo podemos ayudarte a automatizar y escalar tu atención al cliente.
        </p>
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

const styles = {
  section: {
    backgroundColor: "#0c0c0cff",
    color: "#fff",
    padding: "60px 20px",
    textAlign: "center",
  },
  container: {
    maxWidth: "700px",
    margin: "0 auto",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  text: {
    fontSize: "1.1rem",
    marginBottom: "2rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
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
