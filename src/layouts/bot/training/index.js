import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import {
  createTemplateTrainingSessionWithPrompts,
  createTrainingUrl,
  createTrainingCustomText,
  generateEmbeddings,
} from "services/templateTrainingService";
import { uploadFile } from "services/uploadedDocumentsService";
import { v4 as uuidv4 } from "uuid";
import { createBot } from "services/botService";
import Modal from "components/Modal";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

function BotTraining() {
  const { id } = useParams();
  const location = useLocation();
  const template = location.state?.template;

  const [interactions, setInteractions] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [link, setLink] = useState("");
  const [linkError, setLinkError] = useState("");
  const [linkType, setLinkType] = useState(null);
  const [promptSaved, setPromptSaved] = useState(false);
  const [attachmentsSaved, setAttachmentsSaved] = useState(false);
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [botName, setBotName] = useState("");
  const [creatingBot, setCreatingBot] = useState(false);
  const [botDescription, setBotDescription] = useState("");
  const [sessionId, setSessionId] = useState(null); // ✅ NUEVO

  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const maxFileSize = 5 * 1024 * 1024;

  const validateFile = (file) => {
    if (!file) return false;
    if (!allowedTypes.includes(file.type)) {
      setFileError("Tipo de archivo no permitido.");
      return false;
    }
    if (file.size > maxFileSize) {
      setFileError("El archivo excede el tamaño máximo permitido (5MB).");
      return false;
    }
    setFileError("");
    return true;
  };

  const validateLink = (link) => {
    if (!link) {
      setLinkError("");
      setLinkType(null);
      return true;
    }

    const urlPattern = /^(https?:\/\/)[^\s$.?#].[^\s]*$/i;
    const isValid = urlPattern.test(link);

    if (!isValid) {
      setLinkError("❌ La URL no es válida.");
      setLinkType(null);
      return false;
    }

    // 🚫 Filtrar enlaces no permitidos (Drive, Dropbox, PDF, etc.)
    const forbiddenPatterns = [
      "drive.google.com",
      "docs.google.com",
      "onedrive.live.com",
      "1drv.ms",
      "dropbox.com",
      "box.com",
      ".pdf",
    ];

    const lowerLink = link.toLowerCase();
    const isForbidden = forbiddenPatterns.some((pattern) => lowerLink.includes(pattern));

    if (isForbidden) {
      setLinkError(
        "❌ Solo se permiten enlaces a páginas web. No se permiten enlaces a documentos (Drive, Dropbox, PDF, etc.)"
      );
      setLinkType(null);
      return false;
    }

    setLinkType("Web");
    setLinkError("");
    return true;
  };

  const suggestedInteractions = [
    { question: "¿Qué es una tasación vehicular?" },
    { question: "¿Qué incluye el servicio de tasación?" },
    { question: "¿Ofrecen tasaciones virtuales o solo presenciales?" },
  ];

  const handleAddInteraction = () => {
    if (question.trim() && answer.trim()) {
      setInteractions((prev) => [
        ...prev,
        { role: "user", content: question },
        { role: "assistant", content: answer },
      ]);
      setQuestion("");
      setAnswer("");
      setPromptSaved(false);
    }
  };

  const handleSavePrompt = async () => {
    if (interactions.length === 0 && !text.trim()) {
      alert("Agrega al menos una interacción o texto plano.");
      return;
    }

    const allPrompts = [];

    if (text.trim()) {
      allPrompts.push({ role: "system", content: text.trim() });
    }

    allPrompts.push(...interactions.map(({ role, content }) => ({ role, content })));

    const promptText = allPrompts.map((i) => `${i.role}: ${i.content}`).join("\n");

    if (promptText.length > 3000) {
      alert("El prompt es demasiado largo (máximo 3000 caracteres). Reduce contenido.");
      return;
    }

    const sessionData = {
      botTemplateId: parseInt(id),
      sessionName: "Entrenamiento manual",
      description: "Entrenamiento creado desde el panel",
      prompts: allPrompts,
    };

    try {
      const response = await createTemplateTrainingSessionWithPrompts(sessionData);
      console.log("✅ Sesión creada con ID:", response.id);

      setPromptSaved(true);
      setSessionId(response.id); // ← ESTA línea es CLAVE
      alert("Sesión de entrenamiento guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar el entrenamiento:", error);
      alert("Error al guardar el entrenamiento. Revisa consola.");
    }
  };

  const handleSaveAttachments = async () => {
    if (!file && !link && !text.trim()) {
      alert("Debes añadir al menos un archivo, enlace o texto.");
      return;
    }

    try {
      if (file && !fileError) {
        await uploadFile(file, parseInt(id), 45);
      }

      if (link && !linkError) {
        await createTrainingUrl({ botTemplateId: parseInt(id), url: link, userId: 45 });
      }

      if (text.trim()) {
        await createTrainingCustomText({
          botTemplateId: parseInt(id),
          content: text.trim(),
          userId: 45,
        });
      }

      await generateEmbeddings(parseInt(id));
      setAttachmentsSaved(true);
      setShowModal(true);
    } catch (error) {
      console.error("Error al guardar adjuntos:", error);
      alert("Ocurrió un error al guardar los adjuntos.");
    }
  };

  const handleCreateBot = async (name, description) => {
    if (!sessionId) {
      alert("Primero debes guardar el entrenamiento.");
      return;
    }

    const botData = {
      name,
      description,
      botTemplateId: parseInt(id),
      apiKey: "test-avpi-1ksddffhctvwf-e1d7rbfgcjhmby5gvx5fftrss03sfgrfdrayv",
      isActive: true,
      templateTrainingSessionId: sessionId, // ✅ CLAVE PARA EVITAR EL ERROR
    };

    console.log("🟢 Datos enviados al backend:", botData);

    try {
      setCreatingBot(true);
      const bot = await createBot(botData);
      alert("Bot creado exitosamente");
      navigate(`/bots/captured-data/${bot.id}`);
    } catch (error) {
      console.error("❌ Error creando bot:", error.response?.data || error.message);
      alert("Error al crear el bot");
    } finally {
      setCreatingBot(false);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Entrenamiento del Bot: {template?.name || `ID ${id}`}
        </SoftTypography>

        {/* Sección: Preguntas estándar */}
        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h6" mb={2}>
            Preguntas Estándar
          </SoftTypography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SoftTypography variant="subtitle2" mb={1}>
                Selecciona una pregunta estándar
              </SoftTypography>
              <SoftBox
                component="select"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                sx={{
                  width: "100%",
                  p: 1.5,
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                  backgroundColor: "#fff",
                  outline: "none",
                }}
              >
                <option value="">-- Selecciona una pregunta --</option>
                {suggestedInteractions.map((item, idx) => (
                  <option key={idx} value={item.question}>
                    {item.question}
                  </option>
                ))}
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftTypography variant="subtitle2" mb={1}>
                Escribe la respuesta personalizada
              </SoftTypography>
              <SoftInput
                placeholder="Escribe la respuesta que quieres que dé el bot"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <SoftButton variant="gradient" color="info" onClick={handleAddInteraction} fullWidth>
                Añadir al Prompt
              </SoftButton>
            </Grid>
          </Grid>
        </Card>

        {/* Sección: Entradas manuales */}
        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h6" mb={2}>
            Entradas Manuales
          </SoftTypography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SoftTypography variant="subtitle2" mb={1}>
                Pregunta (Usuario)
              </SoftTypography>
              <SoftInput
                placeholder="Escribe la pregunta del usuario"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftTypography variant="subtitle2" mb={1}>
                Respuesta (Asistente)
              </SoftTypography>
              <SoftInput
                placeholder="Escribe la respuesta del asistente"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <SoftButton variant="gradient" color="info" onClick={handleAddInteraction} fullWidth>
                Añadir al Prompt
              </SoftButton>
            </Grid>
          </Grid>
        </Card>

        {/* Prompt Actual */}
        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h6" mb={2}>
            Prompt Actual
          </SoftTypography>

          {interactions.length === 0 ? (
            <SoftTypography variant="body2" color="textSecondary">
              Aún no has añadido interacciones.
            </SoftTypography>
          ) : (
            interactions.map((entry, index) => (
              <SoftBox
                key={index}
                mb={2}
                p={2}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <SoftTypography variant="caption" color="text">
                  <strong>{entry.role.toUpperCase()}:</strong>
                </SoftTypography>
                <SoftTypography variant="body2">{entry.content}</SoftTypography>
              </SoftBox>
            ))
          )}

          <SoftBox mt={2}>
            <SoftButton variant="gradient" color="info" onClick={handleSavePrompt} fullWidth>
              Guardar Prompt
            </SoftButton>

            {promptSaved && (
              <SoftTypography variant="caption" color="success" mt={1} ml={1}>
                Prompt guardado localmente ✔
              </SoftTypography>
            )}
          </SoftBox>
        </Card>

        {/* Documentos externos */}
        <Card sx={{ p: 3, mt: 4 }}>
          <SoftTypography variant="h6">Añadir Archivo o Enlace</SoftTypography>
          <SoftTypography variant="caption" gutterBottom>
            Adjunta un archivo o link para que el bot lo tome como contexto adicional.
          </SoftTypography>

          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={6}>
              <SoftBox
                sx={{
                  border: "2px dashed #9ca3af",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  height: "45px",
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  backgroundColor: "#f9fafb",
                }}
                onClick={() => document.getElementById("file-upload").click()}
              >
                <SoftTypography variant="body2" sx={{ color: "#6b7280" }}>
                  {file ? `Archivo: ${file.name}` : "Haz clic para subir archivo"}
                </SoftTypography>
              </SoftBox>

              <input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.xlsx"
                style={{ display: "none" }}
                onChange={(e) => {
                  const selectedFile = e.target.files[0];
                  if (validateFile(selectedFile)) {
                    setFile(selectedFile);
                    setFileError("");
                  } else {
                    setFile(null);
                    setFileError("Archivo no válido (PDF, DOCX, XLSX, máx. 5MB)");
                  }
                }}
              />

              {fileError && (
                <SoftTypography variant="caption" color="error" sx={{ mt: 1 }}>
                  {fileError}
                </SoftTypography>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftInput
                placeholder="Enlace a una página web (solo HTML)"
                value={link}
                onChange={(e) => {
                  const val = e.target.value;
                  setLink(val);
                  validateLink(val);
                }}
                sx={{ height: "45px", mb: 1 }}
              />
              <SoftTypography variant="caption" sx={{ mb: 1 }}>
                Ej: https://wikipedia.org, https://tublog.com/articulo
              </SoftTypography>

              {linkType && (
                <SoftTypography variant="caption" color="info.main">
                  🔗 Enlace detectado como Página Web
                </SoftTypography>
              )}

              {linkError && (
                <SoftTypography variant="caption" color="error">
                  {linkError}
                </SoftTypography>
              )}
            </Grid>
          </Grid>

          <SoftTypography variant="subtitle2" mb={1}>
            Texto plano para entrenamiento
          </SoftTypography>
          <SoftBox
            component="textarea"
            rows={8}
            placeholder="Escribe aquí el contenido relevante para el entrenamiento del bot..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            sx={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              fontSize: "14px",
              backgroundColor: "#fff",
              outline: "none",
              resize: "vertical",
            }}
          />

          <SoftBox mt={2}>
            <SoftButton variant="gradient" color="info" onClick={handleSaveAttachments}>
              Guardar y Continuar
            </SoftButton>
            {attachmentsSaved && (
              <SoftTypography variant="caption" color="success" ml={2}>
                Adjuntos listos ✔
              </SoftTypography>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <SoftBox p={3}>
            <SoftTypography variant="h6" mb={1}>
              Nombre del Bot
            </SoftTypography>
            <SoftInput
              value={botName}
              onChange={(e) => setBotName(e.target.value)}
              placeholder="Ej: Bot Asistente Médico"
              fullWidth
              sx={{ mb: 2 }}
            />

            <SoftTypography variant="subtitle2" mb={1}>
              Descripción (opcional)
            </SoftTypography>
            <SoftInput
              value={botDescription}
              onChange={(e) => setBotDescription(e.target.value)}
              placeholder="Ej: Este bot se encarga de responder consultas médicas básicas"
              fullWidth
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            <SoftButton
              variant="gradient"
              color="info"
              onClick={() => handleCreateBot(botName, botDescription)}
              disabled={!botName.trim() || creatingBot}
              fullWidth
            >
              {creatingBot ? "Creando..." : "Crear y continuar"}
            </SoftButton>
          </SoftBox>
        </Modal>
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default BotTraining;
