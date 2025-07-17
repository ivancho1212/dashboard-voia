import JSZip from "jszip";
import { saveAs } from "file-saver";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5006";

export const buildFileUrl = (fileUrl) => {
  if (!fileUrl) return "";
  const cleanBase = BACKEND_URL.replace(/\/$/, "");
  const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  return `${cleanBase}${cleanPath}`;
};

export const downloadImagesAsZip = async (images) => {
  const zip = new JSZip();
  const folder = zip.folder("imagenes");

  for (const file of images) {
    try {
      const url = buildFileUrl(file.fileUrl);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error al descargar: ${file.fileName}`);
      const blob = await response.blob();
      folder.file(file.fileName || "imagen.jpg", blob);
    } catch (err) {
      console.error("❌ Falló la descarga:", file.fileUrl, err);
      alert(`Error al descargar: ${file.fileName}`);
      return;
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "imagenes.zip");
};
