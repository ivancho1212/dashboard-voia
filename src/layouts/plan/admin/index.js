import PropTypes from "prop-types";
// @mui material components
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

// Layout and navbar/footer
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// React y axios
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAllPlansForAdmin, deletePlan, updatePlan, getAiProviders } from "services/planService";

// Material UI Icons
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Button, FormControlLabel, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Switch, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Chip
} from "@mui/material";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const API_URL = "http://localhost:5006/api/plans";

// Mapa de features booleanos: clave → etiqueta corta
const FEATURE_DEFS = [
  { key: "allowAiWidget",            label: "IA Widget" },
  { key: "allowVectorSearch",        label: "RAG" },
  { key: "allowTrainingUrls",        label: "URLs Train." },
  { key: "allowCustomTheme",         label: "Tema Custom" },
  { key: "allowMobileVersion",       label: "Móvil" },
  { key: "allowDataCaptureEndpoint", label: "Captación API" },
  { key: "customStyles",             label: "Custom Styles" },
  { key: "analyticsDashboard",       label: "Analytics" },
  { key: "prioritySupport",          label: "P. Support" },
  { key: "integrationApi",           label: "API Ext." },
];

// Chips de funciones habilitadas (solo muestra las activas)
function FeatureChips({ plan }) {
  const enabled = FEATURE_DEFS.filter(f => !!plan[f.key]);
  if (enabled.length === 0) return <span style={{ color: '#999', fontSize: 11 }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {enabled.map(f => (
        <Chip key={f.key} label={f.label} size="small"
          sx={{ fontSize: 10, height: 20, bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 600 }} />
      ))}
    </div>
  );
}

FeatureChips.propTypes = { plan: PropTypes.object.isRequired };

// Switches de funciones en modo edición (compactos en una sola celda)
function FeatureSwitches({ editData, setEditData }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', minWidth: 200 }}>
      {FEATURE_DEFS.map(f => (
        <FormControlLabel key={f.key}
          sx={{ m: 0 }}
          control={
            <Switch size="small" checked={!!editData[f.key]}
              onChange={e => setEditData(prev => ({ ...prev, [f.key]: e.target.checked }))} />
          }
          label={<span style={{ fontSize: 10, color: '#344767' }}>{f.label}</span>}
        />
      ))}
    </div>
  );
}

FeatureSwitches.propTypes = { editData: PropTypes.object.isRequired, setEditData: PropTypes.func.isRequired };

const EMPTY_PLAN = {
  name: "", description: "", price: "", maxTokens: "", botsLimit: "",
  usersLimit: "", fileUploadLimit: "", aiProviders: [], customStyles: false,
  dataCaptureLimit: "", analyticsDashboard: false, prioritySupport: false,
  integrationApi: false, allowAiWidget: true, allowMobileVersion: true,
  allowDataCaptureEndpoint: true, allowCustomTheme: true, allowTrainingUrls: true,
  allowVectorSearch: true, maxConversationsPerMonth: "", isActive: true,
  roleSlots: {}, // { "Admin": 1, "Comercial": 2 }
};

// Convierte el JSON de roleSlots a un array editable: [{role, count}]
function parseSlotsToArray(roleSlots) {
  if (!roleSlots) return [];
  try {
    const obj = typeof roleSlots === "string" ? JSON.parse(roleSlots) : roleSlots;
    return Object.entries(obj).map(([role, count]) => ({ role, count }));
  } catch { return []; }
}
// Convierte el array editable de vuelta al objeto JSON
function slotArrayToObject(arr) {
  return arr.reduce((acc, { role, count }) => {
    if (role) acc[role] = Number(count) || 1;
    return acc;
  }, {});
}

