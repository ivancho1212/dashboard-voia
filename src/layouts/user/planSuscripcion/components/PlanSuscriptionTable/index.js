import React from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { Card, IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const plans = [
  {
    id: 1,
    user_id: 1,
    user_name: "Juan Pérez",
    plan_name: "Plan Básico",
    description: "Acceso limitado al sistema",
    price: "$10.00",
    max_tokens: 1000,
    bots_limit: 1,
    is_active: true,
    status: "active",
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
    bots_limit: 3,
    is_active: false,
    status: "canceled",
    start_date: "2024-02-01",
    end_date: "2024-08-01",
    created_at: "2024-02-01 09:30",
  },
];

function PlanSuscriptionTable() {
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
    <Card sx={{ p: 2 }}>
      <SoftTypography variant="h6" fontWeight="bold" mb={2}>
        Lista de Planes y Suscripciones
      </SoftTypography>

      <table
        style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}
      >
        <thead>
          <tr>
            {[
              "ID",
              "Usuario",
              "Plan",
              "Descripción",
              "Precio",
              "Tokens Máx.",
              "Límite Bots",
              "Estado Plan",
              "Estado Suscripción",
              "Inicio",
              "Fin",
              "Fecha de Registro",
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
              <td style={tdStyle}>{plan.plan_name}</td>
              <td style={tdStyle} title={plan.description}>
                {plan.description.length > 30
                  ? plan.description.substring(0, 30) + "..."
                  : plan.description}
              </td>
              <td style={tdStyle}>{plan.price}</td>
              <td style={tdStyle}>{plan.max_tokens}</td>
              <td style={tdStyle}>{plan.bots_limit ?? 1}</td>
              <td style={tdStyle}>{formatStatusPlan(plan.is_active)}</td>
              <td style={tdStyle}>{formatStatusSubs(plan.status)}</td>
              <td style={tdStyle}>{plan.start_date}</td>
              <td style={tdStyle}>{plan.end_date}</td>
              <td style={tdStyle}>{plan.created_at}</td>
              <td style={tdStyle}>
                <SoftBox display="flex" gap={0.5}>
                  <Tooltip title="Editar">
                    <IconButton
                      color="info"
                      size="small"
                      onClick={() => handleEdit(plan.id)}
                    >
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip
                    title={
                      plan.status === "active" ? "Cancelar Plan" : "Activar Plan"
                    }
                  >
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

export default PlanSuscriptionTable;
