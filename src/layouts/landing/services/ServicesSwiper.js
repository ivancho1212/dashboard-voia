import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";

const services = [
  {
    id: "web",
    title: "Desarrollo Web",
    description: "Creamos sitios y aplicaciones web responsivas, modernas y optimizadas.",
    image: "/Gemini_Generated_Image_akpz0takpz0takpz.png",
  },
  {
    id: "mobile",
    title: "Desarrollo Móvil",
    description: "Aplicaciones nativas e híbridas para Android y iOS.",
    image: "/Gemini_Generated_Image_ruqzvqruqzvqruqz.png",
  },
  {
    id: "ai",
    title: "Soluciones con Inteligencia Artificial",
    description: "Automatización con modelos de lenguaje y visión computarizada.",
    image: "/Gemini_Generated_Image_573dgf573dgf573d.png",
  },
  {
    id: "chatbots",
    title: "Chatbots y Asistentes Virtuales",
    description: "Atiende a tus clientes 24/7 con bots inteligentes.",
    image: "/Gemini_Generated_Image_bb0s6ubb0s6ubb0s.png",
  },
  {
    id: "automation",
    title: "Automatización de Procesos",
    description: "Optimiza tareas repetitivas con flujos automatizados.",
    image: "/Gemini_Generated_Image_hzenwthzenwthzen.png",
  },
  {
    id: "support",
    title: "Soporte y Mantenimiento",
    description: "Mantenemos tus sistemas siempre funcionando.",
    image: "/Gemini_Generated_Image_xugnhsxugnhsxugn.png",
  },
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
      {/* Subtítulo arriba */}
      <p style={styles.subtitle}>Nuestros Servicios</p>
      {/* Título opcional */}
      <h3 style={styles.headline}>Soluciones que transforman tu negocio</h3>

      <Swiper
        modules={[Autoplay, EffectFade]}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        speed={1500}
        spaceBetween={40}
        slidesPerView={1}
        style={{ ...styles.swiper, paddingBottom: "3rem" }}
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

      <style>{`
        .swiper-wrapper {
          position: relative !important;
        }
        .swiper-slide {
          position: absolute !important;
          top: 0;
          left: 0;
          width: 100% !important;
          height: 400px;
          opacity: 0;
          transition-property: opacity;
          transition-timing-function: ease;
          transition-duration: 1500ms;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .swiper-slide-active {
          opacity: 1;
          position: relative !important;
          pointer-events: auto;
          z-index: 10;
        }
      `}</style>
    </section>
  );
};

const styles = {
  section: {
    backgroundColor: "#000",
    padding: "250px 20px",
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
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    gap: "3rem",
  },
  slide: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    boxSizing: "border-box",
    width: "30%",
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