// Widget editable de role slots
function RoleSlotsEditor({ slots, setSlots, availableRoles }) {
  const addRow = () => setSlots(prev => [...prev, { role: "", count: 1 }]);
  const removeRow = (i) => setSlots(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (i, field, val) =>
    setSlots(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  return (
    <div>
      {slots.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
          <select
            value={row.role}
            onChange={e => updateRow(i, "role", e.target.value)}
            style={{ flex: 2, padding: "8px 10px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, color: "#495057" }}
          >
            <option value="">— Seleccionar rol —</option>
            {availableRoles.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
          <input
            type="number" min={0} value={row.count}
            onChange={e => updateRow(i, "count", e.target.value)}
            style={{ flex: 1, padding: "8px", borderRadius: 6, border: "1px solid #ccc", fontSize: 13, color: "#495057", width: 70 }}
            title="0 = ilimitado"
          />
          <span style={{ fontSize: 10, color: "#999", whiteSpace: "nowrap" }}>0=∞</span>
          <IconButton size="small" onClick={() => removeRow(i)} sx={{ color: "#e53935" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      ))}
      <Button size="small" variant="outlined" onClick={addRow}
        startIcon={<AddIcon />}
        sx={{ fontSize: 11, textTransform: "none", mt: 0.5, borderColor: "#ccc", color: "#555" }}>
        Agregar rol
      </Button>
    </div>
  );
}
RoleSlotsEditor.propTypes = {
  slots: PropTypes.array.isRequired,
  setSlots: PropTypes.func.isRequired,
  availableRoles: PropTypes.array.isRequired,
};

function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [newPlan, setNewPlan] = useState({ ...EMPTY_PLAN });
  const [aiProvidersDb, setAiProvidersDb] = useState([]);
  const [rolesDb, setRolesDb] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  // Slots de roles para create form
  const [newRoleSlots, setNewRoleSlots] = useState([]);
  // Slots de roles para edit form
  const [editRoleSlots, setEditRoleSlots] = useState([]);

  useEffect(() => { fetchPlans(); fetchAiProviders(); fetchRoles(); }, []);

  const fetchAiProviders = async () => {
    try { const data = await getAiProviders(); setAiProvidersDb(Array.isArray(data) ? data : []); }
    catch { setAiProvidersDb([]); }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5006/api/Roles/names", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setRolesDb(Array.isArray(data) ? data : []); }
      else { console.error("fetchRoles failed:", res.status, await res.text()); }
    } catch (e) { console.error("fetchRoles error:", e); setRolesDb([]); }
  };

  const fetchPlans = async () => {
    try { const data = await getAllPlansForAdmin(); setPlans(data); }
    catch (error) { console.error("Error fetching plans:", error); }
    finally { setLoading(false); }
  };

  const buildPayload = (data, roleSlotsArr) => ({
    ...data,
    roleSlots: roleSlotsArr && roleSlotsArr.length > 0
      ? JSON.stringify(slotArrayToObject(roleSlotsArr))
      : null,
    price: Number(data.price),
    maxTokens: Number(data.maxTokens),
    botsLimit: Number(data.botsLimit),
    usersLimit: data.usersLimit ? Number(data.usersLimit) : null,
    fileUploadLimit: data.fileUploadLimit ? Number(data.fileUploadLimit) : null,
    aiProviders: JSON.stringify(data.aiProviders),
    dataCaptureLimit: data.dataCaptureLimit ? Number(data.dataCaptureLimit) : null,
    maxConversationsPerMonth: data.maxConversationsPerMonth ? Number(data.maxConversationsPerMonth) : null,
    customStyles: !!data.customStyles, analyticsDashboard: !!data.analyticsDashboard,
    prioritySupport: !!data.prioritySupport, integrationApi: !!data.integrationApi,
    allowAiWidget: !!data.allowAiWidget, allowMobileVersion: !!data.allowMobileVersion,
    allowDataCaptureEndpoint: !!data.allowDataCaptureEndpoint, allowCustomTheme: !!data.allowCustomTheme,
    allowTrainingUrls: !!data.allowTrainingUrls, allowVectorSearch: !!data.allowVectorSearch,
    isActive: !!data.isActive,
  });

  const createPlan = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) { setSnackbar({ open: true, message: "No se encontró el token.", severity: 'error' }); return; }
    try {
      await axios.post(API_URL, buildPayload(newPlan, newRoleSlots), { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      setSnackbar({ open: true, message: "✅ Plan creado correctamente.", severity: 'success' });
      setNewPlan({ ...EMPTY_PLAN });
      setNewRoleSlots([]);
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      setSnackbar({ open: true, message: `❌ ${error?.response?.data?.message || "Error al crear el plan."}`, severity: 'error' });
    }
  };

  const startEdit = (plan) => {
    let aiProviders = plan.aiProviders;
    if (typeof aiProviders === 'string') { try { aiProviders = JSON.parse(aiProviders); } catch { aiProviders = []; } }
    setEditingId(plan.id);
    setEditData({ ...plan, aiProviders: Array.isArray(aiProviders) ? aiProviders : [] });
    setEditRoleSlots(parseSlotsToArray(plan.roleSlots));
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); setEditRoleSlots([]); };

  const saveEdit = async () => {
    if (!editingId) return;
    const token = localStorage.getItem("token");
    if (!token) { setSnackbar({ open: true, message: "No se encontró el token.", severity: 'error' }); return; }
    try {
      await axios.put(`${API_URL}/${editingId}`, buildPayload(editData, editRoleSlots), { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      setSnackbar({ open: true, message: "✅ Plan actualizado correctamente.", severity: 'success' });
      setEditingId(null); setEditData({}); setEditRoleSlots([]);
      fetchPlans();
    } catch (error) {
      setSnackbar({ open: true, message: `❌ ${error?.response?.data?.message || "Error al actualizar el plan."}`, severity: 'error' });
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleDelete = async (planId) => {
    setLoadingDelete(true);
    try {
      await deletePlan(planId);
      setSnackbar({ open: true, message: "Plan eliminado correctamente.", severity: "success" });
      fetchPlans();
    } catch (error) {
      setSnackbar({ open: true, message: `❌ ${error?.response?.data?.message || error.message || "Error al eliminar."}`, severity: "error" });
    } finally { setLoadingDelete(false); }
  };

  const LabeledInput = ({ label, required, children }) => (
    <SoftBox mb={0}>
      <SoftBox mb={0.5} ml={0.5}>
        <SoftTypography component="label" variant="caption" fontWeight="bold" color="text">
          {label}{required && <span style={{ color: '#e53935' }}> *</span>}
        </SoftTypography>
      </SoftBox>
      {children}
    </SoftBox>
  );
  LabeledInput.propTypes = { label: PropTypes.string.isRequired, required: PropTypes.bool, children: PropTypes.node.isRequired };

  // Shared plan form (create or edit)
  const PlanForm = ({ data, setData, roleSlots, setRoleSlots, onSubmit, onCancel, submitLabel }) => (
    <form onSubmit={onSubmit} autoComplete="off">
      <Grid container spacing={2} alignItems="flex-start">
        {/* Nombre y descripción */}
        <Grid item xs={12} sm={6}>
          <LabeledInput label="Nombre del plan" required>
            <SoftInput placeholder="Ej: Plan Profesional" value={data.name} onChange={e => setData(p => ({ ...p, name: e.target.value }))} required />
          </LabeledInput>
        </Grid>
        <Grid item xs={12} sm={6}>
          <LabeledInput label="Descripción">
            <SoftInput placeholder="Descripción breve" value={data.description || ''} onChange={e => setData(p => ({ ...p, description: e.target.value }))} />
          </LabeledInput>
        </Grid>

        {/* Límites numéricos */}
        <Grid item xs={6} sm={4} md={2}>
          <LabeledInput label="Precio (COP)" required>
            <SoftInput type="number" placeholder="0" value={data.price} onChange={e => setData(p => ({ ...p, price: e.target.value }))} required />
          </LabeledInput>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <LabeledInput label="Max Tokens" required>
            <SoftInput type="number" placeholder="5000" value={data.maxTokens} onChange={e => setData(p => ({ ...p, maxTokens: e.target.value }))} required />
          </LabeledInput>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <LabeledInput label="Bots" required>
            <SoftInput type="number" placeholder="1" value={data.botsLimit} onChange={e => setData(p => ({ ...p, botsLimit: e.target.value }))} required />
          </LabeledInput>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <LabeledInput label="Conv./Mes">
            <SoftInput type="number" placeholder="∞ vacío" value={data.maxConversationsPerMonth ?? ''} onChange={e => setData(p => ({ ...p, maxConversationsPerMonth: e.target.value }))} />
          </LabeledInput>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <LabeledInput label="Usuarios">
            <SoftInput type="number" placeholder="∞ vacío" value={data.usersLimit ?? ''} onChange={e => setData(p => ({ ...p, usersLimit: e.target.value }))} />
          </LabeledInput>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <LabeledInput label="Archivos (MB)">
            <SoftInput type="number" placeholder="∞ vacío" value={data.fileUploadLimit ?? ''} onChange={e => setData(p => ({ ...p, fileUploadLimit: e.target.value }))} />
          </LabeledInput>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <LabeledInput label="Captura campos">
            <SoftInput type="number" placeholder="∞ vacío" value={data.dataCaptureLimit ?? ''} onChange={e => setData(p => ({ ...p, dataCaptureLimit: e.target.value }))} />
          </LabeledInput>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <LabeledInput label="Proveedores de IA">
            <Select multiple value={Array.isArray(data.aiProviders) ? data.aiProviders : []}
              onChange={e => setData(p => ({ ...p, aiProviders: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }))}
              input={<OutlinedInput />}
              renderValue={sel => {
                const arr = Array.isArray(sel) ? sel : [];
                return arr.length === 0
                  ? <span style={{ color: '#b0b0b0', fontSize: 13 }}>Todos los proveedores</span>
                  : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{arr.map(v => <Chip key={v} label={v} size="small" />)}</div>;
              }}
              sx={{ width: '100%', fontSize: 13, background: '#fff', border: '1px solid #d2d6da', borderRadius: '0.5rem', '.MuiOutlinedInput-notchedOutline': { border: 'none' }, minHeight: 44 }}>
              {aiProvidersDb.length === 0
                ? <MenuItem disabled>No hay proveedores disponibles</MenuItem>
                : aiProvidersDb.map(p => <MenuItem key={p.id || p.name || p} value={p.name || p}>{p.name || p}</MenuItem>)}
            </Select>
          </LabeledInput>
        </Grid>

        {/* Funciones */}
        <Grid item xs={12}>
          <SoftBox mb={0.5} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold" color="text">
              Funciones habilitadas
            </SoftTypography>
          </SoftBox>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2px 0', background: '#f8f9fa', borderRadius: 8, padding: '12px 16px', border: '1px solid #e9ecef' }}>
            {[
              { name: "allowAiWidget",            label: "IA Widget" },
              { name: "allowVectorSearch",        label: "RAG / Búsqueda vectorial" },
              { name: "allowTrainingUrls",        label: "Entrenamiento por URLs" },
              { name: "allowCustomTheme",         label: "Uploads en widget" },
              { name: "allowMobileVersion",       label: "Versión móvil" },
              { name: "allowDataCaptureEndpoint", label: "Captación API" },
              { name: "customStyles",             label: "Estilos personalizados" },
              { name: "analyticsDashboard",       label: "Analytics" },
              { name: "prioritySupport",          label: "Soporte prioritario" },
              { name: "integrationApi",           label: "API externa" },
              { name: "isActive",                 label: "Plan activo" },
            ].map(({ name, label }) => (
              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 0' }}>
                <Checkbox
                  size="small"
                  checked={!!data[name]}
                  onChange={e => setData(p => ({ ...p, [name]: e.target.checked }))}
                  sx={{ p: 0.25, color: '#d2d6da', '&.Mui-checked': { color: '#344767' } }}
                />
                <span style={{ fontSize: 13, color: '#344767', userSelect: 'none' }}>{label}</span>
              </label>
            ))}
          </div>
        </Grid>

        {/* Slots de roles */}
        <Grid item xs={12}>
          <SoftBox mb={0.5} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold" color="text">
              Slots de roles
            </SoftTypography>
          </SoftBox>
          <RoleSlotsEditor slots={roleSlots} setSlots={setRoleSlots} availableRoles={rolesDb} />
          <SoftTypography variant="caption" color="secondary" sx={{ mt: 0.5, display: 'block', ml: 0.5 }}>
            Sin filas = sin restricción. Cantidad 0 = ilimitado.
          </SoftTypography>
        </Grid>

        {/* Botones */}
        <Grid item xs={12}>
          <SoftBox display="flex" gap={1.5} mt={1}>
            <SoftButton type="submit" color="dark" size="small" sx={{ minWidth: 140, fontWeight: 600, textTransform: 'none' }}>
              {submitLabel}
            </SoftButton>
            {onCancel && (
              <SoftButton type="button" color="secondary" variant="outlined" size="small" onClick={onCancel}
                sx={{ fontWeight: 500, textTransform: 'none' }}>
                Cancelar
              </SoftButton>
            )}
          </SoftBox>
        </Grid>
      </Grid>
    </form>
  );

  PlanForm.propTypes = {
    data: PropTypes.object.isRequired,
    setData: PropTypes.func.isRequired,
    roleSlots: PropTypes.array.isRequired,
    setRoleSlots: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    submitLabel: PropTypes.string.isRequired,
  };

  return (
    <DashboardLayout>
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <DashboardNavbar />
      <SoftBox py={3} px={3} />
      <SoftTypography variant="h4" fontWeight="bold" gutterBottom>
        Administración de Planes
      </SoftTypography>

      {loading ? (
        <SoftTypography>Cargando planes...</SoftTypography>
      ) : (
        <>
          {/* Tabla compacta de solo lectura */}
          <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#344767', py: 1.5 }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#344767', py: 1.5 }}>Precio</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#344767', py: 1.5 }}>Límites</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#344767', py: 1.5 }}>IA</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#344767', py: 1.5 }}>Funciones</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#344767', py: 1.5 }}>Roles</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#344767', py: 1.5 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: '#344767', py: 1.5 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {plans.map((plan) => {
                  let aiProviders = plan.aiProviders;
                  if (typeof aiProviders === 'string') { try { aiProviders = JSON.parse(aiProviders); } catch { aiProviders = []; } }
                  const isEditing = editingId === plan.id;
                  return (
                    <TableRow key={plan.id}
                      sx={{ background: isEditing ? '#f0f4ff' : (plan.isActive ? '#fff' : '#fafafa'), opacity: plan.isActive ? 1 : 0.6, '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#344767' }}>{plan.name}</div>
                        {plan.description && <div style={{ fontSize: 11, color: '#9e9e9e', marginTop: 1 }}>{plan.description}</div>}
                      </TableCell>
                      <TableCell>
                        <span style={{ fontWeight: 600, fontSize: 13, color: '#344767' }}>
                          {plan.price === 0 ? 'Gratis' : plan.price?.toLocaleString?.("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }) ?? plan.price}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: '#555' }}>
                          <span>🤖 Bots: <b>{plan.botsLimit ?? '∞'}</b></span>
                          <span>🔤 Tokens: <b>{plan.maxTokens?.toLocaleString() ?? '∞'}</b></span>
                          <span>💬 Conv/mes: <b>{plan.maxConversationsPerMonth ?? '∞'}</b></span>
                          <span>👥 Usuarios: <b>{plan.usersLimit ?? '∞'}</b></span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(aiProviders) && aiProviders.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {aiProviders.map(p => <Chip key={p} label={p} size="small" sx={{ fontSize: 10, height: 18, bgcolor: '#ede7f6', color: '#4527a0' }} />)}
                          </div>
                        ) : <span style={{ fontSize: 11, color: '#9e9e9e' }}>Todos</span>}
                      </TableCell>
                      <TableCell><FeatureChips plan={plan} /></TableCell>
                      <TableCell>
                        {(() => {
                          const slotArr = parseSlotsToArray(plan.roleSlots);
                          if (slotArr.length === 0) return <span style={{ color: '#bbb', fontSize: 11 }}>Sin restricción</span>;
                          return (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                              {slotArr.map(({ role, count }) => (
                                <Chip key={role} label={`${role} ×${count || '∞'}`} size="small"
                                  sx={{ fontSize: 10, height: 18, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }} />
                              ))}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <Chip label={plan.isActive ? 'Activo' : 'Inactivo'} size="small"
                          sx={{ fontSize: 11, fontWeight: 700, bgcolor: plan.isActive ? '#e8f5e9' : '#fafafa', color: plan.isActive ? '#2e7d32' : '#9e9e9e' }} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Editar">
                          <IconButton onClick={() => isEditing ? cancelEdit() : startEdit(plan)} color={isEditing ? "error" : "primary"} size="small">
                            {isEditing ? <CloseIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        {!isEditing && (
                          <Tooltip title="Eliminar">
                            <IconButton onClick={() => handleDelete(plan.id)} color="error" size="small" disabled={loadingDelete}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Panel de edición inline debajo de la tabla */}
          {editingId && (
            <Card sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', border: '2px solid #e3eafc', background: '#fff' }}>
              <SoftTypography variant="h6" fontWeight="bold" mb={2} sx={{ color: '#344767', display: 'flex', alignItems: 'center', gap: 1 }}>
                ✏️ Editando: {editData.name}
              </SoftTypography>
              <PlanForm
                data={editData}
                setData={setEditData}
                roleSlots={editRoleSlots}
                setRoleSlots={setEditRoleSlots}
                onSubmit={e => { e.preventDefault(); saveEdit(); }}
                onCancel={cancelEdit}
                submitLabel="Guardar cambios"
              />
            </Card>
          )}
        </>
      )}

      {/* Sección Crear Nuevo Plan */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: showForm ? 16 : 0, marginTop: 8 }}>
        <SoftTypography variant="h5" fontWeight="bold" sx={{ color: '#344767' }}>
          Crear Nuevo Plan
        </SoftTypography>
        <IconButton onClick={() => setShowForm(!showForm)} size="small"
          sx={{ bgcolor: showForm ? '#ffebee' : '#e8f5e9', color: showForm ? '#c62828' : '#2e7d32', '&:hover': { bgcolor: showForm ? '#ffcdd2' : '#c8e6c9' } }}>
          {showForm ? <CloseIcon fontSize="small" /> : <AddIcon fontSize="small" />}
        </IconButton>
      </div>

      {showForm && (
        <Card sx={{ p: 3, borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', background: '#fff', mb: 4 }}>
          <PlanForm
            data={newPlan}
            setData={setNewPlan}
            roleSlots={newRoleSlots}
            setRoleSlots={setNewRoleSlots}
            onSubmit={createPlan}
            submitLabel="Crear Plan"
          />
        </Card>
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default AdminPlans;
