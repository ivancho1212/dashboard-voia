import { getTemplateTrainingSessionsByTemplate } from "../../../services/templateTrainingSessionsService.js";
import { getBotTemplateById } from "services/botTemplateService";
import TextsSection from "./components/TextsSection";
import UrlsSection from "./components/UrlsSection";
import FilesSection from "./components/FilesSection";
import InteractionsSection from "./components/InteractionsSection";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "./helpers/constants";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Icon from "@mui/material/Icon";
import { validateFile, validateUrl } from "./helpers/validationHelpers";
import {
  createBot,
  updateBotReady,
  getBotById,
  getIaProviders,
  getModelConfigsByProvider
} from "services/botService";
import {
  uploadFile,
  deleteUploadedDocument,
  getUploadedDocumentsByTemplate,
  getUploadedDocumentsByBot
} from "services/uploadedDocumentsService";
import {
  createTrainingUrl,
  deleteTrainingUrl,
  getTrainingUrlsByTemplate,
  getTrainingUrlsByBot
} from "services/trainingUrlsService";
import {
  getBotCustomPromptsByBotId,
  createBotCustomPrompt,
  deleteBotCustomPrompt
} from "services/botCustomPromptsService";
import { getTrainingTextsByTemplate, getTrainingTextsByBot, createTrainingCustomText, deleteTrainingText } from "services/trainingCustomTextsService";


