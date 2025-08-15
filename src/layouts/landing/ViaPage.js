// src/layouts/landing/ViaPage.js (Corregido)
import React from "react";
import LazySection from "./LazySection";
import HeroSection from "./HeroSection";
import ViaSection from "./ViaSection";
import ClientsSection from "./ClientsSection";
import ContactSection from "./ContactSection";
import TestimonialsSection from "./TestimonialsSection";

const ViaPage = () => {
  return (
    <main style={{ background: "#000", color: "#fff" }}>
      {/* El HeroSection se carga siempre, no necesita LazySection */}
      <HeroSection
        title="Conoce VIA (Voice Intelligent Artificial)"
        subtitle="VIA es tu asistente conversacional inteligente, diseñado para mejorar la atención al cliente mediante inteligencia artificial."
        backgroundImage="/fondo-via-banner.webp"
      />

      {/* Envuelve cada sección con LazySection */}
      <LazySection id="via-section">
        <ViaSection />
      </LazySection>
      <LazySection id="testimonials">
        <TestimonialsSection />
      </LazySection>
      <LazySection id="clients">
        <ClientsSection />
      </LazySection>
      <LazySection id="contact">
        <ContactSection />
      </LazySection>
    </main>
  );
};

export default ViaPage;