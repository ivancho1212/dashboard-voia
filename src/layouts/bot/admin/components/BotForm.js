import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

function BotForm({ initialData = {}, onSave, onCancel }) {
  const [bot, setBot] = useState({
    name: "",
    description: "",
    active: true,
    ...initialData,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBot((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(bot);
  };

  return (
    <form onSubmit={handleSubmit}>
      <SoftBox mb={2}>
        <SoftInput name="name" placeholder="Nombre del Bot" value={bot.name} onChange={handleChange} />
      </SoftBox>
      <SoftBox mb={2}>
        <SoftInput name="description" placeholder="Descripción" value={bot.description} onChange={handleChange} />
      </SoftBox>
      <SoftBox display="flex" gap={1}>
        <SoftButton type="submit" color="success">Guardar</SoftButton>
        <SoftButton type="button" color="secondary" onClick={onCancel}>Cancelar</SoftButton>
      </SoftBox>
    </form>
  );
}

BotForm.propTypes = {
  initialData: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default BotForm;
