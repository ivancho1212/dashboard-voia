import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";
import {
  createTemplateTrainingSessionWithPrompts,
  generateEmbeddings,
} from "services/templateTrainingService";

import { createTrainingUrl } from "services/trainingUrlsService";
import { createTrainingCustomText } from "services/trainingCustomTextsService";

import { uploadFile } from "services/uploadedDocumentsService";
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
import Swal from "sweetalert2";

import {
  getUploadedDocumentsByTemplate,
  deleteUploadedDocument,
} from "services/uploadedDocumentsService";

import { getTrainingUrlsByTemplate, deleteTrainingUrl } from "services/trainingUrlsService";

import {
  getTrainingTextsByTemplate,
  deleteTrainingText,
} from "services/trainingCustomTextsService";
import { useAuth } from "contexts/AuthContext";

function BotTraining() {
  const { id } = useParams();
  const location = useLocation();
  const template = location.state?.template;
  const { user } = useAuth();
  const userId = user?.id;

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

  useEffect(() => {
    fetchExistingData();
  }, []);

  const [showModal, setShowModal] = useState(false);
  const [botName, setBotName] = useState("");
  const [creatingBot, setCreatingBot] = useState(false);
  const [botDescription, setBotDescription] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const [files, setFiles] = useState([]);
  const [urls, setUrls] = useState([]);
  const [texts, setTexts] = useState([]);

  const [savingAttachments, setSavingAttachments] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchExistingData();
      setLoading(false);
    };
    loadData();
  }, []);

  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const maxFileSize = 5 * 1024 * 1024;

  const fetchExistingData = async () => {
    try {
      const docs = await getUploadedDocumentsByTemplate(id);
      const urlList = await getTrainingUrlsByTemplate(id);
      const textList = await getTrainingTextsByTemplate(id);

      setFiles(docs);
      setUrls(urlList);
      setTexts(textList);
    } catch (error) {
      console.error("❌ Error cargando datos adjuntos:", error);
    }
  };

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
  // 🔹 Nueva función para asegurar sessionId
  const ensureSessionId = async () => {
    if (!sessionId) {
      try {
        const response = await createTemplateTrainingSessionWithPrompts({
          botTemplateId: parseInt(id),
          sessionName: "Sesión automática",
          description: "Generada automáticamente al agregar adjuntos",
          prompts: [],
        });
        setSessionId(response.id);
        return response.id;
      } catch (error) {
        console.error("Error creando sesión automática:", error);
        alert("❌ No se pudo crear sesión para guardar adjuntos.");
        return null;
      }
    }
    return sessionId;
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

    // 🔹 Nos aseguramos de tener un sessionId válido
    const sid = await ensureSessionId();
    if (!sid) return; // Detiene si no se pudo crear sesión

    const sessionData = {
      botTemplateId: parseInt(id),
      sessionName: "Entrenamiento manual",
      description: "Entrenamiento creado desde el panel",
      prompts: allPrompts,
      templateTrainingSessionId: sid, // <-- asociamos a la sesión existente
    };

    try {
      // Aquí llamamos al endpoint de prompts, usando el sid
      const response = await createTemplateTrainingSessionWithPrompts(sessionData);

      setPromptSaved(true);
      setSessionId(response.id); // actualizamos por si es la primera vez
      alert("Sesión de entrenamiento guardada correctamente.");
    } catch (error) {
      console.error("Error al guardar el entrenamiento:", error);
      alert("Error al guardar el entrenamiento. Revisa consola.");
    }
  };

  const hasValidInputs = () => {
    const isFileValid = file && !fileError;
    const isLinkValid = link && !linkError;
    const isTextValid = text.trim() !== "";
    return isFileValid || isLinkValid || isTextValid;
  };

  const handleSaveAttachments = async () => {
    if (!userId) {
      alert("⚠️ Debes iniciar sesión para guardar adjuntos.");
      return;
    }

    if (!hasValidInputs()) {
      alert("⚠️ Debes adjuntar al menos un archivo, un enlace o un texto válido.");
      return;
    }

    // 🔹 Nos aseguramos de tener un sessionId válido
    const sid = await ensureSessionId();
    if (!sid) return;

    try {
      setSavingAttachments(true);
      let hasChanges = false;

      // 🗂️ Archivo
      if (file && !fileError) {
        const exists = files.some((f) => f.fileName === file.name);
        if (!exists) {
          try {
            await uploadFile(file, parseInt(id), userId, sid);
            hasChanges = true;
            // Actualizamos la lista local
            setFiles((prev) => [...prev, { fileName: file.name }]);
            setFile(null); // Limpiar input
          } catch (uploadError) {
            console.error("❌ Error al subir archivo:", uploadError);
            Swal.fire({
              icon: "error",
              title: "Archivo inválido",
              text:
                uploadError?.response?.data?.message ||
                "No se pudo procesar el archivo. Puede estar cifrado o corrupto.",
            });
          }
        } else {
          console.warn("Archivo ya existe:", file.name);
        }
      }

      // 🔗 Enlace
      if (link && !linkError) {
        const exists = urls.some((u) => u.url === link);
        if (!exists) {
          await createTrainingUrl({
            botTemplateId: parseInt(id),
            url: link,
            userId: userId,
            templateTrainingSessionId: sid,
          });
          hasChanges = true;
          setUrls((prev) => [...prev, { url: link }]);
          setLink(""); // Limpiar input
        } else {
          console.warn("Enlace ya existe:", link);
        }
      }

      // ✍️ Texto
      if (text.trim()) {
        const exists = texts.some((t) => t.content === text.trim());
        if (!exists) {
          await createTrainingCustomText({
            botTemplateId: parseInt(id),
            content: text.trim(),
            userId: userId,
            templateTrainingSessionId: sid,
          });
          hasChanges = true;
          setTexts((prev) => [...prev, { content: text.trim() }]);
          setText(""); // Limpiar textarea
        } else {
          console.warn("Texto ya existe:", text.trim());
        }
      }

      if (hasChanges) {
        setAttachmentsSaved(true);
        alert("✅ Adjuntos guardados correctamente.");
        setShowModal(true);
      } else {
        alert("⚠️ No se agregaron nuevos datos. Todo ya existía previamente.");
      }
    } catch (error) {
      console.error("❌ Error al guardar adjuntos:", error);
      alert("❌ Ocurrió un error al guardar los adjuntos. Revisa la consola.");
    } finally {
      setSavingAttachments(false);
    }
  };

  const handleCreateBot = async (name, description) => {
    if (!sessionId) {
      alert("⚠️ Primero debes guardar el entrenamiento (prompt).");
      return;
    }

    if (!name.trim()) {
      alert("⚠️ El nombre del bot no puede estar vacío.");
      return;
    }

    const botData = {
      name: name.trim(),
      description: description.trim(),
      botTemplateId: parseInt(id),
      apiKey: `test-havevpi-${Math.random().toString(36).substring(2, 15)}`,
      isActive: true,
      templateTrainingSessionId: sessionId,
    };

    try {
      setCreatingBot(true);
      const bot = await createBot(botData);
      alert("🎉 Bot creado exitosamente.");
      navigate(`/bots/captured-data/${bot.id}`);
    } catch (error) {
      console.error("❌ Error creando bot:", error.response?.data || error.message);
      alert(
        error.response?.data?.message ||
        "❌ Ocurrió un error al crear el bot. Revisa consola para más detalles."
      );
    } finally {
      setCreatingBot(false);
    }
  };

  const handleDeleteFile = async (id) => {
    try {
      await deleteUploadedDocument(id);
      setFiles(files.filter((f) => f.id !== id));
    } catch (error) {
      console.error("Error eliminando archivo:", error);
      alert("❌ No se pudo eliminar el archivo.");
    }
  };

  const handleDeleteUrl = async (urlId) => {
    try {
      await deleteTrainingUrl(urlId);
      setUrls(urls.filter((u) => u.id !== urlId));
    } catch (error) {
      console.error("Error eliminando URL:", error);
      alert("❌ No se pudo eliminar el enlace.");
    }
  };

  const handleDeleteText = async (textId) => {
    try {
      await deleteTrainingText(textId);
      setTexts(texts.filter((t) => t.id !== textId));
    } catch (error) {
      console.error("Error eliminando texto:", error);
      alert("❌ No se pudo eliminar el texto.");
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
        <SoftTypography variant="h6" mt={4} mb={1}>
          Documentos, Enlaces y Textos Almacenados
        </SoftTypography>

        {loading ? (
          <SoftTypography variant="body2" color="textSecondary">
            ⏳ Cargando datos...
          </SoftTypography>
        ) : (
          <>
            {/* Archivos */}
            {files.length > 0 && (
              <Card sx={{ p: 2, mb: 2 }}>
                <SoftTypography variant="subtitle2" mb={1}>
                  📄 Archivos
                </SoftTypography>
                {files.map((file) => (
                  <SoftBox
                    key={file.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                    p={1}
                    sx={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  >
                    <SoftTypography variant="body2">{file.fileName}</SoftTypography>
                    <SoftButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteFile(file.id)}
                    >
                      Eliminar
                    </SoftButton>
                  </SoftBox>
                ))}
              </Card>
            )}

            {/* Enlaces */}
            {urls.length > 0 && (
              <Card sx={{ p: 2, mb: 2 }}>
                <SoftTypography variant="subtitle2" mb={1}>
                  🔗 Enlaces
                </SoftTypography>
                {urls.map((url) => (
                  <SoftBox
                    key={url.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                    p={1}
                    sx={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  >
                    <a href={url.url} target="_blank" rel="noopener noreferrer">
                      {url.url}
                    </a>
                    <SoftButton size="small" color="error" onClick={() => handleDeleteUrl(url.id)}>
                      Eliminar
                    </SoftButton>
                  </SoftBox>
                ))}
              </Card>
            )}

            {/* Textos */}
            {texts.length > 0 && (
              <Card sx={{ p: 2, mb: 2 }}>
                <SoftTypography variant="subtitle2" mb={1}>
                  📝 Textos
                </SoftTypography>
                {texts.map((txt) => (
                  <SoftBox
                    key={txt.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                    p={1}
                    sx={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  >
                    <SoftTypography variant="body2" sx={{ maxWidth: "70%" }}>
                      {txt.content.length > 80 ? txt.content.slice(0, 80) + "..." : txt.content}
                    </SoftTypography>
                    <SoftButton size="small" color="error" onClick={() => handleDeleteText(txt.id)}>
                      Eliminar
                    </SoftButton>
                  </SoftBox>
                ))}
              </Card>
            )}

            {files.length === 0 && urls.length === 0 && texts.length === 0 && (
              <SoftTypography variant="body2" color="secondary">
                No hay documentos, enlaces o textos almacenados.
              </SoftTypography>
            )}
          </>
        )}
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
                  justifyContent: "space-between", // ✅ importante para alinear el texto y la X
                  cursor: "pointer",
                  backgroundColor: "#f9fafb",
                }}
                onClick={() => {
                  if (!file) {
                    document.getElementById("file-upload").click();
                  }
                }}
              >
                <SoftTypography variant="body2" sx={{ color: "#6b7280" }}>
                  {file ? `Archivo: ${file.name}` : "Haz clic para subir archivo"}
                </SoftTypography>

                {file && (
                  <SoftButton
                    size="small"
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation(); // ✅ evita que se dispare el click del contenedor
                      setFile(null);
                      setFileError("");
                    }}
                  >
                    ❌
                  </SoftButton>
                )}
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
                    Swal.fire({
                      icon: "error",
                      title: "Archivo inválido",
                      text: "Solo se permiten archivos PDF, DOCX o XLSX de máximo 5MB.",
                    });
                  }

                }}
              />
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
            <SoftButton
              variant="gradient"
              color="info"
              onClick={handleSaveAttachments}
              disabled={savingAttachments} // 🔐 bloquea durante subida
            >
              {savingAttachments ? "Guardando..." : "Guardar y Continuar"}
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
              placeholder="Ej: Bot Asistente"
              fullWidth
              sx={{ mb: 2 }}
            />
            <SoftTypography variant="subtitle2" mb={1}>
              Descripción (opcional)
            </SoftTypography>
            <SoftInput
              value={botDescription}
              onChange={(e) => setBotDescription(e.target.value)}
              placeholder="Ej: Este bot atiende consultas..."
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
