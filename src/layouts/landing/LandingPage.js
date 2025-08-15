// src/layouts/landing/LandingPage.js
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LazySection from "./LazySection"; // Asegúrate de importar LazySection
import HeroSection from "./HeroSection";
import ServicesSection from "./ServicesSection";
import AboutViaSection from "./AboutViaSection";
import ClientsSection from "./ClientsSection";
import ContactSection from "./ContactSection";
import TestimonialsSection from "./TestimonialsSection";

const LandingPage = () => {
  const location = useLocation();

  // Scroll al anchor si viene de Navbar
  useEffect(() => {
    if (location.state?.scrollTo) {
      const scrollTimer = setTimeout(() => {
        const el = document.getElementById(location.state.scrollTo);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [location.state]);

  return (
    <div style={{ backgroundColor: "#000" }}>
      {/* Envuelve cada sección con LazySection aquí */}
      <LazySection id="hero">
        <HeroSection />
      </LazySection>
      <LazySection id="about">
        <AboutViaSection />
      </LazySection>
      <LazySection id="services">
        <ServicesSection />
      </LazySection>
      <LazySection id="clients">
        <ClientsSection />
      </LazySection>
      <LazySection id="testimonials">
        <TestimonialsSection />
      </LazySection>
      <LazySection id="contact">
        <ContactSection />
      </LazySection>
    </div>
  );
};

export default LandingPage;