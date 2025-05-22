// src/layouts/bot/admin/create.js

import { useState } from "react";
import IaProviderForm from "./forms/IaProviderForm";
import TemplateForm from "./forms/TemplateForm";
import TemplatePromptForm from "./forms/TemplatePromptForm";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function BotCreate() {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState(null);
  const [template, setTemplate] = useState(null);
  const [prompt, setPrompt] = useState(null);

  const handleIaProviderSubmit = (data) => {
    setProvider(data);
    setStep(2);
  };

  const handleTemplateSubmit = (data) => {
    setTemplate(data);
    setStep(3);
  };

  const handlePromptSubmit = (data) => {
    setPrompt(data);
    setStep(4);
  };

  return (
    <SoftBox>
      <SoftTypography variant="h5" mb={2}>
        Crear nuevo bot (paso {step}/3)
      </SoftTypography>

      {step === 1 && <IaProviderForm onSubmit={handleIaProviderSubmit} />}
      {step === 2 && <TemplateForm onSubmit={handleTemplateSubmit} />}
      {step === 3 && template && (
        <TemplatePromptForm
          botTemplateId={template.id}
          onSubmit={handlePromptSubmit}
        />
      )}
      {step === 4 && (
        <SoftTypography variant="h6" color="success" mt={2}>
          ✅ Bot creado exitosamente.
        </SoftTypography>
      )}
    </SoftBox>
  );
}

export default BotCreate;
