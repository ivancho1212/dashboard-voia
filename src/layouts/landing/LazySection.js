// src/layouts/landing/LazySection.js
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const LazySection = ({ id, children, minHeight }) => {
    const ref = useRef();
    // Por defecto, el primer componente (hero) es visible.
    const [visible, setVisible] = useState(id === "hero" ? true : false);

    useEffect(() => {
        let observer;

        // No necesitamos un observer para el primer componente
        if ("IntersectionObserver" in window && ref.current && id !== "hero") {
            observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        setVisible(true);
                        console.log(`LazySection visible: ${id}`);
                        // Deja de observar una vez que el elemento es visible
                        observer.unobserve(entry.target);
                    }
                },
                {
                    // El elemento se considera visible cuando el 10% de su área está en el viewport
                    threshold: 0.1,
                    // Carga la sección cuando esté a 100px por debajo del viewport
                    rootMargin: "0px 0px -100px 0px",
                }
            );

            observer.observe(ref.current);
        } else if (id !== "hero") {
            // Fallback para navegadores que no soportan IntersectionObserver
            setVisible(true);
            console.log(`LazySection visible (fallback): ${id}`);
        }

        // Limpieza: desconecta el observer si el componente se desmonta
        return () => observer?.disconnect();
    }, [id]);

    return (
        <section
            id={id}
            ref={ref}
            style={{
                // Mantiene el espacio para evitar que el contenido "salte"
                minHeight: minHeight || "20vh",
                opacity: visible ? 1 : 0,
                transition: "opacity 0.6s ease-in",
            }}
        >
            {/* Solo renderiza el contenido si el componente es visible */}
            {visible && children}
        </section>
    );
};

LazySection.propTypes = {
    id: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
    minHeight: PropTypes.string,
};

export default LazySection;