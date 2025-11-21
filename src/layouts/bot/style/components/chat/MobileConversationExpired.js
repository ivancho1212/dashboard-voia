/**
 * Componente para mostrar cuando la conversación en móvil ha expirado/cerrado
 * La conversación entra en estado standby
 */

import PropTypes from 'prop-types';

export default function MobileConversationExpired({ isExpired }) {
  if (!isExpired) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        // Efecto de cristal empañado (frosted glass)
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)", // Para Safari
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        borderRadius: "inherit",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "32px",
          maxWidth: "85%",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div style={{ fontSize: "56px", marginBottom: "20px", animation: "pulse 2s infinite" }}>
          ⏱️
        </div>
        <div style={{ 
          fontSize: "20px", 
          fontWeight: "700", 
          color: "#d32f2f", 
          marginBottom: "12px",
          letterSpacing: "-0.5px"
        }}>
          Conversación cerrada
        </div>
        <div style={{ 
          fontSize: "15px", 
          color: "#555", 
          lineHeight: "1.6",
          marginBottom: "24px",
          fontWeight: "500"
        }}>
          Esta conversación ya no existe o ha expirado.
        </div>
        <div style={{ 
          fontSize: "13px", 
          color: "#888",
          fontStyle: "italic",
          marginBottom: "20px",
          paddingBottom: "20px",
          borderBottom: "1px solid rgba(0, 0, 0, 0.1)"
        }}>
          Por favor, regresa a la web para iniciar una nueva conversación.
        </div>
        <div style={{ 
          fontSize: "12px", 
          color: "#bbb",
          fontWeight: "600",
          letterSpacing: "0.5px"
        }}>
          Sesión en standby
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

MobileConversationExpired.propTypes = {
  isExpired: PropTypes.bool.isRequired,
};
