import React from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { Card, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

// Simulación de datos de proveedores
const proveedores = [
  {
    id: 1,
    nombre: "OpenAI",
    tokens_consumidos: 150000,
    valor_pagar: "$3000.00",
    ultimo_pago: "2024-05-20",
    proximo_cierre: "2024-06-20",
    estado: "Pagado",
  },
  {
    id: 2,
    nombre: "Hugging Face",
    tokens_consumidos: 40000,
    valor_pagar: "$850.00",
    ultimo_pago: "2024-05-25",
    proximo_cierre: "2024-06-25",
    estado: "Pendiente",
  },
];

const plans = [
  {
    id: 1,
    user_id: 1,
    user_name: "Juan Pérez",
    plan_name: "Plan Básico",
    description: "Acceso limitado al sistema",
    price: "$10.00",
    max_tokens: 1000,
    tokens_used: 450,
    tokens_remaining: 550,
    bots_limit: 1,
    is_active: true,
    status: "active",
    provider: "OpenAI",
    start_date: "2024-01-01",
    end_date: "2024-12-31",
    created_at: "2024-01-01 10:00",
  },
  {
    id: 2,
    user_id: 2,
    user_name: "Ana Torres",
    plan_name: "Plan Pro",
    description: "Acceso completo con IA",
    price: "$25.00",
    max_tokens: 5000,
    tokens_used: 4100,
    tokens_remaining: 900,
    bots_limit: 3,
    is_active: false,
    status: "canceled",
    provider: "Anthropic",
    start_date: "2024-02-01",
    end_date: "2024-08-01",
    created_at: "2024-02-01 09:30",
  },
];

function PagosTable() {
  const handleEdit = (id) => alert(`Editar plan con ID: ${id}`);
  const handleDelete = (id) =>
    window.confirm(`¿Eliminar plan con ID: ${id}?`) && alert("Eliminado");
  const handleToggleStatus = (id, status) =>
    alert(`${status === "active" ? "Cancelar" : "Activar"} plan con ID: ${id}`);

  const formatStatusPlan = (isActive) => (isActive ? "Activo" : "Inactivo");
  const formatStatusSubs = (status) => {
    switch (status) {
      case "active":
        return "Activa";
      case "expired":
        return "Expirada";
      case "canceled":
        return "Cancelada";
      default:
        return status;
    }
  };

  return (
    <SoftBox>
      {/* Tabla de pagos a proveedores */}
      <Card sx={{ p: 2, mb: 4 }}>
        <SoftTypography variant="h6" fontWeight="bold" mb={2}>
          Pagos a Proveedores
        </SoftTypography>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
          <thead>
            <tr>
              {[
                "ID",
                "Proveedor",
                "Tokens Consumidos",
                "Valor a Pagar",
                "Último Pago",
                "Próximo Cierre",
                "Estado",
              ].map((title) => (
                <th key={title} style={thStyle}>
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {proveedores.map((prov) => (
              <tr key={prov.id}>
                <td style={tdStyle}>{prov.id}</td>
                <td style={tdStyle}>{prov.nombre}</td>
                <td style={tdStyle}>{prov.tokens_consumidos}</td>
                <td style={tdStyle}>{prov.valor_pagar}</td>
                <td style={tdStyle}>{prov.ultimo_pago}</td>
                <td style={tdStyle}>{prov.proximo_cierre}</td>
                <td style={tdStyle}>{prov.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Tabla de pagos de usuarios */}
      {/* Tabla de pagos de usuarios */}
      <Card sx={{ p: 2 }}>
        <SoftTypography variant="h6" fontWeight="bold" mb={2}>
          Detalle de Pagos y Consumo de Tokens por Usuario
        </SoftTypography>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "0.7rem",
            tableLayout: "fixed", // fuerza la adaptación de ancho
          }}
        >
          <thead>
            <tr>
              {[
                "ID",
                "Usuario",
                "Proveedor",
                "Plan",
                "Precio",
                "Tokens Máx.",
                "Tokens Usados",
                "Tokens Restantes",
                "Estado Plan",
                "Estado Suscripción",
                "Inicio",
                "Fin",
                "Acciones",
              ].map((title) => (
                <th key={title} style={thStyle}>
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td style={tdStyle}>{plan.id}</td>
                <td style={tdStyle}>{plan.user_name}</td>
                <td style={tdStyle}>{plan.provider}</td>
                <td style={tdStyle}>{plan.plan_name}</td>
                <td style={tdStyle}>{plan.price}</td>
                <td style={tdStyle}>{plan.max_tokens}</td>
                <td style={tdStyle}>{plan.tokens_used}</td>
                <td style={tdStyle}>{plan.tokens_remaining}</td>
                <td style={tdStyle}>{formatStatusPlan(plan.is_active)}</td>
                <td style={tdStyle}>{formatStatusSubs(plan.status)}</td>
                <td style={tdStyle}>{plan.start_date}</td>
                <td style={tdStyle}>{plan.end_date}</td>
                <td style={tdStyle}>
                  <SoftBox display="flex" gap={0.5}>
                    <Tooltip title="Editar">
                      <IconButton color="info" size="small" onClick={() => handleEdit(plan.id)}>
                        <EditIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar">
                      <IconButton color="error" size="small" onClick={() => handleDelete(plan.id)}>
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={plan.status === "active" ? "Cancelar Plan" : "Activar Plan"}>
                      <IconButton
                        color={plan.status === "active" ? "warning" : "success"}
                        size="small"
                        onClick={() => handleToggleStatus(plan.id, plan.status)}
                      >
                        {plan.status === "active" ? (
                          <CancelIcon fontSize="inherit" />
                        ) : (
                          <CheckCircleIcon fontSize="inherit" />
                        )}
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
  padding: "4px",
  borderBottom: "1px solid #ccc",
  textAlign: "left",
  backgroundColor: "#f9f9f9",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const tdStyle = {
  padding: "4px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

export default PagosTable;
