import PropTypes from "prop-types";
import BotForm from "./components/BotForm";

function EditBot({ onCancel }) {
  const botToEdit = {
    id: 1,
    name: "Bot de ejemplo",
    description: "Este es un bot de prueba",
    active: true,
  };

  const handleSave = (updatedBot) => {
    console.log("Bot actualizado:", updatedBot);
    onCancel(); // Simula el retorno
  };

  return <BotForm initialData={botToEdit} onSave={handleSave} onCancel={onCancel} />;
}

EditBot.propTypes = {
  onCancel: PropTypes.func.isRequired,
};

export default EditBot;
