/**
 * Componente para mostrar overlay cuando la conversación está abierta en otro dispositivo
 * 
 * 🎨 Efecto de "vidrio empañado" cubriendo todo el widget
 */

import React from 'react';
import PropTypes from 'prop-types';

export default function DeviceConflictOverlay({ isBlocked, blockMessage }) {
  if (!isBlocked) return null;

  return (
    <>
      {/* 🔸 Overlay de fondo - cubre TODO el widget */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          borderRadius: "16px",
          zIndex: 9998,
          pointerEvents: "auto",
        }}
      />

      {/* 🔸 Modal centrado - mensaje */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          backgroundColor: "#ffffff",
          border: "none",
          borderRadius: "12px",
          padding: "28px 24px",
          maxWidth: "280px",
          textAlign: "center",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
          pointerEvents: "auto",
        }}
      >
        {/* 📱 Ícono */}
        <div style={{ fontSize: "44px", marginBottom: "12px" }}>📱</div>

        {/* Título */}
        <div
          style={{
            color: "#1565c0",
            fontSize: "15px",
            fontWeight: "700",
            marginBottom: "8px",
            letterSpacing: "-0.3px",
          }}
        >
          Conversación abierta en móvil
        </div>

        {/* Mensaje */}
        <div
          style={{
            color: "#555555",
            fontSize: "13px",
            fontWeight: "500",
            lineHeight: "1.5",
            marginBottom: "20px",
          }}
        >
          {blockMessage || 'Para continuar aquí, cierra la sesión en tu celular.'}
        </div>

        {/* Indicador visual */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <div
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#4CAF50",
              animation: "pulse 2s infinite",
            }}
          />
          <span style={{ color: "#999999", fontSize: "11px" }}>
            Esperando...
          </span>
        </div>

        {/* CSS para animación */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.6; transform: scale(1.3); }
          }
        `}</style>
      </div>
    </>
  );
}

DeviceConflictOverlay.propTypes = {
  isBlocked: PropTypes.bool.isRequired,
  blockMessage: PropTypes.string,
};

