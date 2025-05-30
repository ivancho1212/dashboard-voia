import React from "react";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { Card, IconButton, Tooltip, Avatar } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";

const users = [
  {
    id: 1,
    role_id: 1,
    document_type_id: 2,
    name: "Juan Pérez",
    email: "juan@example.com",
    password: "********",
    phone: "3001234567",
    address: "Calle 123 #45-67",
    document_number: "123456789",
    document_photo_url: "https://via.placeholder.com/100x60",
    avatar_url: "https://via.placeholder.com/40",
    is_verified: 1,
    created_at: "2024-01-01 10:00",
    updated_at: "2024-02-01 12:30",
  },
  {
    id: 2,
    role_id: 2,
    document_type_id: 1,
    name: "Ana Torres",
    email: "ana@example.com",
    password: "********",
    phone: "3109876543",
    address: "Cra 7 #10-11",
    document_number: "987654321",
    document_photo_url: "https://via.placeholder.com/100x60",
    avatar_url: "https://via.placeholder.com/40",
    is_verified: 0,
    created_at: "2024-01-10 11:00",
    updated_at: "2024-03-15 15:45",
  },
];

function UsersTable() {
  const handleEdit = (id) => alert(`Editar usuario con ID: ${id}`);
  const handleDelete = (id) => window.confirm(`¿Eliminar usuario con ID: ${id}?`) && alert("Eliminado");
  const handleToggleBlock = (id, isVerified) =>
    alert(`${isVerified ? "Bloquear" : "Desbloquear"} usuario con ID: ${id}`);

  return (
    <Card sx={{ p: 2 }}>
      <SoftTypography variant="h6" fontWeight="bold" mb={2}>
        Lista de Usuarios
      </SoftTypography>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
        <thead>
          <tr>
            {[
              "ID", "Rol", "Tipo Doc", "Nombre", "Correo", "Contraseña",
              "Teléfono", "Dirección", "N° Doc", "Foto Doc", "Avatar",
              "Verificado", "Creado", "Actualizado", "Acciones"
            ].map((title) => (
              <th key={title} style={thStyle}>{title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td style={tdStyle}>{u.id}</td>
              <td style={tdStyle}>{u.role_id}</td>
              <td style={tdStyle}>{u.document_type_id}</td>
              <td style={tdStyle}>{u.name}</td>
              <td style={tdStyle}>{u.email}</td>
              <td style={tdStyle}>{u.password}</td>
              <td style={tdStyle}>{u.phone || "-"}</td>
              <td style={tdStyle}>{u.address || "-"}</td>
              <td style={tdStyle}>{u.document_number || "-"}</td>
              <td style={tdStyle}>
                {u.document_photo_url ? (
                  <a href={u.document_photo_url} target="_blank" rel="noreferrer">Ver</a>
                ) : "-"}
              </td>
              <td style={tdStyle}>
                {u.avatar_url ? (
                  <Avatar src={u.avatar_url} alt={u.name} sx={{ width: 30, height: 30 }} />
                ) : "-"}
              </td>
              <td style={tdStyle}>{u.is_verified ? "Sí" : "No"}</td>
              <td style={tdStyle}>{u.created_at}</td>
              <td style={tdStyle}>{u.updated_at}</td>
              <td style={tdStyle}>
                <SoftBox display="flex" gap={0.5}>
                  <Tooltip title="Editar">
                    <IconButton color="info" size="small" onClick={() => handleEdit(u.id)}>
                      <EditIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton color="error" size="small" onClick={() => handleDelete(u.id)}>
                      <DeleteIcon fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={u.is_verified ? "Bloquear" : "Desbloquear"}>
                    <IconButton
                      color={u.is_verified ? "warning" : "success"}
                      size="small"
                      onClick={() => handleToggleBlock(u.id, u.is_verified)}
                    >
                      {u.is_verified ? <LockIcon fontSize="inherit" /> : <LockOpenIcon fontSize="inherit" />}
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

export default UsersTable;