function BotTraining() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: botParamId } = useParams();

  // --- ESTADOS ---
  const [tabIndex, setTabIndex] = useState(0);
  const [customPrompt, setCustomPrompt] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [template, setTemplate] = useState(null);
  const [createdBotId, setCreatedBotId] = useState(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [interactions, setInteractions] = useState([]);
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [iaProviderName, setIaProviderName] = useState("");
  const [aiModelConfigName, setAiModelConfigName] = useState("");
  const [files, setFiles] = useState([]);
  const [fileErrors, setFileErrors] = useState(new Map());
  const [urls, setUrls] = useState([]);
  const [urlErrors, setUrlErrors] = useState(new Map());
  const [texts, setTexts] = useState([]);
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [creatingBot, setCreatingBot] = useState(false);
  const [userId, setUserId] = useState(() => {
    // Intenta obtener el userId del localStorage (ajusta la clave si es diferente)
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        return parsed.id || null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [bot, setBot] = useState(null);
  const [style, setStyle] = useState(null);

  // Si venimos de la lista de plantillas (navigate con location.state.template), usarla
  useEffect(() => {
    if (location.state && location.state.template) {
      setTemplate(location.state.template);
    }
  }, [location.state, botParamId, editMode]);

  // --- FUNCIONES DE VALIDACIÓN ---
  // --- CREAR BOT ---
  const handleCreateBot = async () => {
    // Implementación limpia y balanceada
    setCreatingBot(true);
    try {
      // Validar plantilla
      const botTemplateId = template?.id || bot?.botTemplateId;
      if (!botTemplateId) {
        Swal.fire({ icon: 'error', title: 'Falta plantilla', text: 'No se ha seleccionado una plantilla válida para crear el bot.' });
        return;
      }

      // Generar o reutilizar apiKey (requerido por CreateBotDto)
      const apiKeyToUse = (bot && bot.apiKey) || `apikey-${Math.random().toString(36).slice(2,10)}`;

      const botData = {
        name: botName,
        description: botDescription,
        apiKey: apiKeyToUse,
        isActive: true,
        botTemplateId,
        iaProviderName,
        aiModelConfigName,
      };

      const createdBot = await createBot(botData);
      // Guardar estado básico del bot creado
      setCreatedBotId(createdBot.id);
      setBot(createdBot);

      // Persistir URLs pendientes que se agregaron localmente durante la creación
      try {
        if (urls && urls.length > 0) {
          const pendingUrls = urls.filter(u => !(u && typeof u === 'object' && u.id));
          for (const u of pendingUrls) {
            try {
              const payload = {
                botId: createdBot.id,
                botTemplateId: template?.id || createdBot.botTemplateId,
                templateTrainingSessionId: null,
                userId: userId,
                url: typeof u === 'string' ? u : (u.url || '')
              };
              const resp = await createTrainingUrl(payload);
              // replace placeholder in state with returned object when possible
              setUrls(prev => prev.map(item => (item === u ? resp : item)));
            } catch (err) {
              console.warn('No se pudo persistir URL pendiente', u, err);
            }
          }
        }
      } catch (err) {
        console.warn('Error al procesar URLs pendientes tras crear bot', err);
      }

      // Persistir textos pendientes que se agregaron localmente durante la creación
      try {
        if (texts && texts.length > 0) {
          const pendingTexts = texts.filter(t => !(t && typeof t === 'object' && t.id));
          for (const t of pendingTexts) {
            try {
              const payload = {
                botId: createdBot.id,
                botTemplateId: template?.id || createdBot.botTemplateId,
                templateTrainingSessionId: null,
                userId: userId,
                content: typeof t === 'string' ? t : (t.content || '')
              };
              const resp = await createTrainingCustomText(payload);
              setTexts(prev => prev.map(item => (item === t ? resp : item)));
            } catch (err) {
              console.warn('No se pudo persistir texto pendiente', t, err);
            }
          }
        }
      } catch (err) {
        console.warn('Error al procesar textos pendientes tras crear bot', err);
      }
      // Persistir interacciones pendientes (aquellas sin id numérico)
      if (interactions && interactions.length > 0) {
        const pending = interactions.filter(i => !(i.id && Number.isInteger(i.id)));
        for (let i = 0; i < pending.length; i += 2) {
          const userPrompt = pending[i];
          const assistantPrompt = pending[i + 1];
          if (!userPrompt) continue;
          try {
            // Crear user prompt
            const payloadUser = {
              botId: createdBot.id,
              role: 'user',
              content: userPrompt.content,
              botTemplateId: template?.id || null,
              templateTrainingSessionId: bot?.templateTrainingSessionId || null,
            };
            const respUser = await createBotCustomPrompt(payloadUser);

            // Crear assistant prompt si existe
            let respAssistant = null;
            if (assistantPrompt) {
              const payloadAssistant = {
                botId: createdBot.id,
                role: 'assistant',
                content: assistantPrompt.content,
                botTemplateId: template?.id || null,
                templateTrainingSessionId: bot?.templateTrainingSessionId || null,
              };
              respAssistant = await createBotCustomPrompt(payloadAssistant);
            }

            // Reemplazar placeholders en el estado de interacciones
            setInteractions((prev) => prev.map((p) => {
              if (p === userPrompt && respUser) return { id: respUser.id, role: respUser.role?.toLowerCase?.() || 'user', content: respUser.content };
              if (p === assistantPrompt && respAssistant) return { id: respAssistant.id, role: respAssistant.role?.toLowerCase?.() || 'assistant', content: respAssistant.content };
              return p;
            }));
          } catch (innerErr) {
            console.error('Error persisting one pair of pending interactions', innerErr);
            // No abortar todo el proceso por un fallo en una interacción; continuar con las siguientes
          }
        }
      }

      Swal.fire({ icon: 'success', title: 'Bot creado', text: 'El bot ha sido creado correctamente.' });
      // Opcional: navegar o refrescar
      // navigate(`/bots/captured-data/${createdBot.id}`, { state: { botId: createdBot.id } });
    } catch (error) {
      // Manejo de errores: 401 -> sugerir login; 400 -> mostrar detalles de validación
      if (error && error.status === 401) {
        Swal.fire({ icon: 'error', title: 'No autorizado', text: 'Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión nuevamente.' });
      } else if (error && error.status === 400 && error.details) {
        let message = error.details.title || 'Error de validación';
        if (error.details.errors) {
          const errs = [];
          for (const k of Object.keys(error.details.errors)) {
            errs.push(`${k}: ${error.details.errors[k].join(', ')}`);
          }
          message += '\n' + errs.join('\n');
        }
        Swal.fire({ icon: 'error', title: 'Error al crear (validación)', text: message });
      } else {
        Swal.fire({ icon: 'error', title: 'Error al crear', text: error?.message || 'No se pudo crear el bot.' });
      }
    } finally {
      setCreatingBot(false);
    }
  };

  // --- EDITAR BOT ---
  const handleUpdateBot = async () => {
    if (!botParamId) return;
    try {
      setCreatingBot(true);
      // Construir el payload para actualizar el bot
      const botData = {
        name: botName,
        description: botDescription,
        // UpdateBotDto en el servidor exige ApiKey y Name (required). Usar el apiKey existente del bot.
        apiKey: bot?.apiKey || "",
        // Enviar estado y styleId si están disponibles
        isActive: typeof bot?.isActive !== 'undefined' ? bot.isActive : true,
        styleId: typeof bot?.styleId !== 'undefined' ? bot.styleId : null,
        // Puedes agregar más campos según el DTO requerido
      };
      await updateBotReady(botParamId, botData);
      Swal.fire({
        icon: 'success',
        title: 'Bot actualizado',
        text: 'Los cambios han sido guardados correctamente.'
      });
      setCreatingBot(false);
      navigate(-1); // Regresar o refrescar
    } catch (error) {
      setCreatingBot(false);
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error?.message || 'No se pudo actualizar el bot.'
      });
    }
  };

  // --- HANDLERS ---
  const handleFileChange = (e) => {
  const selectedFiles = Array.from(e.target.files || []);
  const validFiles = selectedFiles.filter((file) => validateFile(file, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, setFileErrors));

  // Si no hay bot o usuario, solo agregar al estado (se subirá después al crear el bot)
  if (!createdBotId && !editMode) {
    setFiles((prev) => [...prev, ...validFiles]);
    return;
  }

  // Subir archivos en paralelo con progreso
    const uploadPromises = validFiles.map((file) => new Promise(async (resolve) => {
    try {
      let validSessionId = null;
      if (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) {
        const sessions = await getTemplateTrainingSessionsByTemplate(template?.id || bot?.botTemplateId);
        if (sessions.some(s => s.id === bot.templateTrainingSessionId)) {
          validSessionId = bot.templateTrainingSessionId;
        }
      }

      // Añadir un placeholder con progress 0 para que aparezca en la UI
      const placeholder = { name: file.name, fileObject: file, uploadProgress: 0 };
      setFiles((prev) => [...prev, placeholder]);

      const onUploadProgress = (ev) => {
        const percent = Math.round((ev.loaded * 100) / ev.total);
        setFiles((prev) => prev.map((f) => (f === placeholder ? { ...f, uploadProgress: percent } : f)));
      };

      const resp = await uploadFile(file, createdBotId || botParamId, template?.id || bot?.botTemplateId, userId, validSessionId, onUploadProgress);

      if (resp && resp.id) {
        // reemplazar placeholder por la respuesta real
        setFiles((prev) => prev.map((f) => (f === placeholder ? resp : f)));
        try {
          const bid = Number(createdBotId || botParamId);
          localStorage.setItem(`bot_phases_refresh_${bid}`, Date.now().toString());
          window.dispatchEvent(new CustomEvent('botPhasesUpdated', { detail: { botId: bid } }));
        } catch (e) { /* ignore */ }
      } else if (resp && resp.duplicate) {
        // key by filename so UI can match
        setFileErrors((prev) => {
          const m = new Map(prev);
          m.set(file.name, resp.message || 'Archivo duplicado');
          return m;
        });
        setFiles((prev) => prev.filter((f) => f !== placeholder));
      } else {
        setFiles((prev) => prev.map((f) => (f === placeholder ? { ...f, uploadProgress: 100 } : f)));
      }
      resolve(resp);
      } catch (err) {
      console.error('Error subiendo archivo', file.name, err);
      // Key errors by filename so they map to displayed items
      setFileErrors((prev) => {
        const m = new Map(prev);
        m.set(file.name, err?.response?.data?.message || err.message || 'Error al subir');
        return m;
      });
      Swal.fire({ icon: 'error', title: 'Error al subir archivo', text: `No se pudo subir ${file.name}: ${err?.response?.data?.message || err.message || ''}` });
      // eliminar placeholder (identificado por fileObject)
      setFiles((prev) => prev.filter((f) => !(f.fileObject && f.fileObject === file)));
      resolve({ error: true });
    }
  }));

  // Esperar todos (no es necesario usar resultados aquí)
  Promise.all(uploadPromises).then(() => {
    console.log('Todos los uploads finalizados');
  });
  };

  // Reintentar un archivo que falló por error transitorio
  const handleRetryFile = async (fileEntry) => {
    if (!fileEntry || !fileEntry.fileObject) return;
    const file = fileEntry.fileObject;
    try {
      // reset state for this placeholder
      setFiles((prev) => prev.map((f) => (f === fileEntry ? { ...f, uploadProgress: 0, error: undefined, canRetry: false } : f)));
      const validSessionId = (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) ? bot.templateTrainingSessionId : null;
      const onUploadProgress = (ev) => {
        const percent = Math.round((ev.loaded * 100) / ev.total);
        setFiles((prev) => prev.map((f) => (f === fileEntry ? { ...f, uploadProgress: percent } : f)));
      };
      const resp = await uploadFile(file, createdBotId || botParamId, template?.id || bot?.botTemplateId, userId, validSessionId, onUploadProgress);
      if (resp && resp.id) {
        setFiles((prev) => prev.map((f) => (f === fileEntry ? resp : f)));
        const newErrors = new Map(fileErrors);
        newErrors.delete(file.name);
        setFileErrors(newErrors);
        try {
          const bid = Number(createdBotId || botParamId);
          localStorage.setItem(`bot_phases_refresh_${bid}`, Date.now().toString());
          window.dispatchEvent(new CustomEvent('botPhasesUpdated', { detail: { botId: bid } }));
        } catch (e) { /* ignore */ }
      } else {
        setFiles((prev) => prev.map((f) => (f === fileEntry ? { ...f, uploadProgress: 100 } : f)));
      }
    } catch (err) {
      console.error('Retry failed', err);
      const message = err?.response?.data?.message || err.message || 'Error al reintentar';
      setFiles((prev) => prev.map((f) => (f === fileEntry ? { ...f, error: message, canRetry: true } : f)));
      setFileErrors((prev) => new Map(prev).set(file.name, message));
      Swal.fire({ icon: 'error', title: 'Error al reintentar', text: message });
    }
  };


  // Añadir URL individualmente y guardar en backend

  const handleAddUrl = async () => {
  if (currentUrl && validateUrl(currentUrl, setUrlErrors, urlErrors)) {
      // Log para depuración
      console.log('DEBUG bot:', bot);
      console.log('DEBUG template:', template);
      console.log('DEBUG userId:', userId);
      // Validar campos requeridos
      if (!botParamId || !(template?.id || bot?.botTemplateId) || !userId) {
        Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Faltan datos requeridos para guardar la URL. Verifica que el bot, plantilla y usuario estén correctamente cargados.' });
        return;
      }
      try {
        // Si estamos en modo creación y no hay createdBotId, solo agregar al estado local y postergar la persistencia
        if (!createdBotId && !editMode) {
          setUrls(prev => [...prev, currentUrl]);
          Swal.fire({ icon: 'success', title: 'URL añadida (pendiente)', text: 'La URL se guardó localmente y se persistirá cuando se cree el bot.' });
          setCurrentUrl("");
          return;
        }

        let validSessionId = null;
        if (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) {
          // Validar que la sesión pertenezca a la plantilla
          const sessions = await getTemplateTrainingSessionsByTemplate(template?.id || bot?.botTemplateId);
          if (sessions.some(s => s.id === bot.templateTrainingSessionId)) {
            validSessionId = bot.templateTrainingSessionId;
          }
        }
        const botIdToUse = Number(createdBotId || bot?.id || botParamId);
        const botTemplateIdToUse = Number(template?.id || bot?.botTemplateId);
        const payload = {
          botId: botIdToUse,
          botTemplateId: botTemplateIdToUse,
          templateTrainingSessionId: validSessionId,
          userId: Number(userId),
          url: currentUrl
        };
        console.log('DEBUG payload URL:', payload);
  const urlResp = await createTrainingUrl(payload);
  setUrls((prev) => [...prev, urlResp || { url: currentUrl }]);
        Swal.fire({ icon: 'success', title: 'URL añadida', text: 'La URL se guardó correctamente.' });
        setCurrentUrl("");
        try {
          const bid = Number(payload.botId);
          localStorage.setItem(`bot_phases_refresh_${bid}`, Date.now().toString());
          window.dispatchEvent(new CustomEvent('botPhasesUpdated', { detail: { botId: bid } }));
        } catch (e) { /* ignore */ }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error al guardar URL', text: error?.response?.data?.message || error?.message || 'No se pudo guardar la URL.' });
      }
    }
  }

  // Añadir texto individualmente y guardar en backend
  const handleAddText = async () => {
    if (currentText) {
      // Log para depuración
      console.log('DEBUG bot:', bot);
      console.log('DEBUG template:', template);
      console.log('DEBUG userId:', userId);
      // Validar campos requeridos
      if (!botParamId || !(template?.id || bot?.botTemplateId) || !userId) {
        Swal.fire({ icon: 'error', title: 'Datos incompletos', text: 'Faltan datos requeridos para guardar el texto. Verifica que el bot, plantilla y usuario estén correctamente cargados.' });
        return;
      }
      try {
        // Si estamos creando el bot y aún no existe, guardar localmente y persistir después
        if (!createdBotId && !editMode) {
          setTexts(prev => [...prev, currentText]);
          Swal.fire({ icon: 'success', title: 'Texto añadido (pendiente)', text: 'El texto se guardó localmente y se persistirá cuando se cree el bot.' });
          setCurrentText("");
          return;
        }

        let validSessionId = null;
        if (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) {
          const sessions = await getTemplateTrainingSessionsByTemplate(template?.id || bot?.botTemplateId);
          if (sessions.some(s => s.id === bot.templateTrainingSessionId)) {
            validSessionId = bot.templateTrainingSessionId;
          }
        }
        const botIdToUse = Number(createdBotId || bot?.id || botParamId);
        const botTemplateIdToUse = Number(template?.id || bot?.botTemplateId);
        const payload = {
          botId: botIdToUse,
          botTemplateId: botTemplateIdToUse,
          templateTrainingSessionId: validSessionId,
          userId: Number(userId),
          content: currentText
        };
        console.log('DEBUG payload TEXT:', payload);
        const resp = await createTrainingCustomText(payload);
        // createTrainingCustomText may return a duplicate object or the created resource with id
        if (resp && resp.duplicate) {
          Swal.fire({ icon: 'warning', title: 'Texto duplicado', text: resp.message || 'El texto ya existe.' });
        } else if (resp) {
          const toPush = typeof resp === 'object' && (resp.id || resp.content) ? resp : { content: currentText };
          setTexts((prev) => [...prev, toPush]);
          Swal.fire({ icon: 'success', title: 'Texto añadido', text: 'El texto se guardó correctamente.' });
          setCurrentText("");
        } else {
          setTexts((prev) => [...prev, { content: currentText }]);
          Swal.fire({ icon: 'success', title: 'Texto añadido', text: 'El texto se guardó correctamente (sin id retornado).' });
          setCurrentText("");
        }
        // notify that training/data may have updated
        try {
          const bid = Number(payload.botId);
          localStorage.setItem(`bot_phases_refresh_${bid}`, Date.now().toString());
          window.dispatchEvent(new CustomEvent('botPhasesUpdated', { detail: { botId: bid } }));
        } catch (e) { /* ignore */ }
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error al guardar texto', text: error?.response?.data?.message || error?.message || 'No se pudo guardar el texto.' });
      }
    }
  }

  const handleAddInteraction = async () => {
    if (!question.trim() || !answer.trim()) {
      Swal.fire("Campos incompletos", "La pregunta y la respuesta no pueden estar vacías.", "warning");
      return;
    }
    setIsAddingInteraction(true);
    try {
      // If bot exists on server (edit mode or already created), persist prompts
      const botIdToUse = createdBotId || botParamId;
      let validSessionId = null;
      if (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) {
        const sessions = await getTemplateTrainingSessionsByTemplate(template?.id || bot?.botTemplateId);
        if (sessions.some(s => s.id === bot.templateTrainingSessionId)) {
          validSessionId = bot.templateTrainingSessionId;
        }
      }

      if (botIdToUse) {
        // Create user prompt on server
        const payloadUser = {
          botId: botIdToUse,
          role: 'user',
          content: question,
          botTemplateId: template?.id || bot?.botTemplateId,
          templateTrainingSessionId: validSessionId,
        };
        const respUser = await createBotCustomPrompt(payloadUser);

        // Create assistant prompt on server
        const payloadAssistant = {
          botId: botIdToUse,
          role: 'assistant',
          content: answer,
          botTemplateId: template?.id || bot?.botTemplateId,
          templateTrainingSessionId: validSessionId,
        };
        const respAssistant = await createBotCustomPrompt(payloadAssistant);

        // Append created prompts to state (use server response when available)
        setInteractions((prev) => [
          ...prev,
          { id: respUser?.id || null, role: respUser?.role?.toLowerCase?.() || 'user', content: respUser?.content || question },
          { id: respAssistant?.id || null, role: respAssistant?.role?.toLowerCase?.() || 'assistant', content: respAssistant?.content || answer },
        ]);
      } else {
        // No bot yet: keep local placeholders; they will be persisted after bot creation
        setInteractions((prev) => [
          ...prev,
          { id: null, role: 'user', content: question },
          { id: null, role: 'assistant', content: answer },
        ]);
      }

      setQuestion('');
      setAnswer('');
      Swal.fire({ icon: 'success', title: 'Interacción añadida', text: 'La interacción fue añadida.' });
    } catch (err) {
      console.error('Error guardando interacción', err);
      Swal.fire({ icon: 'error', title: 'Error al guardar interacción', text: err?.response?.data?.message || err.message || 'No se pudo guardar la interacción.' });
    } finally {
      setIsAddingInteraction(false);
    }
  };

  const handleDeleteInteraction = (index) => {
    (async () => {
      try {
        const userPrompt = interactions[index];
        const assistantPrompt = interactions[index + 1];
        // If persisted prompts have numeric ids, delete them on backend
        if (userPrompt && userPrompt.id && Number.isInteger(userPrompt.id)) {
          await deleteBotCustomPrompt(userPrompt.id);
        }
        if (assistantPrompt && assistantPrompt.id && Number.isInteger(assistantPrompt.id)) {
          await deleteBotCustomPrompt(assistantPrompt.id);
        }
        setInteractions((prev) => prev.filter((p, i) => i !== index && i !== index + 1));
      } catch (err) {
        console.error('Error eliminando interacción', err);
        Swal.fire({ icon: 'error', title: 'Error al eliminar interacción', text: err?.response?.data?.message || err.message || 'No se pudo eliminar la interacción.' });
      }
    })();
  };

  const handleDeleteFile = (fileToDelete) => {
    (async () => {
      try {
        // Si el archivo tiene id, eliminar en backend
        if (fileToDelete && fileToDelete.id) {
          await deleteUploadedDocument(fileToDelete.id);
        }
        setFiles((prev) => prev.filter((file) => file !== fileToDelete));
        const newErrors = new Map(fileErrors);
        newErrors.delete(fileToDelete);
        setFileErrors(newErrors);
      } catch (err) {
        console.error('Error eliminando archivo', err);
        Swal.fire({ icon: 'error', title: 'Error al eliminar', text: err?.response?.data?.message || err.message || 'No se pudo eliminar el archivo.' });
      }
    })();
  };

  const handleDeleteUrl = (urlToDelete) => {
    (async () => {
      try {
        // urlToDelete puede ser string (url) o un objeto { id, url }
        const id = urlToDelete && typeof urlToDelete === 'object' ? urlToDelete.id : null;
        if (id) {
          await deleteTrainingUrl(id);
        } else if (typeof urlToDelete === 'string') {
          // No tenemos id: intentar buscar en la lista actual si el item tiene id
          const found = urls.find(u => (typeof u === 'object' ? u.url === urlToDelete : u === urlToDelete));
          if (found && typeof found === 'object' && found.id) {
            await deleteTrainingUrl(found.id);
          } else {
            // No hay id en el backend: simplemente eliminar localmente
            console.warn('Eliminar URL localmente (no se encontró id en backend)');
          }
        }
        setUrls((prev) => prev.filter((u) => (typeof u === 'object' ? u.id !== id && u.url !== urlToDelete : u !== urlToDelete)));
      } catch (err) {
        console.error('Error eliminando URL', err);
        Swal.fire({ icon: 'error', title: 'Error al eliminar URL', text: err?.response?.data?.message || err.message || 'No se pudo eliminar la URL.' });
      }
    })();
  };

  const handleDeleteText = (textToDelete) => {
    (async () => {
      try {
        // textToDelete puede ser string o objeto { id, content }
        const id = textToDelete && typeof textToDelete === 'object' ? textToDelete.id : null;
        if (id) {
          await deleteTrainingText(id);
        } else if (typeof textToDelete === 'string') {
          const found = texts.find(t => (typeof t === 'object' ? t.content === textToDelete : t === textToDelete));
          if (found && typeof found === 'object' && found.id) {
            await deleteTrainingText(found.id);
          } else {
            console.warn('Eliminar texto localmente (no se encontró id en backend)');
          }
        }
        setTexts((prev) => prev.filter((t) => (typeof t === 'object' ? t.id !== id && t.content !== textToDelete : t !== textToDelete)));
      } catch (err) {
        console.error('Error eliminando texto', err);
        Swal.fire({ icon: 'error', title: 'Error al eliminar texto', text: err?.response?.data?.message || err.message || 'No se pudo eliminar el texto.' });
      }
    })();
  };

  const handleCancelEdit = () => navigate(-1);

  // --- EFECTOS ---
  useEffect(() => {
    const fetchBotData = async () => {
      if (!botParamId) return;
      setEditMode(true);
      try {
        const botData = await getBotById(botParamId);
        setBot(botData);
        setBotName(botData.name || "");
        setBotDescription(botData.description || "");
        setIaProviderName(botData.iaProviderName || "");
        setAiModelConfigName(botData.aiModelConfigName || "");

        // Prompts e interacciones
        const prompts = await getBotCustomPromptsByBotId(botParamId);
        const pairs = [];
        for (let i = 0; i < prompts.length; i += 2) {
          if (prompts[i] && prompts[i + 1]) pairs.push(prompts[i], prompts[i + 1]);
        }
        setInteractions(pairs);
        const custom = prompts.find((p) => p.role === "system" || p.isCustomPrompt);
        setCustomPrompt(custom ? custom.content : "");

        // Documentos por botId
        try {
          const docs = await getUploadedDocumentsByBot(botParamId);
          setFiles(docs || []);
        } catch (err) {
          if (err?.response?.status === 403) {
            Swal.fire({
              icon: 'error',
              title: 'Permiso denegado',
              text: 'No tienes permisos para ver los documentos de este bot.'
            });
          } else {
            console.error("Error cargando documentos:", err);
          }
        }

        // URLs por botId
        try {
          const urls = await getTrainingUrlsByBot(botParamId);
          setUrls(urls || []);
        } catch (err) {
          if (err?.response?.status === 403) {
            Swal.fire({
              icon: 'error',
              title: 'Permiso denegado',
              text: 'No tienes permisos para ver las URLs de este bot.'
            });
          } else {
            console.error("Error cargando URLs:", err);
          }
        }

        // Textos planos por botId
        try {
          const texts = await getTrainingTextsByBot(botParamId);
          setTexts(texts || []);
        } catch (err) {
          if (err?.response?.status === 403) {
            Swal.fire({
              icon: 'error',
              title: 'Permiso denegado',
              text: 'No tienes permisos para ver los textos de este bot.'
            });
          } else {
            console.error("Error cargando textos planos:", err);
          }
        }
      } catch (err) {
        // Handle not-found as creation flow: no bot to edit
        if (err && err.status === 404) {
          // silently switch to create mode
          setEditMode(false);
          setBot(null);
          // If bot not found, the URL id may actually be a template id (creation flow).
          // Try to load the template by that id so creation can proceed.
          (async () => {
            try {
              const tpl = await getBotTemplateById(botParamId);
              if (tpl) setTemplate(tpl);
            } catch (errTpl) {
              console.warn('No se pudo cargar la plantilla por id (fallback):', botParamId, errTpl);
            }
          })();
          return;
        }
        console.error("Error cargando bot:", err);
        // Si el error es 403, show permission alert and keep editMode false
        if (err && err.status === 403) {
          Swal.fire({
            icon: 'error',
            title: 'Permiso denegado',
            text: 'No tienes permisos para ver este bot.'
          });
        } else {
          // Generic fallback: switch to creation to avoid blocking the page
          setEditMode(false);
          setBot(null);
        }
      }
    };
    fetchBotData();
  }, [botParamId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "context") setTabIndex(1);
    else if (tab === "prompts") setTabIndex(0);
  }, [location.search]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          {editMode ? "Editar entrenamiento del Bot" : "Crear Bot desde Plantilla"}
        </SoftTypography>

        {/* Tabs para alternar entre secciones */}
        <Tabs
          value={tabIndex}
          onChange={(_, v) => setTabIndex(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Interacciones" />
          <Tab label="Contexto Adicional" disabled={!createdBotId && !editMode} />
        </Tabs>

        {/* Sección de Interacciones */}
        {tabIndex === 0 && (
          <InteractionsSection
            editMode={editMode}
            customPrompt={customPrompt}
            question={question}
            setQuestion={setQuestion}
            answer={answer}
            setAnswer={setAnswer}
            handleAddInteraction={handleAddInteraction}
            isAddingInteraction={isAddingInteraction}
            interactions={interactions}
            handleDeleteInteraction={handleDeleteInteraction}
            botName={botName}
            setBotName={setBotName}
            botDescription={botDescription}
            setBotDescription={setBotDescription}
            handleCreateBot={handleCreateBot}
            creatingBot={creatingBot}
            createdBotId={createdBotId}
            handleUpdateBot={handleUpdateBot}
            handleCancelEdit={handleCancelEdit}
          />
        )}

        {/* Sección de Contexto Adicional */}
        {tabIndex === 1 && (createdBotId || editMode) && (
          <Card sx={{ p: 3, mb: 4 }}>
            <SoftTypography variant="h6" mb={0.5}>2. Añade Contexto Adicional (Opcional)</SoftTypography>
            <SoftTypography variant="body2" color="text" mb={2}>Sube archivos, páginas web o texto para un conocimiento más profundo.</SoftTypography>

            {/* Archivos */}
            <FilesSection
              files={files}
              fileErrors={fileErrors}
              handleFileChange={handleFileChange}
              handleDeleteFile={handleDeleteFile}
              handleRetryFile={handleRetryFile}
              ALLOWED_FILE_TYPES={ALLOWED_FILE_TYPES}
            />

            {/* URLs */}
            <UrlsSection
              urls={urls}
              currentUrl={currentUrl}
              setCurrentUrl={setCurrentUrl}
              handleAddUrl={handleAddUrl}
              handleDeleteUrl={handleDeleteUrl}
            />

            {/* Textos planos editables */}
            <TextsSection
              texts={texts}
              currentText={currentText}
              setCurrentText={setCurrentText}
              handleAddText={handleAddText}
              handleDeleteText={handleDeleteText}
              setTexts={setTexts}
            />

            {/* Botón para pasar a la etapa de captación de datos */}
            <SoftBox display="flex" justifyContent="flex-end">
              <SoftButton
                variant="gradient"
                color="info"
                sx={{ mt: 3, fontWeight: 'bold', width: 260 }}
                onClick={() => navigate(`/bots/captured-data/${createdBotId || botParamId}`, { state: { botId: createdBotId || botParamId } })}
              >
                Continuar
              </SoftButton>
            </SoftBox>
          </Card>
        )}

      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
}

export default BotTraining;
