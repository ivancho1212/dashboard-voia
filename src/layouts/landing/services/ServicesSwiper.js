import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

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

const ServicesSwiper = () => {
  return (
    <section style={styles.section}>
      <Swiper
        modules={[Pagination, Autoplay]}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000 }}
        spaceBetween={30}
        slidesPerView={1}
        style={{ ...styles.swiper, paddingBottom: "3rem" }}
      >
        {services.map((service) => (
          <SwiperSlide key={service.id}>
            <div style={styles.slide}>
              <img src={service.image} alt={service.title} style={styles.image} />
              <h3 style={styles.title}>{service.title}</h3>
              <p style={styles.description}>{service.description}</p>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Estilos para los bullets de paginación */}
      <style>
        {`
          .swiper-pagination {
            margin-top: 2rem;
          }

          .swiper-pagination-bullet {
            background-color: #ccc;
            opacity: 1;
          }

          .swiper-pagination-bullet-active {
            background-color: #007bff;
          }
        `}
      </style>
    </section>
  );
};

const styles = {
  section: {
    backgroundColor: "#000",
    padding: "3rem 1rem",
    color: "#fff",
    textAlign: "center",
  },
  swiper: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
  },
  slide: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
  },
  image: {
    width: "100%",
    maxWidth: "300px",
    borderRadius: "12px",
  },
  title: {
    fontSize: "1.5rem",
    margin: 0,
  },
  description: {
    fontSize: "1rem",
    maxWidth: "90%",
  },
};

export default ServicesSwiper;
