import { useLocation, useParams } from "react-router-dom";
import { useState } from "react";
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

  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const maxFileSize = 5 * 1024 * 1024; // 5MB

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
    const pdfRegex = /^https?:\/\/.+\.pdf$/i;
    if (!link || pdfRegex.test(link)) {
      setLinkError("");
      return true;
    } else {
      setLinkError("El enlace debe ser una URL válida que termine en .pdf");
      return false;
    }
  };

  // Preguntas sugeridas
  const suggestedInteractions = [
    { question: "¿Qué es una tasación vehicular?" },
    { question: "¿Qué incluye el servicio de tasación?" },
    { question: "¿Ofrecen tasaciones virtuales o solo presenciales?" },
    { question: "¿Cuánto tiempo se demora el proceso de tasación?" },
    { question: "¿La tasación tiene validez legal?" },
    { question: "¿Cuánto cuesta una tasación de vehículo?" },
    { question: "¿Qué métodos de pago aceptan?" },
    { question: "¿Debo pagar antes o después de recibir el informe?" },
    { question: "¿Puedo tasar cualquier tipo de vehículo?" },
    { question: "¿Qué datos del vehículo debo proporcionar?" },
    { question: "¿Tasación aplica también para motos o camiones?" },
    { question: "¿Qué documentos necesito para tasar mi vehículo?" },
    { question: "¿Puedo tasar un vehículo si no está a mi nombre?" },
    { question: "¿Es obligatorio tener la tarjeta de propiedad?" },
    { question: "¿Cómo puedo agendar una tasación?" },
    { question: "¿Cuál es el horario de atención?" },
    { question: "¿Dónde están ubicados?" },
    { question: "¿Atienden los fines de semana?" },
    { question: "¿Recibo un certificado de la tasación?" },
    { question: "¿El informe de tasación se envía por correo?" },
  ];

  const handleAddInteraction = () => {
    if (question.trim() && answer.trim()) {
      setInteractions([
        ...interactions,
        { role: "user", content: question },
        { role: "assistant", content: answer },
      ]);
      setQuestion("");
      setAnswer("");
    }
  };

  const handleUseSuggestion = (q, a) => {
    setQuestion(q);
    setAnswer(a);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Entrenamiento del Bot: {template?.name || `ID ${id}`}
        </SoftTypography>
        {/* Preguntas estándar con respuesta personalizada */}
        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h6" mb={2}>
            Preguntas Estándar
          </SoftTypography>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SoftTypography variant="subtitle2" mb={1}>
                Selecciona una pregunta estándar
              </SoftTypography>
              <select
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  fontSize: "16px",
                }}
              >
                <option value="">-- Selecciona una pregunta --</option>
                {suggestedInteractions.map((item, idx) => (
                  <option key={idx} value={item.question}>
                    {item.question}
                  </option>
                ))}
              </select>
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
              <SoftButton variant="gradient" color="info" onClick={handleAddInteraction}>
                Añadir al Prompt
              </SoftButton>
            </Grid>
          </Grid>
        </Card>
        {/* Entradas manuales */}
        <Card sx={{ p: 3, mb: 4 }}>
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
              <SoftButton variant="gradient" color="info" onClick={handleAddInteraction}>
                Añadir al Prompt
              </SoftButton>
            </Grid>
          </Grid>
        </Card>

        {/* Prompt actual */}
        <Card sx={{ p: 3 }}>
          <SoftTypography variant="h6" mb={2}>
            Prompt Actual
          </SoftTypography>
          {interactions.length === 0 ? (
            <SoftTypography variant="body2" color="textSecondary">
              Aún no has añadido interacciones.
            </SoftTypography>
          ) : (
            interactions.map((entry, index) => (
              <SoftBox key={index} mb={2}>
                <SoftTypography variant="caption" color="text">
                  <strong>{entry.role.toUpperCase()}:</strong>
                </SoftTypography>
                <SoftTypography variant="body2">{entry.content}</SoftTypography>
              </SoftBox>
            ))
          )}

          {/* Botón Guardar Prompt */}
          <SoftBox mt={2} display="flex" justifyContent="flex-start">
            <SoftButton
              variant="gradient"
              color="info"
              onClick={() => {
                const promptText = interactions.map((i) => `${i.role}: ${i.content}`).join("\n");
                if (promptText.length > 3000) {
                  alert("El prompt es demasiado largo (máximo 3000 caracteres). Reduce contenido.");
                } else {
                  // Aquí guardas el prompt: enviar a tu API o guardar en estado
                  handleSavePrompt(promptText);
                }
              }}
            >
              Guardar Prompt
            </SoftButton>
          </SoftBox>
        </Card>

        <Card sx={{ p: 3, mt: 4 }}>
          <SoftTypography variant="h6">Añadir Archivo o Enlace</SoftTypography>
          <SoftTypography variant="caption" gutterBottom>
            Adjunta un archivo (PDF, DOCX, XLSX) con la descripción de tu empresa. El sistema
            extraerá el contenido automáticamente para que el bot pueda entenderlo y responder con
            base en eso.
          </SoftTypography>

          <Grid container spacing={2} alignItems="flex-start">
            {/* Input archivo */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SoftBox
                sx={{
                  border: "2px dashed #9ca3af",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  height: "45px", // igual altura que SoftInput
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  backgroundColor: "#f9fafb",
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                  },
                }}
                onClick={() => document.getElementById("file-upload").click()}
              >
                <SoftTypography
                  variant="body2"
                  sx={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    width: "100%",
                  }}
                >
                  {file
                    ? `Archivo seleccionado: ${file.name}`
                    : "Haz clic o arrastra un archivo aquí"}
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

              {/* Mensaje error archivo, con margen superior pequeño para no romper la altura del input */}
              {fileError && (
                <SoftTypography variant="caption" color="error" sx={{ mt: 1 }}>
                  {fileError}
                </SoftTypography>
              )}
            </Grid>

            {/* Input enlace */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                flexDirection: "column",
              }}
            >
              <SoftInput
                placeholder="Enlace a documento o página"
                value={link}
                onChange={(e) => {
                  const value = e.target.value;
                  setLink(value);
                  validateLink(value);
                }}
                sx={{
                  height: "45px", // igual altura que SoftBox archivo
                  mb: 1, // margen inferior para separar del caption
                }}
              />
              <SoftTypography variant="caption" sx={{ mb: 1 }}>
                Ej: https://tusitio.com/archivo.pdf
              </SoftTypography>

              {linkError && (
                <SoftTypography variant="caption" color="error">
                  {linkError}
                </SoftTypography>
              )}
            </Grid>
          </Grid>

          <SoftBox mt={2} display="flex" justifyContent="flex-start">
            <SoftButton
              variant="gradient"
              color="info"
              onClick={() => {
                if (!file && !link) {
                  alert("Debes seleccionar un archivo o añadir un enlace.");
                } else if (file && !fileError) {
                  handleSaveFile(file);
                } else if (link && !linkError) {
                  handleSaveLink(link);
                }
              }}
            >
              Guardar Adjuntos
            </SoftButton>
          </SoftBox>
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotTraining;
