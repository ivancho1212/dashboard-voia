import JSZip from "jszip";
import { saveAs } from "file-saver";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5006";

export const buildFileUrl = (fileUrl) => {
  if (!fileUrl) return "";
  // If the fileUrl is already an absolute URL, return as-is
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

  // If the fileUrl already contains the backend base, return as-is
  if (fileUrl.startsWith(process.env.REACT_APP_BACKEND_URL)) return fileUrl;

  const cleanBase = (process.env.REACT_APP_BACKEND_URL || "http://localhost:5006").replace(/\/$/, "");
  const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  
  // ✅ Si es una URL de archivo protegido (/api/files/chat/...), agregar /inline
  const finalUrl = cleanPath.includes("/api/files/chat/") && !cleanPath.includes("/inline") 
    ? `${cleanBase}${cleanPath}/inline`
    : `${cleanBase}${cleanPath}`;
    
  return finalUrl;
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
      alert(`Error al descargar: ${file.fileName}`);
      return;
    }
  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  saveAs(zipBlob, "imagenes.zip");
};
