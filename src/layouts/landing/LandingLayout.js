// src/layouts/landing/LandingLayout.js

import React from "react";
import PropTypes from "prop-types"; // 1. Importa PropTypes
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import CookieConsent from "react-cookie-consent";

// Componente para el contenedor de contenido
const ConsentContentWrapper = ({ children }) => (
    <div
        style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 20px",
        }}
    >
        {children}
    </div>
);

// 2. Define la validación de propTypes para ConsentContentWrapper
ConsentContentWrapper.propTypes = {
    children: PropTypes.node.isRequired,
};

function LandingLayout() {
    return (
        <div>
            <Navbar isDarkBackground={true} />
            <Outlet />
            <Footer />
            <CookieConsent
                location="bottom"
                buttonText="Acepto"
                cookieName="myCookieConsent"
                style={{
                    background: "#2B373B",
                    fontSize: "14px",
                    width: "100%",
                    padding: "10px 10px",
                }}
                buttonStyle={{
                    color: "#fff",
                    background: "#00bfa5",
                    fontSize: "14px",
                    borderRadius: "4px",
                    padding: "10px 30px",
                }}
                expires={150}
                enableDeclineButton
                declineButtonText="Cancelar"
                declineButtonStyle={{
                    background: "transparent",
                    color: "#fff",
                    border: "1px solid #fff",
                    fontSize: "14px",
                    borderRadius: "4px",
                    padding: "10px 20px",
                }}
                flipButtons
            >
                <ConsentContentWrapper>
                    Este sitio web utiliza cookies para mejorar la experiencia del usuario.
                    Al usar nuestro sitio, aceptas todas las cookies de acuerdo con nuestra
                    <a href="/politica-de-privacidad" style={{ color: "#00bfa5", marginLeft: "5px" }}>
                        Política de Cookies.
                    </a>
                </ConsentContentWrapper>
            </CookieConsent>
        </div>
    );
}

export default LandingLayout;