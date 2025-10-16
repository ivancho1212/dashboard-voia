import { getTemplateTrainingSessionsByTemplate } from "../../../services/templateTrainingSessionsService.js";
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
import { getTrainingTextsByTemplate, getTrainingTextsByBot, createTrainingCustomText } from "services/trainingCustomTextsService";


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

  // --- FUNCIONES DE VALIDACIÓN ---
  // --- CREAR BOT ---
  const handleCreateBot = async () => {
    try {
      setCreatingBot(true);
      // Construir el payload para crear el bot
      const botData = {
        name: botName,
        description: botDescription,
        iaProviderName,
        aiModelConfigName,
        // Puedes agregar más campos según el DTO requerido
      };
      const createdBot = await createBot(botData);
      setCreatedBotId(createdBot.id);
      Swal.fire({
        icon: 'success',
        title: 'Bot creado',
        text: 'El bot ha sido creado correctamente.'
      });
      setCreatingBot(false);
      // Opcional: Navegar o refrescar
      // navigate(`/bots/captured-data/${createdBot.id}`, { state: { botId: createdBot.id } });
    } catch (error) {
      setCreatingBot(false);
      Swal.fire({
        icon: 'error',
        title: 'Error al crear',
        text: error?.message || 'No se pudo crear el bot.'
      });
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
        iaProviderName,
        aiModelConfigName,
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
  const selectedFiles = Array.from(e.target.files);
  const newFiles = selectedFiles.filter((file) => validateFile(file, ALLOWED_FILE_TYPES, MAX_FILE_SIZE, setFileErrors));
  setFiles((prev) => [...prev, ...newFiles]);
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
        let validSessionId = null;
        if (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) {
          // Validar que la sesión pertenezca a la plantilla
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
        console.log('DEBUG payload URL:', payload);
        await createTrainingUrl(payload);
        setUrls((prev) => [...prev, { url: currentUrl }]);
        Swal.fire({ icon: 'success', title: 'URL añadida', text: 'La URL se guardó correctamente.' });
        setCurrentUrl("");
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
        let validSessionId = null;
        if (bot?.templateTrainingSessionId && Number.isInteger(bot?.templateTrainingSessionId)) {
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
        console.log('DEBUG payload TEXT:', payload);
        await createTrainingCustomText(payload);
        setTexts((prev) => [...prev, { content: currentText }]);
        Swal.fire({ icon: 'success', title: 'Texto añadido', text: 'El texto se guardó correctamente.' });
        setCurrentText("");
      } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error al guardar texto', text: error?.response?.data?.message || error?.message || 'No se pudo guardar el texto.' });
      }
    }
  }

  const handleAddInteraction = () => {
    if (!question.trim() || !answer.trim()) {
      Swal.fire("Campos incompletos", "La pregunta y la respuesta no pueden estar vacías.", "warning");
      return;
    }
    const newInteractions = [
      { id: `user-${Date.now()}`, role: "user", content: question },
      { id: `assistant-${Date.now()}`, role: "assistant", content: answer },
    ];
    setInteractions((prev) => [...prev, ...newInteractions]);
    setQuestion("");
    setAnswer("");
  };

  const handleDeleteInteraction = (index) => {
    const userPrompt = interactions[index];
    const assistantPrompt = interactions[index + 1];
    setInteractions((prev) => prev.filter((p) => p.id !== userPrompt.id && p.id !== assistantPrompt.id));
  };

  const handleDeleteFile = (fileToDelete) => {
    setFiles((prev) => prev.filter((file) => file !== fileToDelete));
    const newErrors = new Map(fileErrors);
    newErrors.delete(fileToDelete);
    setFileErrors(newErrors);
  };

  const handleDeleteUrl = (urlToDelete) => {
    setUrls((prev) => prev.filter((url) => url !== urlToDelete));
  };

  const handleDeleteText = (textToDelete) => {
    setTexts((prev) => prev.filter((text) => text !== textToDelete));
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
        console.error("Error cargando bot:", err);
        // Si el error es 403, no cambiar a modo creación
        if (err?.response?.status !== 403) {
          setEditMode(false);
          setBot(null);
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Permiso denegado',
            text: 'No tienes permisos para ver este bot.'
          });
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
            <SoftButton
              variant="gradient"
              color="info"
              fullWidth
              sx={{ mt: 3, fontWeight: 'bold' }}
              onClick={() => navigate(`/bots/captured-data/${createdBotId || botParamId}`, { state: { botId: createdBotId || botParamId } })}
            >
              Continuar
            </SoftButton>
          </Card>
        )}

      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
}

export default BotTraining;
