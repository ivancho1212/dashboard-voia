import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import { getIaProviders } from "services/botIaProviderService";
import { getModelConfigsByProvider } from "services/aiModelConfigService";
import { createBotTemplate } from "services/botTemplateService";


const selectStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  marginTop: "6px",
  fontSize: "14px",
};

function IaProviderForm({ onSubmit }) {
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedProviderId, setSelectedProviderId] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Comportamiento
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState(
    "No tengo información suficiente para responder eso. Por favor contáctanos directamente."
  );
  const [outOfScopeMessage, setOutOfScopeMessage] = useState(
    "Esa pregunta está fuera de mi área. Te recomiendo contactar a nuestro equipo."
  );
  const [language, setLanguage] = useState("es");
  const [strictRagMode, setStrictRagMode] = useState(false);
  const [maxHistoryMessages, setMaxHistoryMessages] = useState(10);

  // RAG
  const [ragMinScore, setRagMinScore] = useState(0.65);
  const [ragTopK, setRagTopK] = useState(5);
  const [ragRerankEnabled, setRagRerankEnabled] = useState(true);
  const [citationMode, setCitationMode] = useState("none");

  // Operacional
  const [blockedTopics, setBlockedTopics] = useState("");
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState("");

  // Secciones expandibles
  const [showBehavior, setShowBehavior] = useState(false);
  const [showRag, setShowRag] = useState(false);
  const [showOperational, setShowOperational] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await getIaProviders();
        setProviders(data);
      } catch (error) {
        console.error("Error al obtener proveedores:", error);
      }
    };
    fetchProviders();
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedProviderId) return;
      try {
        const data = await getModelConfigsByProvider(selectedProviderId);
        setModels(data);
      } catch (error) {
        console.error("Error al obtener modelos IA:", error);
      }
    };
    fetchModels();
  }, [selectedProviderId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedProviderId || !selectedModelId || !name.trim()) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const newTemplate = {
      name: name.trim(),
      description: description.trim(),
      iaProviderId: parseInt(selectedProviderId, 10),
      aiModelConfigId: parseInt(selectedModelId, 10),
      // Comportamiento
      welcomeMessage: welcomeMessage.trim() || null,
      fallbackMessage: fallbackMessage.trim() || null,
      outOfScopeMessage: outOfScopeMessage.trim() || null,
      language,
      strictRagMode,
      maxHistoryMessages: parseInt(maxHistoryMessages, 10),
      // RAG
      ragMinScore: parseFloat(ragMinScore),
      ragTopK: parseInt(ragTopK, 10),
      ragRerankEnabled,
      citationMode,
      // Operacional
      blockedTopics: blockedTopics.trim() || null,
      rateLimitPerMinute: rateLimitPerMinute !== "" ? parseInt(rateLimitPerMinute, 10) : null,
    };

    try {
      const data = await createBotTemplate(newTemplate);
      onSubmit(newTemplate, data);
    } catch (error) {
      console.error("Error al enviar datos:", error);
      alert("Error al crear la plantilla: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit}>

      {/* Proveedor IA */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Proveedor de IA
        </SoftTypography>
        <select
          name="provider"
          value={selectedProviderId}
          onChange={(e) => {
            setSelectedProviderId(e.target.value);
            setSelectedModelId("");
          }}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            marginTop: "6px",
          }}
        >
          <option value="">-- Selecciona un proveedor --</option>
          {providers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </SoftBox>

      {/* Modelo IA */}
      {selectedProviderId && (
        <SoftBox mb={2}>
          <SoftTypography variant="caption" color="text">
            Modelo de IA
          </SoftTypography>
          <select
            name="model"
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              marginTop: "6px",
            }}
          >
            <option value="">-- Selecciona un modelo --</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.modelName}
              </option>
            ))}
          </select>
        </SoftBox>
      )}

      {/* Nombre */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Nombre
        </SoftTypography>
        <SoftInput
          placeholder="Ej. Plantilla de atención"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
        />
      </SoftBox>

      {/* Descripción */}
      <SoftBox mb={2}>
        <SoftTypography variant="caption" color="text">
          Descripción
        </SoftTypography>
        <SoftInput
          placeholder="Describe la plantilla"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
        />
      </SoftBox>

      {/* Sección: Comportamiento */}
      <SoftBox mb={2} mt={3} sx={{ borderTop: "1px solid #e0e0e0", pt: 2 }}>
        <SoftTypography
          variant="caption"
          fontWeight="bold"
          color="text"
          onClick={() => setShowBehavior(!showBehavior)}
          sx={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 1 }}
        >
          {showBehavior ? "▾" : "▸"} Comportamiento y mensajes (opcional)
        </SoftTypography>
        {showBehavior && (
          <SoftBox mt={2} display="flex" flexDirection="column" gap={2}>
            <SoftBox>
              <SoftTypography variant="caption" color="text">Mensaje de bienvenida</SoftTypography>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Hola, soy tu asistente virtual. ¿En qué puedo ayudarte?"
                rows={2}
                style={{ ...selectStyle, resize: "vertical" }}
              />
            </SoftBox>
            <SoftBox>
              <SoftTypography variant="caption" color="text">Mensaje de fallback (sin información RAG)</SoftTypography>
              <textarea
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                rows={2}
                style={{ ...selectStyle, resize: "vertical" }}
              />
            </SoftBox>
            <SoftBox>
              <SoftTypography variant="caption" color="text">Mensaje fuera de alcance</SoftTypography>
              <textarea
                value={outOfScopeMessage}
                onChange={(e) => setOutOfScopeMessage(e.target.value)}
                rows={2}
                style={{ ...selectStyle, resize: "vertical" }}
              />
            </SoftBox>
            <SoftBox display="flex" gap={2}>
              <SoftBox flex={1}>
                <SoftTypography variant="caption" color="text">Idioma</SoftTypography>
                <select value={language} onChange={(e) => setLanguage(e.target.value)} style={selectStyle}>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                  <option value="fr">Français</option>
                </select>
              </SoftBox>
              <SoftBox flex={1}>
                <SoftTypography variant="caption" color="text">Mensajes de historial</SoftTypography>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxHistoryMessages}
                  onChange={(e) => setMaxHistoryMessages(e.target.value)}
                  style={selectStyle}
                />
              </SoftBox>
            </SoftBox>
            <SoftBox display="flex" alignItems="center" gap={2}>
              <input
                type="checkbox"
                id="strictRagMode"
                checked={strictRagMode}
                onChange={(e) => setStrictRagMode(e.target.checked)}
                style={{ width: 16, height: 16 }}
              />
              <label htmlFor="strictRagMode" style={{ fontSize: 13, color: "#344767" }}>
                Modo RAG estricto (solo responde con info de documentos, previene alucinaciones)
              </label>
            </SoftBox>
          </SoftBox>
        )}
      </SoftBox>

      {/* Sección: RAG */}
      <SoftBox mb={2} sx={{ borderTop: "1px solid #e0e0e0", pt: 2 }}>
        <SoftTypography
          variant="caption"
          fontWeight="bold"
          color="text"
          onClick={() => setShowRag(!showRag)}
          sx={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 1 }}
        >
          {showRag ? "▾" : "▸"} Configuración RAG (opcional)
        </SoftTypography>
        {showRag && (
          <SoftBox mt={2} display="flex" flexDirection="column" gap={2}>
            <SoftBox display="flex" gap={2}>
              <SoftBox flex={1}>
                <SoftTypography variant="caption" color="text">Score mínimo (0–1)</SoftTypography>
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={ragMinScore}
                  onChange={(e) => setRagMinScore(e.target.value)}
                  style={selectStyle}
                />
              </SoftBox>
              <SoftBox flex={1}>
                <SoftTypography variant="caption" color="text">Top K fragmentos</SoftTypography>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={ragTopK}
                  onChange={(e) => setRagTopK(e.target.value)}
                  style={selectStyle}
                />
              </SoftBox>
            </SoftBox>
            <SoftBox display="flex" gap={2} alignItems="center">
              <SoftBox flex={1}>
                <SoftTypography variant="caption" color="text">Modo de citación</SoftTypography>
                <select value={citationMode} onChange={(e) => setCitationMode(e.target.value)} style={selectStyle}>
                  <option value="none">Sin citas</option>
                  <option value="inline">Inline (nombre del documento)</option>
                </select>
              </SoftBox>
              <SoftBox flex={1} display="flex" alignItems="center" gap={1} mt={2}>
                <input
                  type="checkbox"
                  id="ragRerank"
                  checked={ragRerankEnabled}
                  onChange={(e) => setRagRerankEnabled(e.target.checked)}
                  style={{ width: 16, height: 16 }}
                />
                <label htmlFor="ragRerank" style={{ fontSize: 13, color: "#344767" }}>
                  Reranking semántico
                </label>
              </SoftBox>
            </SoftBox>
          </SoftBox>
        )}
      </SoftBox>

      {/* Sección: Operacional */}
      <SoftBox mb={3} sx={{ borderTop: "1px solid #e0e0e0", pt: 2 }}>
        <SoftTypography
          variant="caption"
          fontWeight="bold"
          color="text"
          onClick={() => setShowOperational(!showOperational)}
          sx={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 1 }}
        >
          {showOperational ? "▾" : "▸"} Control operacional (opcional)
        </SoftTypography>
        {showOperational && (
          <SoftBox mt={2} display="flex" flexDirection="column" gap={2}>
            <SoftBox>
              <SoftTypography variant="caption" color="text">
                Temas bloqueados (JSON array, ej: [&quot;política&quot;,&quot;competencia&quot;])
              </SoftTypography>
              <input
                type="text"
                value={blockedTopics}
                onChange={(e) => setBlockedTopics(e.target.value)}
                placeholder='["política","competencia"]'
                style={selectStyle}
              />
            </SoftBox>
            <SoftBox>
              <SoftTypography variant="caption" color="text">Límite de mensajes por minuto (vacío = sin límite)</SoftTypography>
              <input
                type="number"
                min={1}
                value={rateLimitPerMinute}
                onChange={(e) => setRateLimitPerMinute(e.target.value)}
                placeholder="Ej: 20"
                style={selectStyle}
              />
            </SoftBox>
          </SoftBox>
        )}
      </SoftBox>

      {/* Botón enviar */}
      <SoftBox mt={3} display="flex" justifyContent="flex-start" gap={2}>
        <SoftButton
          type="submit"
          color="info"
          variant="contained"
          disabled={!selectedProviderId || !selectedModelId || !name.trim()}
        >
          Crear Plantilla
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

IaProviderForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default IaProviderForm;
