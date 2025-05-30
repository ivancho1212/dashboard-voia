import React from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { Card, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

const bots = [
  {
    id: 1,
    user: { id: 4, name: "Juan Pérez" },
    style_template_id: 2,
    name: "Bot Legal",
    description: "Responde preguntas legales básicas.",
    api_key: "sk-legal-bot-123456",
    model_used: "gpt-4",
    is_active: true,
    created_at: "2024-09-01 10:15",
    updated_at: "2024-09-03 08:25",
    ApiKey: "apikey-1q2w3e4r5t",
  },
  {
    id: 2,
    user: { id: 7, name: "María López" },
    style_template_id: null,
    name: "Bot Contable",
    description: "Asiste en temas contables.",
    api_key: "sk-account-bot-654321",
    model_used: "gpt-3.5",
    is_active: false,
    created_at: "2024-09-02 14:45",
    updated_at: "2024-09-03 08:30",
    ApiKey: "apikey-9z8x7c6v5b",
  },
];

function BotsTable() {
  const handleEdit = (id) => alert(`Editar bot con ID: ${id}`);
  const handleDelete = (id) => window.confirm(`¿Eliminar bot con ID: ${id}?`) && alert("Eliminado");
  const handleToggleActive = (id, isActive) =>
    alert(`${isActive ? "Desactivar" : "Activar"} bot con ID: ${id}`);

  return (
    <Card sx={{ p: 2 }}>
      <SoftTypography variant="h6" fontWeight="bold" mb={2}>
        Lista de Bots Asociados
      </SoftTypography>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
        <thead>
          <tr>
            {[
              "ID", "Usuario", "Nombre", "Descripción", "Modelo",
              "API Key", "Clave Alterna", "Activo", "Creado",
              "Actualizado", "Acciones"
            ].map((title) => (
              <th key={title} style={thStyle}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bots.map((b) => (
            <tr key={b.id}>
              <td style={tdStyle}>{b.id}</td>
              <td style={tdStyle}>{b.user?.name || "Desconocido"}</td>
              <td style={tdStyle}>{b.name}</td>
              <td style={tdStyle}>{b.description}</td>
              <td style={tdStyle}>{b.model_used}</td>
              <td style={tdStyle}><code>{b.api_key}</code></td>
              <td style={tdStyle}><code>{b.ApiKey}</code></td>
              <td style={tdStyle}>{b.is_active ? "Sí" : "No"}</td>
              <td style={tdStyle}>{b.created_at}</td>
              <td style={tdStyle}>{b.updated_at}</td>
              <td style={tdStyle}>
                <SoftBox display="flex" gap={0.5}>
                  <Tooltip title="Editar">
                    <IconButton color="info" size="small" onClick={() => handleEdit(b.id)}>
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" size="small" onClick={() => handleDelete(b.id)}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={b.is_active ? "Desactivar" : "Activar"}>
                    <IconButton
                      color={b.is_active ? "warning" : "success"}
                      size="small"
                      onClick={() => handleToggleActive(b.id, b.is_active)}
                    >
                      {b.is_active ? <ToggleOffIcon fontSize="inherit" /> : <ToggleOnIcon fontSize="inherit" />}
                    </IconButton>
                  </Tooltip>
                </SoftBox>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

const thStyle = {
  padding: "6px",
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  backgroundColor: "#f1f1f1",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "6px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};

export default BotsTable;
