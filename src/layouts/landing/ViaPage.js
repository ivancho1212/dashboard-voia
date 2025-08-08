// src/layouts/landing/ViaPage.js
import React from "react";
import VoiaSection from "./VoiaSection"; // opcional, si quieres reutilizar
import AboutVoiaSection from "./AboutVoiaSection";

const ViaPage = () => {
  return (
    <main style={{ padding: "2rem", marginTop: "80px" }}>
      <h1>Conoce VIA (Voice Intelligent Artificial)</h1>
      <p>
        VIA es tu asistente conversacional inteligente, diseñado para mejorar
        la atención al cliente mediante inteligencia artificial y voz.
      </p>

      
        {/* Opcional: puedes anclar más cosas si quieres */}
        <AboutVoiaSection />
      <VoiaSection />
      {/* <UseCasesSection /> */}
    </main>
  );
};

export default ViaPage;
