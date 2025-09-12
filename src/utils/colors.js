const COMPATIBLE_COLORS = [
  "#ffe9d6ff", // durazno
  "#bcf1bcff", // verde pastel
  "#ffd4dcff", // rosa claro
  "#FFFACD", // amarillo claro
  "#E6E6FA", // lavanda
  "#c2e1e6ff", // azul pastel distinto
  "#fcedd3ff", // trigo pastel
  "#e0cfe0ff", // lila
];

function getTextColor(bgColor) {
  const r = parseInt(bgColor.substr(1, 2), 16);
  const g = parseInt(bgColor.substr(3, 2), 16);
  const b = parseInt(bgColor.substr(5, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (luminance > 0.8) return "#111";
  if (luminance > 0.6) return "#333";
  if (luminance > 0.4) return "#555";
  return "#fff";
}

const senderColors = {}; // 🔹 cache por remitente

export const getSenderColor = (sender) => {
  // Usuario → color fijo
  if (sender === "user") {
    return { backgroundColor: "#b8d0ecff", textColor: "#111" };
  }

  // Si ya tiene color, devolverlo
  if (senderColors[sender]) return senderColors[sender];

  // Sino, generar uno y guardarlo
  const index = Math.floor(Math.random() * COMPATIBLE_COLORS.length);
  const backgroundColor = COMPATIBLE_COLORS[index];
  const textColor = getTextColor(backgroundColor);

  senderColors[sender] = { backgroundColor, textColor };
  return senderColors[sender];
};
