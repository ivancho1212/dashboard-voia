// src/components/NeuralBackground.js
import React from "react";
import Particles from "react-tsparticles";
import { loadLinksPreset } from "tsparticles-preset-links";
import { Engine } from "tsparticles-engine";

const NeuralBackground = () => {
  const particlesInit = async (engine) => {
    await loadLinksPreset(engine); // usamos preset "links"
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        preset: "links",
        background: {
          color: "#0e0e0e",
        },
        particles: {
          color: {
            value: "#00bfa5",
          },
          links: {
            color: "#00bfa5",
            distance: 150,
            enable: true,
            opacity: 0.2,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1,
          },
          number: {
            value: 60,
          },
          opacity: {
            value: 0.4,
          },
          shape: {
            type: "circle",
          },
          size: {
            value: 2,
          },
        },
        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },
          },
          modes: {
            grab: {
              distance: 200,
              links: {
                opacity: 0.3,
              },
            },
          },
        },
      }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
};

export default NeuralBackground;
