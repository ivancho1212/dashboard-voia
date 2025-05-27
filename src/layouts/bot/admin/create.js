import { useState } from "react";
import IaProviderForm from "./forms/IaProviderForm";
import TemplateForm from "./forms/TemplateForm";
import TemplatePromptForm from "./forms/TemplatePromptForm";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function BotCreate() {
  const [provider, setProvider] = useState(null);
  const [template, setTemplate] = useState(null);
  const [prompt, setPrompt] = useState(null);

  const [expanded, setExpanded] = useState(1); // 1: IA, 2: Template, 3: Prompt

  const handleIaProviderSubmit = (data) => {
    setProvider(data);
    setExpanded(2);
  };

  const handleTemplateSubmit = (data) => {
    setTemplate(data);
    setExpanded(3);
  };

  const handlePromptSubmit = (data) => {
    setPrompt(data);
    setExpanded(4); // Finalizado
  };

  const toggleSection = (section) => {
    setExpanded(section);
  };

  return (
    <SoftBox>
      <SoftTypography variant="h4" mb={3}>
        Crear nueva plantilla bot
      </SoftTypography>

      {/* Paso 1: Proveedor IA */}
      <SoftBox mb={2} p={2} border="1px solid #ccc" borderRadius="lg">
        <SoftTypography variant="h6" onClick={() => toggleSection(1)} style={{ cursor: "pointer" }}>
          1. Seleccionar un proveedor IA {provider && "✅"}
        </SoftTypography>
        {expanded === 1 && <IaProviderForm onSubmit={handleIaProviderSubmit} />}
      </SoftBox>

      {/* Paso 2: Plantilla */}
      <SoftBox mb={2} p={2} border="1px solid #ccc" borderRadius="lg" opacity={provider ? 1 : 0.5}>
        <SoftTypography
          variant="h6"
          onClick={() => provider && toggleSection(2)}
          style={{ cursor: provider ? "pointer" : "not-allowed" }}
        >
          2. Crear plantilla {template && "✅"}
        </SoftTypography>

        {provider && expanded === 2 && (
          <TemplateForm iaProviderId={provider.id} onSubmit={handleTemplateSubmit} />
        )}
      </SoftBox>

      {/* Paso 3: Prompt */}
      <SoftBox mb={2} p={2} border="1px solid #ccc" borderRadius="lg" opacity={template ? 1 : 0.5}>
        <SoftTypography
          variant="h6"
          onClick={() => template && toggleSection(3)}
          style={{ cursor: template ? "pointer" : "not-allowed" }}
        >
          3. Crear prompt para la plantilla {prompt && "✅"}
        </SoftTypography>
        {template && expanded === 3 && (
          <TemplatePromptForm botTemplateId={template.id || 1} onSubmit={handlePromptSubmit} />
        )}
      </SoftBox>

      {/* Confirmación */}
      {prompt && expanded === 4 && (
        <SoftTypography variant="h6" color="success" mt={3}>
          ✅ Bot creado exitosamente.
        </SoftTypography>
      )}
    </SoftBox>
  );
}

export default BotCreate;
