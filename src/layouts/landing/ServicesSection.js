// src/layouts/landing/ServicesSection.js (Corregido)
import React, { useEffect } from "react";
// Ya no es necesario importar LazySection aquí
// import LazySection from "./LazySection";
import ServicesSwiper from "./services/ServicesSwiper";

const ServicesSection = () => {
  useEffect(() => {
  }, []);

  return (
    <section id="services">
      <ServicesSwiper />
    </section>
  );
};

export default ServicesSection;