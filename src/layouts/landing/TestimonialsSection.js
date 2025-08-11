// src/layouts/landing/TestimonialsSection.js
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";

import "swiper/css";

const testimonials = [
  {
    name: "Laura Martínez",
    role: "CEO de StartTech",
    comment:
      "El equipo de Voia superó nuestras expectativas. La implementación de IA mejoró nuestra eficiencia en un 40%.",
    image: "/person1.webp",
  },
  {
    name: "Carlos Gómez",
    role: "CTO de Innovatech",
    comment:
      "Profesionales, puntuales y con gran conocimiento técnico. Nuestra nueva plataforma es más rápida y segura.",
    image: "/person2.webp",
  },
  {
    name: "María Rodríguez",
    role: "Fundadora de EcoSolutions",
    comment:
      "Gracias a Voia, automatizamos procesos clave y reducimos costos operativos. ¡Recomendados al 100%!",
    image: "/person3.webp",
  },
  {
    name: "Javier Torres",
    role: "Director de Marketing en BrightMedia",
    comment:
      "El rediseño web que hicieron elevó la imagen de nuestra marca y aumentó la conversión de clientes.",
    image: "/person4.webp",
  },
  {
    name: "Ana Pérez",
    role: "Gerente de Operaciones en LogistiFast",
    comment:
      "Implementaron un sistema de automatización que nos ahorra horas de trabajo cada semana.",
    image: "/person5.webp",
  },
  {
    name: "Ricardo Fernández",
    role: "Cofundador de TechWave",
    comment:
      "La integración de IA en nuestros procesos ha sido un cambio radical en la productividad del equipo.",
    image: "/person6.webp",
  },
];

const TestimonialsSection = () => {
  return (
    <section style={styles.section}>
      <p style={styles.subtitle}>Lo que dicen nuestros clientes</p>
      <h3 style={styles.headline}>Testimonios</h3>

      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        slidesPerView={1}
        style={styles.swiper}
      >
        {testimonials.map((t, index) => (
          <SwiperSlide key={index}>
            <div style={styles.card}>
              <img src={t.image} alt={t.name} style={styles.image} />
              <p style={styles.comment}>&quot;{t.comment}&quot;</p>
              <h4 style={styles.name}>{t.name}</h4>
              <p style={styles.role}>{t.role}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

const styles = {
  section: {
    backgroundColor: "#111",
    padding: "100px 20px",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    color: "#00bfa5",
    fontWeight: "bold",
    fontSize: "1rem",
    textTransform: "uppercase",
    marginBottom: "0.5rem",
  },
  headline: {
    fontSize: "2rem",
    fontWeight: "700",
    marginBottom: "2rem",
  },
  swiper: {
    maxWidth: "700px",
    margin: "0 auto",
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    minHeight: "300px",
    justifyContent: "center",
  },
  image: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  comment: {
    fontSize: "1rem",
    fontStyle: "italic",
    lineHeight: "1.6",
    maxWidth: "90%",
  },
  name: {
    fontSize: "1.1rem",
    fontWeight: "bold",
    margin: 0,
  },
  role: {
    fontSize: "0.9rem",
    color: "#bbb",
  },
};

export default TestimonialsSection;
