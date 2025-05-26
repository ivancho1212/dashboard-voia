import { useState, useEffect } from "react";
import axios from "axios";
import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types";

function IaProviderForm({ onSubmit }) {
  const [providers, setProviders] = useState([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    // Simulación local para evitar la llamada real y el error 404
    setProviders([
      { id: 1, name: "Proveedor IA de prueba", apiEndpoint: "http://fake-endpoint", apiKey: "fake-key" },
    ]);

    // Si quieres hacer llamada real luego, descomenta y usa try/catch:
    /*
    axios.get("/api/BotIaProviders")
      .then((res) => setProviders(res.data))
      .catch((err) => {
        console.warn("No se pudo cargar proveedores IA:", err.message);
        setProviders([]);
      });
    */
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedId) {
      const selected = providers.find((p) => p.id === parseInt(selectedId));
      return onSubmit(selected);
    }

    try {
      const res = await axios.post("/api/BotIaProviders", {
        name,
        apiEndpoint,
        apiKey,
      });
      onSubmit(res.data);
    } catch (error) {
      console.error("Error creando proveedor IA:", error);
      // Aquí puedes mostrar un mensaje al usuario si quieres
    }
  };

  return (
    <SoftBox component="form" onSubmit={handleSubmit} p={2}>
      <SoftTypography variant="h6" mb={2}>
        Selecciona proveedor
      </SoftTypography>

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem" }}
      >
        <option value="">-- Selecciona uno existente --</option>
        {providers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>


      <SoftButton type="submit" color="info" fullWidth mt={2}>
        Continuar
      </SoftButton>
    </SoftBox>
  );
}

IaProviderForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

export default IaProviderForm;
