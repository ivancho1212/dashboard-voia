import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  createBotCustomPrompt,
} from "services/botCustomPromptsService";
import { Select, MenuItem } from "@mui/material";
import { createTrainingUrl } from "services/trainingUrlsService";
import { createTrainingCustomText } from "services/trainingCustomTextsService";
import { uploadFile } from "services/uploadedDocumentsService";
import { createBot, deleteBot } from "services/botService";
import { getBotTemplateById } from "services/botTemplateService";
import { getIaProviders } from "services/botIaProviderService";
import { getModelConfigsByProvider } from "services/aiModelConfigService";
import { useAuth } from "auth-context/index";
import Swal from "sweetalert2";

// Componentes de Material UI y Soft UI
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

function BotTraining() {
  const { id: botTemplateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;

  // Estados para la template y datos básicos
  const [template, setTemplate] = useState(location.state?.template || null);
  const [botName, setBotName] = useState("");
  const [botDescription, setBotDescription] = useState("");
  const [iaProviderName, setIaProviderName] = useState("Cargando...");
  const [aiModelConfigName, setAiModelConfigName] = useState("Cargando...");

  // Estados para prompts y interacciones
  const [interactions, setInteractions] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAddingInteraction, setIsAddingInteraction] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Estados para archivos y documentos
  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [texts, setTexts] = useState([]);
  const [fileErrors, setFileErrors] = useState(new Map());
  const [urlErrors, setUrlErrors] = useState(new Map());
  const [textErrors, setTextErrors] = useState(new Map());
  const [currentUrl, setCurrentUrl] = useState("");
  const [currentText, setCurrentText] = useState("");
  const [savingAttachments, setSavingAttachments] = useState(false);

  // Estado general
  const [loading, setLoading] = useState(true);
  const [creatingBot, setCreatingBot] = useState(false);

  // Constantes
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_FILE_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  };

  // Carga inicial de datos
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!botTemplateId) return;

      console.log(`[LOG] Cargando datos para BotTemplate ID: ${botTemplateId}`);

      try {
        if (!template) {
          const fetchedTemplate = await getBotTemplateById(botTemplateId);
          setTemplate(fetchedTemplate);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
        Swal.fire("Error", "No se pudo cargar la información de la plantilla.", "error");
      }
    };
    fetchInitialData();
  }, [botTemplateId, template]);

  useEffect(() => {
    if (template) {
      setBotName(template.name ? `${template.name} Clone` : "");
      setBotDescription(template.description || "");
      const fetchIaDetails = async () => {
        if (!template.iaProviderId) return;
        try {
          const providers = await getIaProviders();
          const provider = providers.find((p) => p.id === template.iaProviderId);
          setIaProviderName(provider?.name || "N/A");
          if (template.aiModelConfigId) {
            const models = await getModelConfigsByProvider(template.iaProviderId);
            const model = models.find((m) => m.id === template.aiModelConfigId);
            setAiModelConfigName(model?.modelName || "Sin modelo");
          } else {
            setAiModelConfigName("Sin modelo");
          }
        } catch (error) {
          console.error("Error fetching IA details:", error);
          setIaProviderName("N/A");
          setAiModelConfigName("N/A");
        }
      };
      fetchIaDetails();
    }
  }, [template]);

  // Función para asegurar sessionId
  const ensureSessionId = async () => {
    if (!sessionId) {
      try {
        const newSessionId = Date.now().toString();
        setSessionId(newSessionId);
        return newSessionId;
      } catch (error) {
        console.error("Error generating session ID:", error);
        Swal.fire("Error", "No se pudo generar ID de sesión", "error");
        return null;
      }
    }
    return sessionId;
  };

  // Validaciones
  const validateFile = (file) => {
    const newErrors = new Map(fileErrors);
    let isValid = true;
    if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
      newErrors.set(file, "Tipo de archivo no permitido. Solo se aceptan PDF, DOCX, XLSX.");
      isValid = false;
    } else if (file.size > MAX_FILE_SIZE) {
      newErrors.set(file, "El archivo excede el tamaño máximo de 5MB.");
      isValid = false;
    } else {
      newErrors.delete(file);
    }
    setFileErrors(newErrors);
    return isValid;
  };

  const validateUrl = (url) => {
    if (!url) return false;
    
    const urlPattern = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
    const isValid = urlPattern.test(url);
    
    if (!isValid) {
      setUrlErrors(new Map([...urlErrors, [url, "URL inválida"]]));
      return false;
    }

    // Filtrar enlaces no permitidos
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
    const isForbidden = forbiddenPatterns.some((pattern) => lowerUrl.includes(pattern));

    if (isForbidden) {
      setUrlErrors(new Map([...urlErrors, [url, "Este tipo de enlace no está permitido"]]));
      return false;
    }

    const newUrlErrors = new Map(urlErrors);
    newUrlErrors.delete(url);
    setUrlErrors(newUrlErrors);
    return true;
  };

  // Handlers
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = [];
    selectedFiles.forEach(file => {
      if (validateFile(file)) {
        newFiles.push(file);
      }
    });
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleAddUrl = () => {
    if (currentUrl && validateUrl(currentUrl)) {
      setUrls(prev => [...prev, currentUrl]);
      setCurrentUrl("");
    }
  };

  const handleAddText = () => {
    if (currentText) {
      setTexts(prev => [...prev, currentText]);
      setCurrentText("");
    }
  };

  const handleAddInteraction = () => {
    if (!question.trim() || !answer.trim()) {
      Swal.fire("Campos incompletos", "La pregunta y la respuesta no pueden estar vacías.", "warning");
      return;
    }
    const newInteractions = [
      { id: `local-${Date.now()}-user`, role: "user", content: question },
      { id: `local-${Date.now()}-assistant`, role: "assistant", content: answer },
    ];
    setInteractions(prev => [...prev, ...newInteractions]);
    setQuestion("");
    setAnswer("");
  };

  const handleDeleteInteraction = (index) => {
    const userPrompt = interactions[index];
    const assistantPrompt = interactions[index + 1];
    setInteractions(prev => prev.filter(p => p.id !== userPrompt.id && p.id !== assistantPrompt.id));
  };

  const handleDeleteFile = (fileToDelete) => {
    setFiles(prev => prev.filter(file => file !== fileToDelete));
    const newErrors = new Map(fileErrors);
    newErrors.delete(fileToDelete);
    setFileErrors(newErrors);
  };

  const handleDeleteUrl = (urlToDelete) => {
    setUrls(prev => prev.filter(url => url !== urlToDelete));
  };

  const handleDeleteText = (textToDelete) => {
    setTexts(prev => prev.filter(text => text !== textToDelete));
  };

  const validateInputs = () => {
    if (!botName.trim()) {
      throw new Error("Debes darle un nombre a tu bot.");
    }

    const totalContextItems = interactions.length / 2 + files.length + urls.length + texts.length;
    if (totalContextItems === 0) {
      throw new Error("Debes añadir al menos una interacción, archivo, enlace o texto para entrenar a tu bot.");
    }
  };

  const prepareUploads = async (botId) => {
    const uploadPromises = [];
    
    // Subir archivos
    for (const file of files) {
      uploadPromises.push(uploadFile(file, botId, userId, null));
    }
    
    // Subir URLs
    for (const url of urls) {
      uploadPromises.push(createTrainingUrl({ 
        botId, 
        url,
        userId 
      }));
    }
    
    // Subir textos
    for (const text of texts) {
      uploadPromises.push(createTrainingCustomText({ 
        botId, 
        botTemplateId: parseInt(botTemplateId),
        userId, 
        content: text 
      }));
    }

    return uploadPromises;
  };

  const uploadPrompts = async (botId) => {
    for (let i = 0; i < interactions.length; i += 2) {
      const userInteraction = interactions[i];
      const assistantInteraction = interactions[i + 1];
      
      await createBotCustomPrompt({ 
        botId, 
        role: 'user', 
        content: userInteraction.content 
      });
      
      await createBotCustomPrompt({ 
        botId, 
        role: 'assistant', 
        content: assistantInteraction.content 
      });
    }
  };

  const handleCreateBot = async () => {
    setCreatingBot(true);
    let newBotId = null;

    try {
      // Validar entradas
      validateInputs();

      // Validar archivos y URLs
      for (const file of files) {
        if (!validateFile(file)) {
          throw new Error(`Archivo inválido: ${file.name}`);
        }
      }

      for (const url of urls) {
        if (!validateUrl(url)) {
          throw new Error(`URL inválida: ${url}`);
        }
      }

      // Crear arrays para almacenar las promesas de subida
      const fileUploads = [];
      const urlUploads = [];
      const textUploads = [];
      const promptUploads = [];

      // No preparamos las subidas de archivos aquí, las haremos después de crear el bot
      
      // Verificar que tenemos el ID de template
      if (!botTemplateId) {
        throw new Error('No se ha proporcionado el ID de la plantilla');
      }

      console.log('ID de plantilla verificado:', botTemplateId);

      // Crear el bot
      const botData = {
        name: botName.trim(),
        description: botDescription.trim(),
        botTemplateId: parseInt(botTemplateId),
        apiKey: `live-bot-${Math.random().toString(36).substring(2, 15)}`,
        isActive: true,
        userId
      };

      console.log('Creando bot con datos:', botData);
      const newBot = await createBot(botData);

      if (!newBot || !newBot.id) {
        throw new Error('No se pudo obtener el ID del bot creado');
      }

      newBotId = newBot.id;
      console.log('Bot creado con ID:', newBotId);

      // Primero subimos los archivos de forma secuencial
      console.log('Iniciando subida de archivos...');
      for (const file of files) {
        try {
          console.log(`Subiendo archivo ${file.name} para bot ${newBotId}`);
          await uploadFile(file, newBotId, userId);
        } catch (error) {
          console.error(`Error al subir archivo ${file.name}:`, error);
          throw error;
        }
      }
      console.log('Subida de archivos completada');

      // Subir URLs
      console.log('Subiendo URLs...');
      for (const url of urls) {
        try {
          await createTrainingUrl({
            url: url,
            botId: newBotId,
            botTemplateId: parseInt(botTemplateId),
            userId: userId
          });
        } catch (error) {
          console.error(`Error al subir URL ${url}:`, error);
          throw error;
        }
      }

      // Subir textos
      console.log('Subiendo textos personalizados...');
      for (const text of texts) {
        try {
          await createTrainingCustomText({
            content: text,
            botId: newBotId,
            botTemplateId: parseInt(botTemplateId),
            userId: userId
          });
        } catch (error) {
          console.error(`Error al subir texto:`, error);
          throw error;
        }
      }

      // Subir prompts
      console.log('Subiendo prompts...');
      for (let i = 0; i < interactions.length; i += 2) {
        try {
          const userPrompt = interactions[i];
          const assistantPrompt = interactions[i + 1];

          if (!newBotId) {
            console.error('No hay ID de bot disponible para crear los prompts');
            throw new Error('No hay ID de bot disponible');
          }

          const userPromptData = {
            BotId: newBotId,
            BotTemplateId: parseInt(botTemplateId),
            Role: 'user',
            Content: userPrompt.content
          };
          console.log('Creando prompt de usuario con datos:', userPromptData);
          await createBotCustomPrompt(userPromptData);

          const assistantPromptData = {
            BotId: newBotId,
            BotTemplateId: parseInt(botTemplateId),
            Role: 'assistant',
            Content: assistantPrompt.content
          };
          console.log('Creando prompt de asistente con datos:', assistantPromptData);
          await createBotCustomPrompt(assistantPromptData);
        } catch (error) {
          console.error('Error al crear prompts:', error);
          throw error;
        }
      }

      await Swal.fire("¡Éxito!", "Bot creado y entrenado correctamente.", "success");
      navigate(`/bots/captured-data/${newBotId}`);
    } catch (error) {
      console.error('❌ Error durante la creación o subida de datos:', error);
      
      if (newBotId) {
        try {
          await deleteBot(newBotId);
          console.log('Bot eliminado después del error:', newBotId);
        } catch (rollbackError) {
          console.error(`❌ Error en el rollback del bot ${newBotId}:`, rollbackError);
        }
      }

      const errorMsg = error.response?.data?.message || error.message || "Ocurrió un error inesperado.";
      await Swal.fire("Error en la Creación", `No se pudo crear el bot. ${errorMsg}`, "error");
    } finally {
      setCreatingBot(false);
    }
  };
   

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>Crear Bot desde Plantilla</SoftTypography>

        {template && (
          <Card sx={{ p: 3, mb: 4 }}>
            <SoftTypography variant="h6" mb={2}>Detalles de la Plantilla Base</SoftTypography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><SoftTypography variant="body2"><strong>Nombre:</strong> {template.name || "N/A"}</SoftTypography></Grid>
              <Grid item xs={12}><SoftTypography variant="body2"><strong>Descripción:</strong> {template.description || "N/A"}</SoftTypography></Grid>
              <Grid item xs={12} sm={6}><SoftTypography variant="body2"><strong>Proveedor IA:</strong> {iaProviderName}</SoftTypography></Grid>
              <Grid item xs={12} sm={6}><SoftTypography variant="body2"><strong>Modelo IA:</strong> {aiModelConfigName}</SoftTypography></Grid>
            </Grid>
          </Card>
        )}

        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h6" mb={0.5}>1. Entrena con Interacciones</SoftTypography>
          <SoftTypography variant="body2" color="text" mb={2}>Añade ejemplos de preguntas y respuestas para guiar al bot.</SoftTypography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <SoftTypography variant="subtitle2" mb={1}>Pregunta (Usuario)</SoftTypography>
              <Select
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                displayEmpty
                fullWidth
                MenuProps={{
                  PaperProps: {
                    style: { maxHeight: 200, overflowY: "auto" },
                  },
                }}
                sx={{
                  borderRadius: "8px",
                  "& .MuiSelect-select": { padding: "10px" },
                }}
              >
                <MenuItem value="">Escribe o selecciona una pregunta...</MenuItem>
                <MenuItem value="¿Cuál es el horario de atención?">¿Cuál es el horario de atención?</MenuItem>
                <MenuItem value="¿Cómo puedo contactar soporte?">¿Cómo puedo contactar soporte?</MenuItem>
                <MenuItem value="¿Qué servicios ofrecen?">¿Qué servicios ofrecen?</MenuItem>
                <MenuItem value="¿Dónde están ubicados?">¿Dónde están ubicados?</MenuItem>
                <MenuItem value="¿Cuáles son los medios de pago aceptados?">¿Cuáles son los medios de pago aceptados?</MenuItem>
                <MenuItem value="¿Ofrecen soporte en línea?">¿Ofrecen soporte en línea?</MenuItem>
                <MenuItem value="¿Tienen garantía en sus productos/servicios?">¿Tienen garantía en sus productos/servicios?</MenuItem>
                <MenuItem value="¿Cómo puedo agendar una cita?">¿Cómo puedo agendar una cita?</MenuItem>
                <MenuItem value="¿Realizan envíos a domicilio?">¿Realizan envíos a domicilio?</MenuItem>
                <MenuItem value="¿Cuál es el tiempo de entrega?">¿Cuál es el tiempo de entrega?</MenuItem>
                <MenuItem value="¿Tienen algún número de WhatsApp?">¿Tienen algún número de WhatsApp?</MenuItem>
                <MenuItem value="¿Puedo solicitar una cotización?">¿Puedo solicitar una cotización?</MenuItem>
                <MenuItem value="¿Trabajan los fines de semana?">¿Trabajan los fines de semana?</MenuItem>
                <MenuItem value="¿Cómo puedo registrarme en la plataforma?">¿Cómo puedo registrarme en la plataforma?</MenuItem>
                <MenuItem value="¿Dónde puedo ver sus precios?">¿Dónde puedo ver sus precios?</MenuItem>
                <MenuItem value="¿Ofrecen descuentos o promociones?">¿Ofrecen descuentos o promociones?</MenuItem>
                <MenuItem value="¿Qué debo hacer si tengo un problema con mi pedido?">¿Qué debo hacer si tengo un problema con mi pedido?</MenuItem>
                <MenuItem value="¿Tienen atención personalizada?">¿Tienen atención personalizada?</MenuItem>
                <MenuItem value="¿Cómo puedo cancelar un pedido?">¿Cómo puedo cancelar un pedido?</MenuItem>
                <MenuItem value="¿Puedo cambiar un producto o servicio?">¿Puedo cambiar un producto o servicio?</MenuItem>
                <MenuItem value="¿Qué documentos necesito para contratar el servicio?">¿Qué documentos necesito para contratar el servicio?</MenuItem>
                <MenuItem value="¿Cuál es la política de devoluciones?">¿Cuál es la política de devoluciones?</MenuItem>
                <MenuItem value="¿Cómo funcionan los planes de suscripción?">¿Cómo funcionan los planes de suscripción?</MenuItem>
              </Select>
            </Grid>

            <Grid item xs={12} container spacing={2}>
              <Grid item xs={12} md={6}>
                <SoftInput
                  placeholder="O escribe tu propia pregunta"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <SoftInput
                  label="Respuesta (Asistente)"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>
          </Grid>

          <SoftButton variant="gradient" color="info" onClick={handleAddInteraction} disabled={isAddingInteraction} fullWidth sx={{ mt: 2 }}>
            <Icon>add</Icon>&nbsp;{isAddingInteraction ? "Agregando..." : "Agregar Interacción"}
          </SoftButton>

          {interactions.length > 0 && (
            <SoftBox mt={3}>
              <SoftTypography variant="subtitle2">Interacciones Guardadas</SoftTypography>
              {interactions.map((item, index) => (index % 2 === 0 && (
                <SoftBox key={item.id} my={1} p={1.5} sx={{ border: "1px solid #eee", borderRadius: "8px", background: "#f9f9f9" }}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start">
                    <SoftBox>
                      <SoftTypography variant="caption" fontWeight="bold" color="info">USER:</SoftTypography>
                      <SoftTypography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.content}</SoftTypography>
                      {interactions[index + 1] && (<><SoftTypography variant="caption" fontWeight="bold" color="success" mt={1}>ASSISTANT:</SoftTypography><SoftTypography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{interactions[index + 1].content}</SoftTypography></>)}
                    </SoftBox>
                    <Icon fontSize="small" color="error" onClick={() => handleDeleteInteraction(index)} sx={{ cursor: "pointer", mt: 0.5 }}>close</Icon>
                  </SoftBox>
                </SoftBox>
              )))}
            </SoftBox>
          )}
        </Card>

        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h6" mb={0.5}>2. Añade Contexto Adicional (Opcional)</SoftTypography>
          <SoftTypography variant="body2" color="text" mb={2}>Sube archivos, páginas web o texto para un conocimiento más profundo.</SoftTypography>

          <SoftTypography variant="subtitle1" mb={1}>Archivos (PDF, DOCX, XLSX)</SoftTypography>
          <SoftBox mb={2}>
            <SoftButton variant="outlined" color="info" component="label" fullWidth>
              Seleccionar Archivos (Max 5MB)
              <input type="file" multiple hidden onChange={handleFileChange} accept={Object.keys(ALLOWED_FILE_TYPES).join(",")} />
            </SoftButton>
            <SoftBox mt={2}>
              {files.map((file) => (
                <SoftBox key={file.name} p={1} mb={1} sx={{ border: "1px solid", borderColor: fileErrors.has(file) ? "error.main" : "grey.300", borderRadius: "8px" }}>
                  <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                    <SoftTypography variant="body2">{file.name}</SoftTypography>
                    <Icon fontSize="small" color="error" onClick={() => handleDeleteFile(file)} sx={{ cursor: "pointer" }}>close</Icon>
                  </SoftBox>
                  {fileErrors.has(file) && <SoftTypography variant="caption" color="error" mt={0.5}>{fileErrors.get(file)}</SoftTypography>}
                </SoftBox>
              ))}
            </SoftBox>
          </SoftBox>

          <SoftTypography variant="subtitle1" mb={1}>Páginas Web</SoftTypography>
          <SoftBox display="flex" mb={2}>
            <SoftInput placeholder="https://ejemplo.com/info" value={currentUrl} onChange={(e) => setCurrentUrl(e.target.value)} fullWidth />
            <SoftButton variant="gradient" color="info" onClick={handleAddUrl} sx={{ ml: 1, flexShrink: 0 }}>Añadir</SoftButton>
          </SoftBox>
          <SoftBox mt={1}>
            {urls.map((url) => (
              <SoftBox key={url} p={1} mb={1} sx={{ border: "1px solid", borderColor: "grey.300", borderRadius: "8px" }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                  <SoftTypography variant="body2" sx={{ wordBreak: "break-all" }}>{url}</SoftTypography>
                  <Icon fontSize="small" color="error" onClick={() => handleDeleteUrl(url)} sx={{ cursor: "pointer" }}>close</Icon>
                </SoftBox>
              </SoftBox>
            ))}
          </SoftBox>

          <SoftTypography variant="subtitle1" mb={1}>Texto Plano</SoftTypography>
          <SoftBox mb={2}>
            <SoftBox component="textarea" rows={5} placeholder="Pega aquí fragmentos de texto relevantes..." value={currentText} onChange={(e) => setCurrentText(e.target.value)} sx={{ width: "100%", p: "12px", borderRadius: "8px", border: "1px solid", borderColor: "grey.300", fontSize: "14px", outline: "none" }} />
            <SoftButton variant="gradient" color="info" onClick={handleAddText} sx={{ mt: 1 }} fullWidth>Añadir Texto</SoftButton>
          </SoftBox>
          <SoftBox mt={1}>
            {texts.map((text) => (
              <SoftBox key={text} p={1} mb={1} sx={{ border: "1px solid", borderColor: "grey.300", borderRadius: "8px" }}>
                <SoftBox display="flex" justifyContent="space-between" alignItems="center">
                  <SoftTypography variant="body2">{text.substring(0, 100)}...</SoftTypography>
                  <Icon fontSize="small" color="error" onClick={() => handleDeleteText(text)} sx={{ cursor: "pointer" }}>close</Icon>
                </SoftBox>
              </SoftBox>
            ))}
          </SoftBox>
        </Card>

        <Card sx={{ p: 3, mt: 4 }}>
          <SoftTypography variant="h6" mb={2}>3. Nombra y Crea tu Bot</SoftTypography>
          <SoftInput value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Ej: Asistente de Ventas" fullWidth sx={{ mb: 2 }} />
          <SoftInput value={botDescription} onChange={(e) => setBotDescription(e.target.value)} placeholder="Descripción (opcional)" fullWidth multiline rows={2} sx={{ mb: 2 }} />
          <SoftButton variant="gradient" color="success" onClick={handleCreateBot} disabled={creatingBot} fullWidth size="large">
            {creatingBot ? "Creando y Entrenando..." : "Crear Bot"}
          </SoftButton>
        </Card>

      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotTraining;