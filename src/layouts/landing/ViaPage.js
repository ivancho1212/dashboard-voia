// src/layouts/landing/ViaPage.js
import React from "react";
import HeroSection from "./HeroSection";
import ViaSection from "./ViaSection";
import ClientsSection from "./ClientsSection";
import ContactSection from "./ContactSection";
import TestimonialsSection from "./TestimonialsSection";

const ViaPage = () => {
  return (
    <main style={{ background: "#000", color: "#fff" }}>
      {/* Hero con mensaje y fondo */}
      <HeroSection
        title="Conoce VIA (Voice Intelligent Artificial)"
        subtitle="VIA es tu asistente conversacional inteligente, diseñado para mejorar la atención al cliente mediante inteligencia artificial."
        backgroundImage="/Gemini_Generated_Image_b0upz2b0upz2b0up.jpg"
      />

      {/* Secciones */}
      <ViaSection />
      <section id="testimonials">
        <TestimonialsSection />
      </section>
      <section id="clients">
        <ClientsSection />
      </section>
      <section id="contact">
        <ContactSection />
      </section>
    </main>
  );
};

export default ViaPage;
