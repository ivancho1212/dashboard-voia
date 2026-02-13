// src/layouts/landing/LandingPage.js
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import LazySection from "./LazySection";
import HeroSection from "./HeroSection";
import ServicesSection from "./ServicesSection";
import AboutViaSection from "./AboutViaSection";
import ClientsSection from "./ClientsSection";
import ContactSection from "./ContactSection";
import TestimonialsSection from "./TestimonialsSection";

const LandingPage = () => {
  const location = useLocation();

  // Cargar el widget tras un breve retraso para evitar OOM al inicializar
  // (main app y widget a la vez consumen mucha memoria)
  useEffect(() => {
    if (document.getElementById("voia-widget-js")) return;
    const loadWidget = () => {
      if (document.getElementById("voia-widget-js")) return;
      const origin = window.location.origin;
      const js = document.createElement("script");
      js.id = "voia-widget-js";
      js.async = true;
      js.src = `${origin}/widget.js`;
      js.setAttribute("data-user-id", "anon");
      js.setAttribute("data-bot-id", "4");
      js.setAttribute("data-bot", "4");
      js.setAttribute("data-api-base", origin);
      js.setAttribute("data-theme", "auto");
      js.setAttribute("data-position", "bottom-right");
      js.setAttribute("data-language", "es");
      js.setAttribute("data-allowed-domain", origin);
      js.setAttribute("data-client-secret", "");
      document.body.appendChild(js);
    };
    const useIdle = typeof requestIdleCallback !== "undefined";
    const id = useIdle
      ? requestIdleCallback(loadWidget, { timeout: 2000 })
      : setTimeout(loadWidget, 1500);
    return () => {
      if (useIdle && typeof cancelIdleCallback !== "undefined") cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

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