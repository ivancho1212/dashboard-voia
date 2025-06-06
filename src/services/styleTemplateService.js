export const getStyleTemplates = async () => {
  const response = await fetch("http://localhost:5006/api/botstyles");

  if (!response.ok) {
    throw new Error("Error al obtener los estilos");
  }

  return await response.json();
};
