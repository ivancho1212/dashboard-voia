// @mui material components
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Layout and navbar/footer
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

// React y axios
import React, { useEffect, useState } from "react";
import axios from "axios";
import { getAllPlansForAdmin, deletePlan, getAiProviders } from "services/planService";

// Material UI Icons
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Switch, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Chip
} from "@mui/material";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// Definición fija de la URL base de la API
const API_URL = "http://localhost:5006/api/plans";


function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    price: "",
    maxTokens: "",
    botsLimit: "",
    fileUploadLimit: "",
    aiProviders: [],
    customStyles: false,
    dataCaptureLimit: "",
    analyticsDashboard: false,
    prioritySupport: false,
    integrationApi: false,
    isActive: true,
  });

  // AI Providers desde la DB
  const [aiProvidersDb, setAiProvidersDb] = useState([]);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchPlans();
    fetchAiProviders();
  }, []);

  // Obtener AI Providers desde el servicio centralizado
  const fetchAiProviders = async () => {
    try {
      const data = await getAiProviders();
      setAiProvidersDb(Array.isArray(data) ? data : []);
    } catch (e) {
      setAiProvidersDb([]);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await getAllPlansForAdmin();
      setPlans(data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPlan((prev) => ({
      ...prev,
      [name]: type === "checkbox" || type === "switch" ? checked : value,
    }));
  };

  const handleAiProvidersChange = (event) => {
    const { value } = event.target;
    setNewPlan((prev) => ({ ...prev, aiProviders: typeof value === 'string' ? value.split(',') : value }));
  };

  const createPlan = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
  setSnackbar({ open: true, message: "No se encontró el token de autenticación.", severity: 'error' });
      return;
    }

    try {
  await axios.post(
        API_URL,
        {
          ...newPlan,
          price: Number(newPlan.price),
          maxTokens: Number(newPlan.maxTokens),
          botsLimit: Number(newPlan.botsLimit),
          fileUploadLimit: newPlan.fileUploadLimit ? Number(newPlan.fileUploadLimit) : null,
          aiProviders: JSON.stringify(newPlan.aiProviders),
          customStyles: !!newPlan.customStyles,
          dataCaptureLimit: newPlan.dataCaptureLimit ? Number(newPlan.dataCaptureLimit) : null,
          analyticsDashboard: !!newPlan.analyticsDashboard,
          prioritySupport: !!newPlan.prioritySupport,
          integrationApi: !!newPlan.integrationApi,
          isActive: !!newPlan.isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

  setSnackbar({ open: true, message: "✅ Plan creado correctamente.", severity: 'success' });
      setNewPlan({
        name: "",
        description: "",
        price: "",
        maxTokens: "",
        botsLimit: "",
        fileUploadLimit: "",
        aiProviders: [],
        customStyles: false,
        dataCaptureLimit: "",
        analyticsDashboard: false,
        prioritySupport: false,
        integrationApi: false,
        isActive: true,
      });
      setShowForm(false);
      fetchPlans();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Error al crear el plan.";
  setSnackbar({ open: true, message: `❌ ${errorMsg}`, severity: 'error' });
      console.error("❌ Error al crear el plan:", error);
    }
  };

  const startEdit = (plan) => {
    setEditingId(plan.id);
    setEditData(plan);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId) {
  setSnackbar({ open: true, message: "Error interno: ID del plan no encontrado.", severity: 'error' });
      return;
    }

    const parsedPrice = Number(editData.price);
    const parsedMaxTokens = Number(editData.maxTokens);
    const parsedBotsLimit = Number(editData.botsLimit);

    if (isNaN(parsedPrice) || isNaN(parsedMaxTokens) || isNaN(parsedBotsLimit)) {
  setSnackbar({ open: true, message: "Por favor ingresa valores numéricos válidos en precio, tokens y límite de bots.", severity: 'error' });
      return;
    }

    // ✅ OBTENER EL TOKEN DEL LOCALSTORAGE
    const token = localStorage.getItem("token");

    if (!token) {
  setSnackbar({ open: true, message: "No se encontró el token de autenticación.", severity: 'error' });
      return;
    }

    try {
      await axios.put(
        `${API_URL}/${editingId}`,
        {
          ...editData,
          price: parsedPrice,
          maxTokens: parsedMaxTokens,
          botsLimit: parsedBotsLimit,
          fileUploadLimit: editData.fileUploadLimit ? Number(editData.fileUploadLimit) : null,
          aiProviders: JSON.stringify(editData.aiProviders),
          customStyles: !!editData.customStyles,
          dataCaptureLimit: editData.dataCaptureLimit ? Number(editData.dataCaptureLimit) : null,
          analyticsDashboard: !!editData.analyticsDashboard,
          prioritySupport: !!editData.prioritySupport,
          integrationApi: !!editData.integrationApi,
          isActive: !!editData.isActive,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

  setSnackbar({ open: true, message: "✅ Plan actualizado correctamente.", severity: 'success' });
      setEditingId(null);
      setEditData({});
      fetchPlans();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Error al actualizar el plan.";
  setSnackbar({ open: true, message: `❌ ${errorMsg}`, severity: 'error' });
      console.error("❌ Error al hacer PUT:", error);
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleDelete = async (planId) => {
    try {
      // Paso 1: Desactivar el plan
      await planService.updatePlan(planId, { active: false });

      // Paso 2: Ahora sí eliminar
      await planService.deletePlan(planId);

      // Opcional: refrescar la lista de planes
      fetchPlans();
    } catch (error) {
      console.error("Error al eliminar el plan:", error.message || error);
    }
  };

  return (
    <DashboardLayout>
      {/* Snackbar para feedback visual */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <DashboardNavbar />

      <SoftBox py={3} px={3}></SoftBox>
      <SoftTypography variant="h4" fontWeight="bold" gutterBottom>
        Administración de Planes
      </SoftTypography>

      {loading ? (
        <SoftTypography>Cargando planes...</SoftTypography>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#f5f5f5' }}>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Max Tokens</TableCell>
                <TableCell>Bots Límite</TableCell>
                <TableCell>File Upload (MB)</TableCell>
                <TableCell>AI Providers</TableCell>
                <TableCell>Custom Styles</TableCell>
                <TableCell>Data Capture</TableCell>
                <TableCell>Analytics</TableCell>
                <TableCell>Priority Support</TableCell>
                <TableCell>API Ext</TableCell>
                <TableCell>Activo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan) => {
                // Parse aiProviders if string
                let aiProviders = plan.aiProviders;
                if (typeof aiProviders === 'string') {
                  try { aiProviders = JSON.parse(aiProviders); } catch { aiProviders = []; }
                }
                return (
                <TableRow
                  key={plan.id}
                  style={
                    plan.isActive
                      ? { background: '#fff', color: '#222' }
                      : { background: '#e0e0e0', color: '#757575' }
                  }
                >
                  {editingId === plan.id ? (
                    <>
                      <TableCell><TextField name="name" value={editData.name} onChange={handleEditChange} size="small" /></TableCell>
                      <TableCell><TextField name="description" value={editData.description} onChange={handleEditChange} size="small" /></TableCell>
                      <TableCell><TextField type="number" name="price" value={editData.price} onChange={handleEditChange} size="small" /></TableCell>
                      <TableCell><TextField type="number" name="maxTokens" value={editData.maxTokens} onChange={handleEditChange} size="small" /></TableCell>
                      <TableCell><TextField type="number" name="botsLimit" value={editData.botsLimit} onChange={handleEditChange} size="small" /></TableCell>
                      <TableCell><TextField type="number" name="fileUploadLimit" value={editData.fileUploadLimit} onChange={handleEditChange} size="small" /></TableCell>
                      <TableCell>
                        <Select
                          multiple
                          value={editData.aiProviders || []}
                          onChange={e => setEditData(prev => ({ ...prev, aiProviders: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value }))}
                          input={<OutlinedInput label="AI Providers" />}
                          renderValue={selected => (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                              {selected.map((v) => (<Chip key={v} label={v} size="small" />))}
                            </div>
                          )}
                          size="small"
                        >
                          {AI_PROVIDERS.map((prov) => (
                            <MenuItem key={prov} value={prov}>{prov}</MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell><Switch checked={!!editData.customStyles} onChange={e => setEditData(prev => ({ ...prev, customStyles: e.target.checked }))} /></TableCell>
                      <TableCell><TextField type="number" name="dataCaptureLimit" value={editData.dataCaptureLimit} onChange={handleEditChange} size="small" /></TableCell>
                      <TableCell><Switch checked={!!editData.analyticsDashboard} onChange={e => setEditData(prev => ({ ...prev, analyticsDashboard: e.target.checked }))} /></TableCell>
                      <TableCell><Switch checked={!!editData.prioritySupport} onChange={e => setEditData(prev => ({ ...prev, prioritySupport: e.target.checked }))} /></TableCell>
                      <TableCell><Switch checked={!!editData.integrationApi} onChange={e => setEditData(prev => ({ ...prev, integrationApi: e.target.checked }))} /></TableCell>
                      <TableCell><Switch checked={!!editData.isActive} onChange={e => setEditData(prev => ({ ...prev, isActive: e.target.checked }))} /></TableCell>
                      <TableCell>
                        <Tooltip title="Guardar">
                          <IconButton onClick={saveEdit} color="success" size="small"><CheckIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton onClick={cancelEdit} color="error" size="small"><CloseIcon /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>{plan.description}</TableCell>
                      <TableCell>{plan.price?.toLocaleString ? plan.price.toLocaleString("es-CO", { style: "currency", currency: "COP" }) : plan.price}</TableCell>
                      <TableCell>{plan.maxTokens}</TableCell>
                      <TableCell>{plan.botsLimit}</TableCell>
                      <TableCell>{plan.fileUploadLimit}</TableCell>
                      <TableCell>{Array.isArray(aiProviders) ? aiProviders.join(', ') : ''}</TableCell>
                      <TableCell>{plan.customStyles ? 'Sí' : 'No'}</TableCell>
                      <TableCell>{plan.dataCaptureLimit}</TableCell>
                      <TableCell>{plan.analyticsDashboard ? 'Sí' : 'No'}</TableCell>
                      <TableCell>{plan.prioritySupport ? 'Sí' : 'No'}</TableCell>
                      <TableCell>{plan.integrationApi ? 'Sí' : 'No'}</TableCell>
                      <TableCell>{plan.isActive ? 'Sí' : 'No'}</TableCell>
                      <TableCell>
                        <Tooltip title="Editar">
                          <IconButton onClick={() => startEdit(plan)} color="primary" size="small"><EditIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton onClick={() => handleDelete(plan.id)} color="error" size="small"><DeleteIcon /></IconButton>
                        </Tooltip>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <SoftTypography variant="h5" mb={2} mt={5}>
        {showForm ? "Cerrar formulario" : "Crear Nuevo Plan"}{" "}
        <IconButton onClick={() => setShowForm(!showForm)} color="primary">
          {showForm ? <CloseIcon /> : <AddIcon />}
        </IconButton>
      </SoftTypography>



      {showForm && (
        <Card sx={{ p: 4, borderRadius: 3, boxShadow: 2, background: '#fff', width: '100%', maxWidth: '100vw', margin: '0 auto', mt: 2 }}>
          <form onSubmit={createPlan} autoComplete="off">
            <Grid container spacing={2} alignItems="flex-start">
              {/* Inputs principales */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={6}>
                    <TextField
                      placeholder="Nombre del plan"
                      name="name"
                      value={newPlan.name}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      required
                      InputProps={{
                        style: {
                          fontSize: 13,
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: '#495057',
                          borderRadius: 8,
                          background: '#fff',
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: 13,
                          padding: '14px 12px',
                          color: '#495057',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#b0b0b0',
                          opacity: 1,
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                          appearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={6}>
                    <TextField
                      placeholder="Descripción"
                      name="description"
                      value={newPlan.description}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      required
                      InputProps={{
                        style: {
                          fontSize: 13,
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: '#495057',
                          borderRadius: 8,
                          background: '#fff',
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: 13,
                          padding: '14px 12px',
                          color: '#495057',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#b0b0b0',
                          opacity: 1,
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                          appearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={4}>
                    <TextField
                      placeholder="Precio"
                      name="price"
                      type="number"
                      value={newPlan.price}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      required
                      InputProps={{
                        style: {
                          fontSize: 13,
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: '#495057',
                          borderRadius: 8,
                          background: '#fff',
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: 13,
                          padding: '14px 12px',
                          color: '#495057',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#b0b0b0',
                          opacity: 1,
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                          appearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={4}>
                    <TextField
                      placeholder="Max Tokens"
                      name="maxTokens"
                      type="number"
                      value={newPlan.maxTokens}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      required
                      InputProps={{
                        style: {
                          fontSize: 13,
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: '#495057',
                          borderRadius: 8,
                          background: '#fff',
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: 13,
                          padding: '14px 12px',
                          color: '#495057',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#b0b0b0',
                          opacity: 1,
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                          appearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} md={4}>
                    <TextField
                      placeholder="Límite Bots"
                      name="botsLimit"
                      type="number"
                      value={newPlan.botsLimit}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      required
                      InputProps={{
                        style: {
                          fontSize: 13,
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: '#495057',
                          borderRadius: 8,
                          background: '#fff',
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: 13,
                          padding: '14px 12px',
                          color: '#495057',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#b0b0b0',
                          opacity: 1,
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                          appearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={6}>
                    <TextField
                      placeholder="Tamaño máx. archivo (MB)"
                      name="fileUploadLimit"
                      type="number"
                      value={newPlan.fileUploadLimit}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      InputProps={{
                        style: {
                          fontSize: 13,
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: '#495057',
                          borderRadius: 8,
                          background: '#fff',
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: 13,
                          padding: '14px 12px',
                          color: '#495057',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#b0b0b0',
                          opacity: 1,
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                          appearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={6}>
                    <TextField
                      placeholder="Campos de captura de datos"
                      name="dataCaptureLimit"
                      type="number"
                      value={newPlan.dataCaptureLimit}
                      onChange={handleInputChange}
                      fullWidth
                      size="small"
                      InputProps={{
                        style: {
                          fontSize: 13,
                          textAlign: 'left',
                          padding: '14px 16px',
                          color: '#495057',
                          borderRadius: 8,
                          background: '#fff',
                        },
                      }}
                      sx={{
                        '& .MuiInputBase-input': {
                          fontSize: 13,
                          padding: '14px 12px',
                          color: '#495057',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: '#b0b0b0',
                          opacity: 1,
                        },
                        '& input[type=number]': {
                          MozAppearance: 'textfield',
                          appearance: 'textfield',
                        },
                        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Grid>
              {/* Select AI Providers */}
              <Grid item xs={12}>
                <FormControl fullWidth variant="standard" sx={{ mt: 1, mb: 1 }}>
                  <Select
                    displayEmpty
                    labelId="ai-providers-label"
                    id="ai-providers-select"
                    multiple
                    value={newPlan.aiProviders}
                    onChange={handleAiProvidersChange}
                    input={<OutlinedInput notched label="Proveedor de IA" />}
                    renderValue={selected =>
                      selected.length === 0
                        ? <span style={{ color: '#b0b0b0', fontSize: 13 }}>Proveedor de IA</span>
                        : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{selected.map((v) => (<Chip key={v} label={v} size="small" />))}</div>
                    }
                    sx={{
                      fontSize: 13,
                      background: '#fff',
                      borderRadius: 2,
                      mt: 0.5,
                      '& .MuiSelect-select': {
                        padding: '14px 12px',
                        fontSize: 13,
                        color: '#495057',
                      },
                    }}
                  >
                    <MenuItem value="" disabled>
                      <span style={{ color: '#b0b0b0', fontSize: 13 }}>Proveedor de IA</span>
                    </MenuItem>
                    {aiProvidersDb.length === 0 ? (
                      <MenuItem value="" disabled>No hay proveedores disponibles</MenuItem>
                    ) : (
                      aiProvidersDb.map((prov) => (
                        <MenuItem key={prov.id || prov.name || prov} value={prov.name || prov}>{prov.name || prov}</MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              {/* Switches debajo de los inputs */}
              <Grid item xs={12}>
                <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 0.5, mt: -1, width: '100%' }}>
                  <Grid item xs={12} sm={2} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!newPlan.customStyles}
                          onChange={handleInputChange}
                          name="customStyles"
                          size="small"
                          sx={{ color: '#344767', p: 0 }}
                        />
                      }
                      label={<span style={{ fontWeight: 400, color: '#344767', fontSize: 11 }}>Custom Styles</span>}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!newPlan.analyticsDashboard}
                          onChange={handleInputChange}
                          name="analyticsDashboard"
                          size="small"
                          sx={{ color: '#344767', p: 0 }}
                        />
                      }
                      label={<span style={{ fontWeight: 400, color: '#344767', fontSize: 11 }}>Analytics</span>}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!newPlan.prioritySupport}
                          onChange={handleInputChange}
                          name="prioritySupport"
                          size="small"
                          sx={{ color: '#344767', p: 0 }}
                        />
                      }
                      label={<span style={{ fontWeight: 400, color: '#344767', fontSize: 11 }}>Priority Support</span>}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2} md={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!newPlan.integrationApi}
                          onChange={handleInputChange}
                          name="integrationApi"
                          size="small"
                          sx={{ color: '#344767', p: 0 }}
                        />
                      }
                      label={<span style={{ fontWeight: 400, color: '#344767', fontSize: 11 }}>API Ext</span>}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2} md={2} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!newPlan.isActive}
                          onChange={handleInputChange}
                          name="isActive"
                          size="small"
                          sx={{ color: '#344767', p: 0 }}
                        />
                      }
                      label={<span style={{ fontWeight: 400, color: '#344767', fontSize: 11, verticalAlign: 'middle', display: 'inline-block' }}>Activo</span>}
                      sx={{ m: 0, p: 0, alignItems: 'center', justifyContent: 'center', display: 'flex' }}
                      labelPlacement="end"
                    />
                  </Grid>
                </Grid>
              </Grid>
              {/* Botón */}
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="small"
                  sx={{
                    minWidth: 120,
                    height: '38px',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    borderRadius: 2,
                    boxShadow: 1,
                    textTransform: 'none',
                    px: 2
                  }}
                >
                  CREAR PLAN
                </Button>
              </Grid>
            </Grid>
          </form>
        </Card>
      )}



      <Footer />
    </DashboardLayout>
  );
}

export default AdminPlans;
