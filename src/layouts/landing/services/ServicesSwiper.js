// dashboard-voia/src/layouts/landing/services/ServicesSwiper.js
import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";

import "swiper/css";
import "swiper/css/effect-fade";

import { services } from "./services"; // ✅ ahora se importa desde services.js

// Función para agrupar servicios en bloques de 3
const chunkServices = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const ServicesSwiper = () => {
  const groupedServices = chunkServices(services, 3);
  const linkStyle = { textDecoration: "none", color: "inherit", display: "block", width: "100%" };

  return (
    <section style={styles.section}>
      <p style={styles.subtitle}>Nuestros Servicios</p>
      <h3 style={styles.headline}>Soluciones que transforman tu negocio</h3>

      {/* Swiper para versión móvil */}
      <div className="mobile-view">
        <Swiper
          modules={[Autoplay]}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          speed={600}
          slidesPerView={1}
          loop={true}
          style={styles.swiper}
        >
          {services.map((service) => (
            <SwiperSlide key={service.slug}>
              <Link to={`/servicio/${service.slug}`} style={linkStyle}>
                <div style={styles.slide}>
                  <img src={service.image} alt={service.title} style={styles.image} />
                  <h3 style={styles.title}>{service.title}</h3>
                  <p style={styles.description}>{service.description}</p>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Swiper para versión escritorio */}
      <div className="desktop-view">
        <Swiper
          modules={[Autoplay, EffectFade]}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={1000}
          slidesPerView={1}
          loop={true}
          style={styles.swiper}
        >
          {groupedServices.map((group, index) => (
            <SwiperSlide key={index}>
              <div style={styles.groupSlide}>
                {group.map((service) => (
                  <Link key={service.slug} to={`/servicio/${service.slug}`} style={linkStyle}>
                    <div style={styles.slide}>
                      <img src={service.image} alt={service.title} style={styles.image} />
                      <h3 style={styles.title}>{service.title}</h3>
                      <p style={styles.description}>{service.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .mobile-view { display: none; }
        .desktop-view { display: block; }
        
        @media (max-width: 767px) {
          .mobile-view { display: block; }
          .desktop-view { display: none; }
        }
      `}</style>
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
    cursor: "pointer",
  },
  image: {
    width: "100%",
    borderRadius: "12px",
    objectFit: "cover",
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
