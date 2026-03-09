import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { API_URL } from "../../config/environment";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Tooltip, CircularProgress, Select, MenuItem,
  FormControl
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

const API = `${API_URL}/team`;

function LabeledInput({ label, children }) {
  LabeledInput.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node.isRequired };
  return (
    <SoftBox mb={0}>
      <SoftBox mb={0.5} ml={0.5}>
        <SoftTypography component="label" variant="caption" fontWeight="bold" color="text">
          {label}
        </SoftTypography>
      </SoftBox>
      {children}
    </SoftBox>
  );
}

export default function MiEquipo() {
  const [members, setMembers] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "", roleName: "" });

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [membersRes, slotsRes] = await Promise.all([
        axios.get(API, { headers }),
        axios.get(`${API}/slots`, { headers }),
      ]);
      setMembers(membersRes.data);
      setSlots(slotsRes.data.slots || []);
    } catch {
      setError("Error al cargar el equipo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.roleName) { setError("Selecciona un rol."); return; }
    setSubmitting(true);
    try {
      await axios.post(API, form, { headers });
      setSuccess("Miembro creado exitosamente.");
      setForm({ name: "", email: "", password: "", roleName: "" });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear el miembro.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Eliminar a ${name} del equipo?`)) return;
    try {
      await axios.delete(`${API}/${id}`, { headers });
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch {
      setError("Error al eliminar el miembro.");
    }
  };

  // Slots disponibles para el select
  const availableSlots = slots.filter(s => s.used < s.max);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={3}>

        {/* Header */}
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <SoftBox>
            <SoftTypography variant="h5" fontWeight="bold">Mi Equipo</SoftTypography>
            <SoftTypography variant="caption" color="text">
              Gestiona los miembros de tu workspace
            </SoftTypography>
          </SoftBox>
          {availableSlots.length > 0 && (
            <SoftButton
              color="dark"
              size="small"
              startIcon={<PersonAddIcon />}
              onClick={() => { setShowForm(f => !f); setError(""); setSuccess(""); }}
            >
              {showForm ? "Cancelar" : "Agregar miembro"}
            </SoftButton>
          )}
        </SoftBox>

        {/* Resumen de slots del plan */}
        {slots.length > 0 && (
          <SoftBox display="flex" gap={1} flexWrap="wrap" mb={2}>
            {slots.map(s => (
              <Chip
                key={s.roleName}
                label={`${s.roleName}: ${s.used}/${s.max}`}
                size="small"
                color={s.used >= s.max ? "error" : "default"}
                variant="outlined"
              />
            ))}
          </SoftBox>
        )}

        {/* Mensajes */}
        {error && (
          <SoftBox mb={2} p={1.5} borderRadius="8px" sx={{ background: "#fff3f3", border: "1px solid #f5c6cb" }}>
            <SoftTypography variant="caption" color="error">{error}</SoftTypography>
          </SoftBox>
        )}
        {success && (
          <SoftBox mb={2} p={1.5} borderRadius="8px" sx={{ background: "#f0fff4", border: "1px solid #b7dfc5" }}>
            <SoftTypography variant="caption" sx={{ color: "#2e7d32" }}>{success}</SoftTypography>
          </SoftBox>
        )}

        {/* Formulario de creación */}
        {showForm && (
          <SoftBox
            component="form"
            onSubmit={handleCreate}
            mb={3}
            p={2.5}
            borderRadius="12px"
            sx={{ background: "#f8f9fa", border: "1px solid #e0e0e0" }}
          >
            <SoftTypography variant="subtitle2" fontWeight="bold" mb={2}>
              Nuevo miembro
            </SoftTypography>
            <SoftBox display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" }} gap={2}>
              <LabeledInput label="Nombre">
                <SoftInput
                  placeholder="Nombre completo"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </LabeledInput>
              <LabeledInput label="Email">
                <SoftInput
                  type="email"
                  placeholder="correo@empresa.com"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </LabeledInput>
              <LabeledInput label="Contraseña">
                <SoftInput
                  type="password"
                  placeholder="Contraseña temporal"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required
                />
              </LabeledInput>
              <LabeledInput label="Rol">
                <FormControl fullWidth size="small">
                  <Select
                    value={form.roleName}
                    onChange={e => setForm(p => ({ ...p, roleName: e.target.value }))}
                    displayEmpty
                    sx={{ fontSize: "14px", borderRadius: "8px", background: "#fff" }}
                  >
                    <MenuItem value="" disabled>Seleccionar rol</MenuItem>
                    {availableSlots.map(s => (
                      <MenuItem key={s.roleName} value={s.roleName}>
                        {s.roleName} ({s.used}/{s.max})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </LabeledInput>
            </SoftBox>
            <SoftBox display="flex" justifyContent="flex-end" mt={2}>
              <SoftButton type="submit" color="dark" size="small" disabled={submitting}>
                {submitting ? <CircularProgress size={16} color="inherit" /> : "Crear miembro"}
              </SoftButton>
            </SoftBox>
          </SoftBox>
        )}

        {/* Plan sin slots disponibles */}
        {!loading && slots.length === 0 && (
          <SoftBox p={3} borderRadius="12px" sx={{ background: "#f8f9fa", border: "1px solid #e0e0e0", textAlign: "center" }}>
            <SoftTypography variant="body2" color="text">
              Tu plan actual no incluye miembros de equipo adicionales.
            </SoftTypography>
            <SoftTypography variant="caption" color="text">
              Actualiza tu plan para agregar colaboradores.
            </SoftTypography>
          </SoftBox>
        )}

        {/* Tabla de miembros */}
        {members.length > 0 && (
          <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: "12px" }}>
            <Table size="small">
              <TableHead sx={{ background: "#f8f9fa" }}>
                <TableRow>
                  {["Nombre", "Email", "Rol", "Estado", "Creado", ""].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 600, fontSize: "12px", color: "#637381" }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ fontSize: "13px", fontWeight: 500 }}>{m.name}</TableCell>
                    <TableCell sx={{ fontSize: "13px", color: "#637381" }}>{m.email}</TableCell>
                    <TableCell>
                      <Chip label={m.role?.name || "—"} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={m.isActive ? "Activo" : "Inactivo"}
                        size="small"
                        color={m.isActive ? "success" : "default"}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: "12px", color: "#637381" }}>
                      {new Date(m.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Eliminar">
                        <IconButton size="small" onClick={() => handleDelete(m.id, m.name)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {loading && (
          <SoftBox display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </SoftBox>
        )}

        {!loading && members.length === 0 && slots.length > 0 && (
          <SoftBox p={3} borderRadius="12px" sx={{ background: "#f8f9fa", border: "1px solid #e0e0e0", textAlign: "center" }}>
            <SoftTypography variant="body2" color="text">
              Aún no tienes miembros en tu equipo.
            </SoftTypography>
          </SoftBox>
        )}

      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}
