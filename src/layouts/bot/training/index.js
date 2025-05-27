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
import Icon from "@mui/material/Icon";

function BotTraining() {
  const { id } = useParams();
  const location = useLocation();
  const template = location.state?.template;

  const [interactions, setInteractions] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState(null);
  const [link, setLink] = useState("");

  // Preguntas sugeridas
  const suggestedInteractions = [
    {
      question: "¿Cuál es el horario de atención?",
      answer: "Nuestro horario de atención es de lunes a viernes de 8am a 5pm.",
    },
    {
      question: "¿Dónde están ubicados?",
      answer: "Nos encontramos en Bogotá, Colombia, en la Calle 123 #45-67.",
    },
    {
      question: "¿Qué productos ofrecen?",
      answer: "Ofrecemos soluciones tecnológicas para el agro como sensores, drones y software.",
    },
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

        {/* Preguntas sugeridas */}
        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h6" mb={2}>
            Preguntas Sugeridas
          </SoftTypography>
          <Grid container spacing={2}>
            {suggestedInteractions.map((item, idx) => (
              <Grid item xs={12} md={4} key={idx}>
                <Card sx={{ p: 2 }}>
                  <SoftTypography variant="subtitle2" mb={1}>
                    <strong>Pregunta:</strong> {item.question}
                  </SoftTypography>
                  <SoftTypography variant="body2" mb={2}>
                    <strong>Respuesta:</strong> {item.answer}
                  </SoftTypography>
                  <SoftButton size="small" color="info" onClick={() => handleUseSuggestion(item.question, item.answer)}>
                    Usar esta pregunta
                  </SoftButton>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>

        {/* Archivo o enlace */}
        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h6" mb={2}>
            Añadir Archivos o Enlaces
          </SoftTypography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SoftInput
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file && (
                <SoftTypography variant="caption" mt={1}>
                  Archivo seleccionado: {file.name}
                </SoftTypography>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftInput
                placeholder="Pega aquí un enlace (PDF, página web, etc.)"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
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
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotTraining;
