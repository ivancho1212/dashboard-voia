import { useState } from "react";
import axios from "axios";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types"; 

function TemplateForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await axios.post("/api/BotTemplates", {
      name,
      description,
    });

    onSubmit(res.data);
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2}>
      <SoftTypography variant="h6" mb={2}>Crear plantilla de bot</SoftTypography>

      <SoftInput placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} mb={1} />
      <SoftInput placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} mb={2} />

      <SoftButton type="submit" color="info" fullWidth>
        Crear plantilla
      </SoftButton>
    </SoftBox>
  );
}

TemplateForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default TemplateForm;
