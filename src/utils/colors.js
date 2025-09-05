// src/utils/colors.js
export const generateColor = (id) => {
  let hash = 0;
  const str = id?.toString() || Math.random().toString();
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const h = hash % 360;
  const saturation = 35 + (hash % 20); // 35% - 55%
  const lightness = 75 + (hash % 10);  // 75% - 85%

  const backgroundColor = `hsl(${h}, ${saturation}%, ${lightness}%)`;

  // ⚡ Contraste: calcular color de texto según luminosidad
  // Si es muy claro, texto negro; si es medio, gris oscuro; si es muy oscuro, blanco
  const textColor = lightness > 80
    ? "#111"         // negro oscuro para fondos muy claros
    : lightness > 70
      ? "#333"       // gris oscuro para fondos medios
      : "#fff";      // blanco para fondos oscuros (aunque en pastel difícil)

  return { backgroundColor, textColor };
};
