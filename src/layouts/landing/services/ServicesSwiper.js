import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";

const services = [
  { id: "web", title: "Desarrollo Web", description: "Creamos sitios y aplicaciones web responsivas, modernas y optimizadas.", image: "/editorcode.webp" },
  { id: "mobile", title: "Desarrollo Móvil", description: "Aplicaciones nativas e híbridas para Android y iOS.", image: "/appscell.webp" },
  { id: "ai", title: "Soluciones con Inteligencia Artificial", description: "Automatización con modelos de lenguaje y visión computarizada.", image: "/chipAI.webp" },
  { id: "chatbots", title: "Chatbots y Asistentes Virtuales", description: "Atiende a tus clientes 24/7 con bots inteligentes.", image: "/chatAI.webp" },
  { id: "automation", title: "Automatización de Procesos", description: "Optimiza tareas repetitivas con flujos automatizados.", image: "/automatizacion.webp" },
  { id: "support", title: "Soporte y Mantenimiento", description: "Mantenemos tus sistemas siempre funcionando.", image: "/mantenimiento.webp" },
];

const chunkServices = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const ServicesSwiper = () => {
  const groupedServices = chunkServices(services, 3);

  return (
    <section style={styles.section}>
      <p style={styles.subtitle}>Nuestros Servicios</p>
      <h3 style={styles.headline}>Soluciones que transforman tu negocio</h3>

      <Swiper
        modules={[Autoplay, EffectFade]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={1000}
        slidesPerView={1}
        loop={true} // 🔹 Esto habilita la paginación infinita
        style={styles.swiper}
      >
        {groupedServices.map((group, index) => (
          <SwiperSlide key={index}>
            <div style={styles.groupSlide}>
              {group.map((service) => (
                <div key={service.id} style={styles.slide}>
                  <img src={service.image} alt={service.title} style={styles.image} />
                  <h3 style={styles.title}>{service.title}</h3>
                  <p style={styles.description}>{service.description}</p>
                </div>
              ))}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

const styles = {
  section: {
    backgroundColor: "#000",
    padding: "150px 20px",
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
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  groupSlide: {
    display: "flex",
    justifyContent: "center",
    gap: "3rem",
    padding: "1rem",
  },
  slide: {
    flex: "0 0 30%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  image: {
    width: "100%",
    borderRadius: "12px",
  },
  title: {
    fontSize: "1.2rem",
    margin: 0,
  },
  description: {
    fontSize: "0.95rem",
    maxWidth: "90%",
  },
};

export default ServicesSwiper;
