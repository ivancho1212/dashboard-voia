import { useState } from "react";
import IaProviderForm from "./forms/IaProviderForm";
import TemplatePromptForm from "./forms/TemplatePromptForm";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function BotCreate() {
  const [provider, setProvider] = useState(null);
  const [template, setTemplate] = useState(null);
  const [prompt, setPrompt] = useState(null);

  const [expanded, setExpanded] = useState(1); // 1: IA, 2: Template, 3: Prompt

  const handleIaProviderSubmit = (data, plantillaCreada) => {
    setProvider(data);
    setTemplate(plantillaCreada);
    setExpanded(3); // o 2 si quieres seguir el número, pero 3 para prompt
  };

  const handlePromptSubmit = (data) => {
    setPrompt(data);
    setExpanded(4); // Finalizado
  };

  const toggleSection = (section) => {
    setExpanded(section);
  };

  return (
    <SoftBox p={3}> 

      {/* Paso 1: Proveedor IA */}
      <SoftBox
        mb={3}
        p={3}
        borderRadius="lg"
        shadow="sm"
        bgColor="white"
        sx={{ border: "1px solid #e0e0e0" }}
      >
        <SoftTypography
          variant="h6"
          fontWeight="bold"
          color="info"
          onClick={() => toggleSection(1)}
          sx={{ cursor: "pointer", userSelect: "none" }}
        >
          Plantilla de IA {provider && "✅"}
        </SoftTypography>
        {expanded === 1 && <IaProviderForm onSubmit={handleIaProviderSubmit} />}
      </SoftBox>

      {/* Paso 3: Prompt */}
      <SoftBox
        mb={3}
        p={3}
        borderRadius="lg"
        shadow="sm"
        bgColor="white"
        sx={{
          border: "1px solid #e0e0e0",
          opacity: template ? 1 : 0.5,
          cursor: template ? "default" : "not-allowed",
        }}
      >
        <SoftTypography
          variant="h6"
          fontWeight="bold"
          color="info"
          onClick={() => template && toggleSection(3)}
          sx={{ cursor: template ? "pointer" : "not-allowed", userSelect: "none" }}
        >
          Crear prompt para la plantilla {prompt && "✅"}
        </SoftTypography>
        {template && expanded === 3 && (
          <TemplatePromptForm botTemplateId={template.id || 1} onSubmit={handlePromptSubmit} />
        )}
      </SoftBox>

      {/* Confirmación */}
      {prompt && expanded === 4 && (
        <SoftBox mt={3}>
          <SoftTypography variant="h6" fontWeight="bold" color="success">
            ✅ Plantilla creada exitosamente.
          </SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
}

export default BotCreate;
