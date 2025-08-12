// src/layouts/landing/ViaPage.js
import React from "react";
import ViaSection from "./ViaSection";
import ClientsSection from "./ClientsSection";
import ContactSection from "./ContactSection";
import TestimonialsSection from "./TestimonialsSection";

const ViaPage = () => {
  return (
    <main style={{ background: "#000", color: "#fff" }}>
      {/* Encabezado de la página */}
      <section style={{
        textAlign: "center",
        padding: "100px 20px 60px",
        maxWidth: "900px",
        margin: "0 auto"
      }}>
        <h1 style={{ fontSize: "2.8rem", marginBottom: "20px", color: "#00bfa5" }}>
          Conoce VIA (Voice Intelligent Artificial)
        </h1>
        <p style={{ fontSize: "1.2rem", lineHeight: "1.6", opacity: 0.9 }}>
          VIA es tu asistente conversacional inteligente, diseñado para mejorar
          la atención al cliente mediante inteligencia artificial y voz.
        </p>
      </section>

      {/* Secciones independientes con sus estilos propios */}

      <ViaSection />
      <section id="testimonials">
        <TestimonialsSection />
      </section>
      <section id="clients">
        <ClientsSection />
      </section>
      {/* ID para scroll a "Contacto" */}
      <section id="contact">
        <ContactSection />
      </section>
    </main>
  );
};

export default ViaPage;
