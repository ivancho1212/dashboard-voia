import React from "react";
import HeroSection from "./HeroSection";
import ServicesSection from "./ServicesSection";
import AboutVoiaSection from "./AboutVoiaSection";
import VoiaSection from "./VoiaSection";
import ClientsSection from "./ClientsSection";
import ContactSection from "./ContactSection";
import TestimonialsSection from "./TestimonialsSection";

const LandingPage = () => {
  return (
    <div>
      {/* ID para scroll a "Inicio" */}
      <section id="home">
        <HeroSection />
      </section>
      <section id="about">
        <AboutVoiaSection />
      </section>
      {/* ID para scroll a "Servicios" */}
      <section id="services">
        <ServicesSection />
      </section>
      <section id="clients">
        <ClientsSection />
      </section>
      <section id="testimonials">
        <TestimonialsSection />
      </section>
      {/* ID para scroll a "Contacto" */}
      <section id="contact">
        <ContactSection />
      </section>
    </div>
  );
};

export default LandingPage;
