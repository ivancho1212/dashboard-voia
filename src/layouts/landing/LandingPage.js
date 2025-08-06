// src/layouts/landing/LandingPage.js
import React from "react";
import HeroSection from "./HeroSection";
import ServicesSection from "./ServicesSection";
import AboutVoiaSection from "./AboutVoiaSection";
import VoiaSection from "./VoiaSection";
import UseCasesSection from "./UseCasesSection";
import ContactSection from "./ContactSection";

const LandingPage = () => {
  return (
    <div>
      <HeroSection />
      {<ServicesSection />}
      {<AboutVoiaSection />}
      {<VoiaSection />}
      {/* <UseCasesSection /> */}
      {<ContactSection />}
    </div>
  );
};



export default LandingPage;
