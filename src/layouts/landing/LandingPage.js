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
  // Add to public/index.html (before </body>)

// Or in a component (e.g. LandingPage)
useEffect(() => {
  try{ const allowed = 'http://localhost:3000'; if (allowed){ const allowedHost = (new URL(allowed)).host; if (window.location.host !== allowedHost) return; } } catch(e) {}
  if (document.getElementById('voia-widget-js')) return;
  const js = document.createElement('script'); js.id = 'voia-widget-js'; js.async = true; js.src = 'http://localhost:3000/widget.js'; js.setAttribute('data-user-id', '5'); js.setAttribute('data-bot-id', '4'); js.setAttribute('data-bot', '4'); js.setAttribute('data-api-base', 'http://localhost:3000'); js.setAttribute('data-theme', 'auto'); js.setAttribute('data-position', 'bottom-right'); js.setAttribute('data-language', 'es'); js.setAttribute('data-allowed-domain', 'http://localhost:3000'); js.setAttribute('data-client-secret', ''); document.body.appendChild(js);
}, []);

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