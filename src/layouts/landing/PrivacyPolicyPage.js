import React from "react";
import Navbar from "./Navbar"; // ✅ La ruta correcta
import Footer from "./Footer"; // ✅ La ruta correcta

const styles = {
    pageContainer: {
        padding: "80px 20px",
        backgroundColor: "#111",
        color: "#fff",
        minHeight: "80vh",
    },
    contentContainer: {
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: "1.6",
    },
    heading: {
        color: "#00bfa5",
        borderBottom: "1px solid #333",
        paddingBottom: "10px",
        marginBottom: "20px",
    },
    subHeading: {
        color: "#fff",
        marginTop: "40px",
    },
    paragraph: {
        marginBottom: "20px",
    },
};

function PrivacyPolicyPage() {
    return (
        <>
            <Navbar isDarkBackground={true} />
            <main style={styles.pageContainer}>
                <div style={styles.contentContainer}>
                    <h1 style={styles.heading}>Política de Privacidad y Cookies</h1>

                    <p style={styles.paragraph}>
                        En Via, nos comprometemos a proteger tu privacidad. Esta política
                        de privacidad explica cómo recopilamos, usamos y protegemos la
                        información que nos proporcionas a través de nuestro sitio web.
                    </p>

                    <h2 style={styles.subHeading}>1. Información que Recopilamos</h2>
                    <p style={styles.paragraph}>
                        Recopilamos información que nos proporcionas directamente, como
                        tu nombre, dirección de correo electrónico y número de teléfono,
                        cuando te pones en contacto con nosotros a través de nuestro
                        formulario de contacto.
                    </p>

                    <h2 style={styles.subHeading}>2. Uso de la Información</h2>
                    <p style={styles.paragraph}>
                        Utilizamos la información para responder a tus consultas,
                        procesar tus solicitudes y mejorar nuestros servicios. No
                        compartimos tu información personal con terceros sin tu
                        consentimiento explícito.
                    </p>

                    <h2 style={styles.subHeading}>3. Cookies</h2>
                    <p style={styles.paragraph}>
                        Nuestro sitio web utiliza cookies para mejorar la experiencia
                        del usuario. Las cookies son pequeños archivos de texto
                        almacenados en tu navegador. Utilizamos cookies para:
                        <ul>
                            <li>Recordar tus preferencias de usuario.</li>
                            <li>Analizar el tráfico del sitio y el comportamiento de los visitantes.</li>
                            <li>Cumplir con las regulaciones de consentimiento de cookies.</li>
                        </ul>
                    </p>

                    <h2 style={styles.subHeading}>4. Tus Derechos</h2>
                    <p style={styles.paragraph}>
                        Tienes derecho a solicitar acceso a tu información personal,
                        corregirla, eliminarla u oponerte a su uso. Para ejercer
                        estos derechos, contáctanos a través de la información
                        de contacto en nuestro sitio.
                    </p>

                    <h2 style={styles.subHeading}>5. Cambios en la Política</h2>
                    <p style={styles.paragraph}>
                        Nos reservamos el derecho de modificar esta política en
                        cualquier momento. Te notificaremos sobre cambios importantes
                        publicando la nueva política en esta página.
                    </p>
                </div>
            </main>
        </>
    );
}

export default PrivacyPolicyPage;