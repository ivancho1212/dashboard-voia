import { validateFile, validateUrl } from "../helpers/validationHelpers";
import Swal from "sweetalert2";
import { createTrainingUrl } from "../../services/trainingUrlsService";
import { createTrainingCustomText } from "../../services/trainingCustomTextsService";

export function useBotTrainingHandlers({
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  setFileErrors,
  setFiles,
  urlErrors,
  setUrlErrors,
  botParamId,
  template,
  bot,
  userId,
  setUrls,
  setCurrentUrl,
  setTexts,
  setCurrentText
}) {
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.filter((file) => validateFile(file, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, setFileErrors));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleAddUrl = async (currentUrl) => {
    if (currentUrl && validateUrl(currentUrl, setUrlErrors, urlErrors)) {
      // Si no existe un bot persistido aún (creación flow), agregar localmente y postergar la persistencia
      if (!bot || !bot.id) {
        setUrls((prev) => [...prev, currentUrl]);
        Swal.fire({ icon: 'success', title: 'URL añadida (pendiente)', text: 'La URL se guardó localmente y se persistirá cuando se cree el bot.' });
        setCurrentUrl("");
        return;
      }

      if (!botParamId || !(template?.id || bot?.botTemplateId) || !userId) {
        Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Faltan datos requeridos para guardar la URL. Verifica que el bot, plantilla y usuario estén correctamente cargados.' });
        return;
      }
      try {
        let validSessionId = null;
        if (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) {
          const { getTemplateTrainingSessionsByTemplate } = await import("../../services/templateTrainingSessionsService.js");
          const sessions = await getTemplateTrainingSessionsByTemplate(template?.id || bot?.botTemplateId);
          if (sessions.some(s => s.id === bot.templateTrainingSessionId)) {
            validSessionId = bot.templateTrainingSessionId;
          }
        }
        const payload = {
          botId: botParamId,
          botTemplateId: template?.id || bot?.botTemplateId,
          templateTrainingSessionId: validSessionId,
          userId: userId,
          url: currentUrl
        };
        await createTrainingUrl(payload);
        setUrls((prev) => [...prev, { url: currentUrl }]);
        Swal.fire({ icon: 'success', title: 'URL añadida', text: 'La URL se guardó correctamente.' });
        setCurrentUrl("");
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error al guardar URL', text: error?.response?.data?.message || error?.message || 'No se pudo guardar la URL.' });
      }
    }
  };

  const handleAddText = async (currentText) => {
    if (currentText) {
      // Si no existe aún un bot persistido, guardar local y posponer
      if (!bot || !bot.id) {
        setTexts(prev => [...prev, currentText]);
        Swal.fire({ icon: 'success', title: 'Texto añadido (pendiente)', text: 'El texto se guardó localmente y se persistirá cuando se cree el bot.' });
        setCurrentText("");
        return;
      }

      if (!botParamId || !(template?.id || bot?.botTemplateId) || !userId) {
        Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Faltan datos requeridos para guardar el texto. Verifica que el bot, plantilla y usuario estén correctamente cargados.' });
        return;
      }
      try {
        let validSessionId = null;
        if (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) {
          const { getTemplateTrainingSessionsByTemplate } = await import("../../services/templateTrainingSessionsService.js");
          const sessions = await getTemplateTrainingSessionsByTemplate(template?.id || bot?.botTemplateId);
          if (sessions.some(s => s.id === bot.templateTrainingSessionId)) {
            validSessionId = bot.templateTrainingSessionId;
          }
        }
        const payload = {
          botId: botParamId,
          botTemplateId: template?.id || bot?.botTemplateId,
          templateTrainingSessionId: validSessionId,
          userId: userId,
          content: currentText
        };
        await createTrainingCustomText(payload);
        setTexts((prev) => [...prev, { content: currentText }]);
        Swal.fire({ icon: 'success', title: 'Texto añadido', text: 'El texto se guardó correctamente.' });
        setCurrentText("");
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error al guardar texto', text: error?.response?.data?.message || error?.message || 'No se pudo guardar el texto.' });
      }
    }
  };

  return {
    handleFileChange,
    handleAddUrl,
    handleAddText
  };
}
