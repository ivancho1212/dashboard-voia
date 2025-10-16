// Validaciones reutilizables para BotTraining

export function validateFile(file, allowedTypes, maxSize, setFileErrors) {
  if (!allowedTypes[file.type]) {
    setFileErrors((prev) => new Map(prev).set(file, "Tipo de archivo no permitido"));
    return false;
  }
  if (file.size > maxSize) {
    setFileErrors((prev) => new Map(prev).set(file, "El archivo supera el tamaño máximo (5MB)"));
    return false;
  }
  setFileErrors((prev) => {
    const newErrors = new Map(prev);
    newErrors.delete(file);
    return newErrors;
  });
  return true;
}

export function validateUrl(url, setUrlErrors, urlErrors) {
  if (!url) return false;
  const urlPattern = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
  const isValid = urlPattern.test(url);
  if (!isValid) {
    setUrlErrors(new Map([...urlErrors, [url, "URL inválida"]]));
    return false;
  }
  const forbiddenPatterns = [
    "drive.google.com",
    "docs.google.com",
    "onedrive.live.com",
    "1drv.ms",
    "dropbox.com",
    "box.com",
    ".pdf",
  ];
  const lowerUrl = url.toLowerCase();
  const isForbidden = forbiddenPatterns.some((p) => lowerUrl.includes(p));
  if (isForbidden) {
    setUrlErrors(new Map([...urlErrors, [url, "Este tipo de enlace no está permitido"]]));
    return false;
  }
  const newUrlErrors = new Map(urlErrors);
  newUrlErrors.delete(url);
  setUrlErrors(newUrlErrors);
  return true;
}
