// src/utils/colors.js
export const generateColor = (id) => {
  let hash = 0;
  const str = id?.toString() || Math.random().toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = Math.abs(hash) % 360;

  // Pasteles suaves: saturación baja/moderada, luminosidad alta
  const saturation = 30 + (Math.abs(hash) % 20); // 30% - 50%
  const lightness = 75 + (Math.abs(hash) % 15); // 75% - 90%

  const backgroundColor = `hsl(${h}, ${saturation}%, ${lightness}%)`;

  // Contraste más amigable:
  // Si es muy claro (>=85%), texto gris oscuro
  // Si es claro-medio (75-85%), texto blanco
  // Si es medio-oscuro (<75%), texto blanco
  let textColor;
  if (lightness >= 85) textColor = "#444"; // gris oscuro
  else textColor = "#fff"; // blanco para la mayoría de pasteles

  return { backgroundColor, textColor };
};
