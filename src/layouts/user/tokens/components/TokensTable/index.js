import React from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { Card, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const providersData = [
  {
    id: 1,
    provider: "Google",
    model: "PaLM 2",
    tokens_consumed: 12000,
    price_per_token: 0.00001,
  },
  {
    id: 2,
    provider: "OpenAI",
    model: "GPT-4",
    tokens_consumed: 15000,
    price_per_token: 0.00006,
  },
  {
    id: 3,
    provider: "Anthropic",
    model: "Claude",
    tokens_consumed: 8000,
    price_per_token: 0.00005,
  },
];

const usersTokensData = [
  {
    id: 1,
    user_name: "Juan Pérez",
    plan: "Plan Básico",
    tokens_consumed: 3500,
    tokens_remaining: 6500,
    provider: "OpenAI",
    plan_price: 25.0,
  },
  {
    id: 2,
    user_name: "Ana Torres",
    plan: "Plan Pro",
    tokens_consumed: 4000,
    tokens_remaining: 1000,
    provider: "Google",
    plan_price: 10.0,
  },
  {
    id: 3,
    user_name: "Carlos Díaz",
    plan: "Plan Premium",
    tokens_consumed: 5000,
    tokens_remaining: 0,
    provider: "Anthropic",
    plan_price: 40.0,
  },
];

function TokensDashboard() {
  const handleEditProvider = (id) => alert(`Editar proveedor con ID: ${id}`);
  const handleDeleteProvider = (id) =>
    window.confirm(`¿Eliminar proveedor con ID: ${id}?`) && alert("Eliminado");

  const handleEditUser = (id) => alert(`Editar usuario con ID: ${id}`);
  const handleDeleteUser = (id) =>
    window.confirm(`¿Eliminar usuario con ID: ${id}?`) && alert("Eliminado");

  return (
    <SoftBox py={3}>
      {/* Tabla 1: Tokens por Proveedor */}
      <Card sx={{ p: 2, mb: 4 }}>
        <SoftTypography variant="h6" fontWeight="bold" mb={2}>
          Consumo de Tokens por Proveedor y Modelo
        </SoftTypography>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              {["Proveedor", "Modelo", "Tokens Consumidos", "Precio por Token", "Total Gastado", "Acciones"].map((title) => (
                <th key={title} style={thStyle}>
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {providersData.map((p) => (
              <tr key={p.id}>
                <td style={tdStyle}>{p.provider}</td>
                <td style={tdStyle}>{p.model}</td>
                <td style={tdStyle}>{p.tokens_consumed.toLocaleString()}</td>
                <td style={tdStyle}>${p.price_per_token.toFixed(6)}</td>
                <td style={tdStyle}>${(p.tokens_consumed * p.price_per_token).toFixed(2)}</td>
                <td style={tdStyle}>
                  <SoftBox display="flex" gap={0.5}>
                    <Tooltip title="Editar">
                      <IconButton color="info" size="small" onClick={() => handleEditProvider(p.id)}>
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" size="small" onClick={() => handleDeleteProvider(p.id)}>
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </SoftBox>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Tabla 2: Tokens por Usuario */}
      <Card sx={{ p: 2 }}>
        <SoftTypography variant="h6" fontWeight="bold" mb={2}>
          Consumo de Tokens por Usuario
        </SoftTypography>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              {["Usuario", "Plan", "Tokens Consumidos", "Tokens Restantes", "Proveedor", "Precio Plan", "Acciones"].map((title) => (
                <th key={title} style={thStyle}>
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {usersTokensData.map((u) => (
              <tr key={u.id}>
                <td style={tdStyle}>{u.user_name}</td>
                <td style={tdStyle}>{u.plan}</td>
                <td style={tdStyle}>{u.tokens_consumed.toLocaleString()}</td>
                <td style={tdStyle}>{u.tokens_remaining.toLocaleString()}</td>
                <td style={tdStyle}>{u.provider}</td>
                <td style={tdStyle}>${u.plan_price.toFixed(2)}</td>
                <td style={tdStyle}>
                  <SoftBox display="flex" gap={0.5}>
                    <Tooltip title="Editar">
                      <IconButton color="info" size="small" onClick={() => handleEditUser(u.id)}>
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" size="small" onClick={() => handleDeleteUser(u.id)}>
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </SoftBox>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </SoftBox>
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

export default TokensDashboard;
