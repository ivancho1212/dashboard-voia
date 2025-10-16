
import React from "react";
import PropTypes from "prop-types";
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

const InteractionsSection = ({
  editMode,
  customPrompt,
  question,
  setQuestion,
  answer,
  setAnswer,
  handleAddInteraction,
  isAddingInteraction,
  interactions,
  handleDeleteInteraction,
  botName,
  setBotName,
  botDescription,
  setBotDescription,
  handleCreateBot,
  creatingBot,
  createdBotId,
  handleUpdateBot,
  handleCancelEdit
}) => (
  <Card sx={{ p: 3, mb: 4 }}>
    <SoftTypography variant="h6" mb={0.5}>{editMode ? "Editar Interacciones y Nombre del Bot" : "1. Entrena con Interacciones y Nombra tu Bot"}</SoftTypography>
    <SoftTypography variant="body2" color="text" mb={2}>{editMode ? "Modifica las preguntas y respuestas para entrenar tu bot. Cambia el nombre y descripción si lo deseas." : "Añade ejemplos de preguntas y respuestas para guiar al bot. Luego, nómbralo y créalo."}</SoftTypography>
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
        {interactions.map((item, index) => (
          index % 2 === 0 && (
            <SoftBox key={`interaction-${item.id}-${index}`} my={1} p={1.5} sx={{ border: "1px solid #eee", borderRadius: "8px", background: "#f9f9f9" }}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start">
                <SoftBox>
                  <SoftTypography variant="caption" fontWeight="bold" color="info">USER:</SoftTypography>
                  <SoftTypography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{item.content}</SoftTypography>
                  {interactions[index + 1] && (
                    <>
                      <SoftTypography variant="caption" fontWeight="bold" color="success" mt={1}>ASSISTANT:</SoftTypography>
                      <SoftTypography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>{interactions[index + 1].content}</SoftTypography>
                    </>
                  )}
                </SoftBox>
                <Icon fontSize="small" color="error" onClick={() => handleDeleteInteraction(index)} sx={{ cursor: "pointer", mt: 0.5 }}>close</Icon>
              </SoftBox>
            </SoftBox>
          )
        ))}
      </SoftBox>
    )}
    <SoftInput value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Ej: Asistente de Ventas" fullWidth sx={{ mb: 2, mt: 2 }} />
    <SoftInput value={botDescription} onChange={(e) => setBotDescription(e.target.value)} placeholder="Descripción (opcional)" fullWidth multiline rows={2} sx={{ mb: 2 }} />
    {editMode && customPrompt && (
      <SoftBox mb={2}>
        <SoftTypography variant="subtitle2" color="info.main">Prompt personalizado del bot:</SoftTypography>
        <SoftBox p={1.5} sx={{ background: '#f5f5f5', borderRadius: '8px', fontSize: '15px', color: '#333' }}>
          {customPrompt}
        </SoftBox>
      </SoftBox>
    )}
    {!editMode && (
      <SoftButton variant="gradient" color="success" onClick={handleCreateBot} disabled={creatingBot || createdBotId} fullWidth>
        {creatingBot ? "Creando..." : createdBotId ? "Bot Creado" : "Crear Bot"}
      </SoftButton>
    )}
    {editMode && (
      <SoftBox display="flex" gap={2} mt={2}>
        <SoftButton variant="gradient" color="success" onClick={handleUpdateBot} disabled={creatingBot} fullWidth>
          {creatingBot ? "Guardando..." : "Guardar"}
        </SoftButton>
        <SoftButton variant="outlined" color="dark" onClick={handleCancelEdit} disabled={creatingBot} fullWidth>
          Cancelar
        </SoftButton>
      </SoftBox>
    )}
  </Card>
);

InteractionsSection.propTypes = {
  editMode: PropTypes.bool.isRequired,
  customPrompt: PropTypes.string,
  question: PropTypes.string.isRequired,
  setQuestion: PropTypes.func.isRequired,
  answer: PropTypes.string.isRequired,
  setAnswer: PropTypes.func.isRequired,
  handleAddInteraction: PropTypes.func.isRequired,
  isAddingInteraction: PropTypes.bool.isRequired,
  interactions: PropTypes.array.isRequired,
  handleDeleteInteraction: PropTypes.func.isRequired,
  botName: PropTypes.string.isRequired,
  setBotName: PropTypes.func.isRequired,
  botDescription: PropTypes.string.isRequired,
  setBotDescription: PropTypes.func.isRequired,
  handleCreateBot: PropTypes.func.isRequired,
  creatingBot: PropTypes.bool.isRequired,
  createdBotId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  handleUpdateBot: PropTypes.func.isRequired,
  handleCancelEdit: PropTypes.func.isRequired,
};

export default InteractionsSection;
