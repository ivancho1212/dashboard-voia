import { useParams } from "react-router-dom";
import { services, serviceContent } from "./services";
import ContactSection from "../ContactSection";

const ServiceDetail = () => {
  const { slug } = useParams();
  const baseData = services.find((s) => s.slug === slug);
  const seoData = serviceContent[slug];

  if (!baseData)
    return (
      <h2 style={{ color: "#fff", textAlign: "center" }}>
        Servicio no encontrado
      </h2>
    );

  return (
    <article
      style={{
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        paddingTop: "120px",
        paddingBottom: "60px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 20px",
        }}
      >
        {/* Imagen superior */}
        <img
          src={baseData.image}
          alt={baseData.title}
          style={{
            width: "100%",
            borderRadius: "12px",
            marginBottom: "30px",
            objectFit: "cover",
          }}
        />

        {/* Título y descripción corta */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "15px" }}>
            {baseData.title}
          </h1>
          <p
            style={{
              fontSize: "1.2rem",
              opacity: 0.9,
              marginBottom: "20px",
              maxWidth: "700px",
              margin: "0 auto",
            }}
          >
            {baseData.description}
          </p>
        </div>

        {/* Contenido largo */}
        {seoData?.longDescription && (
          <div
            style={{
              fontSize: "1rem",
              lineHeight: "1.8",
              opacity: 0.9,
              marginBottom: "50px",
              textAlign: "center",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            {seoData.longDescription
              .split("\n")
              .filter((p) => p.trim() !== "")
              .map((p, idx) => (
                <p key={idx} style={{ marginBottom: "20px" }}>
                  {p}
                </p>
              ))}
          </div>
        )}
      </div>

      {/* Bloque VIA solución - ocupa todo el ancho */}
      {seoData?.viaSolution && (
        <section
          style={{
            marginTop: "80px",
            padding: "50px 20px",
            background: "#111",
            textAlign: "center",
            width: "100%",
          }}
        >
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "1.8rem",
                marginBottom: "20px",
                color: "#fff",
              }}
            >
              Cómo VIA puede ayudarte
            </h2>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: "1.6",
                opacity: 0.9,
                maxWidth: "750px",
                margin: "0 auto",
              }}
            >
              {seoData.viaSolution}
            </p>
          </div>
        </section>
      )}

      {/* Sección de contacto */}
      <div style={{ marginTop: "60px" }}>
        <section id="contact">
          <ContactSection />
        </section>
      </div>
    </article>
  );
};

export default ServiceDetail;
