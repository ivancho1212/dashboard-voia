// @mui material components
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";

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
import { getAllPlansForAdmin, deletePlan } from "services/planService"; // Ajusta la ruta según tu estructura

// Material UI Icons
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip
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
    isActive: true,
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchPlans();
  }, []);

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
      [name]: type === "checkbox" ? checked : value,
    }));
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
                <TableCell>Activo</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {plans.map((plan) => (
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
                      <TableCell>
                        <TextField name="name" value={editData.name} onChange={handleEditChange} size="small" />
                      </TableCell>
                      <TableCell>
                        <TextField name="description" value={editData.description} onChange={handleEditChange} size="small" />
                      </TableCell>
                      <TableCell>
                        <TextField type="number" name="price" value={editData.price} onChange={handleEditChange} size="small" />
                      </TableCell>
                      <TableCell>
                        <TextField type="number" name="maxTokens" value={editData.maxTokens} onChange={handleEditChange} size="small" />
                      </TableCell>
                      <TableCell>
                        <TextField type="number" name="botsLimit" value={editData.botsLimit} onChange={handleEditChange} size="small" />
                      </TableCell>
                      <TableCell>
                        <Checkbox checked={editData.isActive} onChange={handleEditChange} name="isActive" />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Guardar">
                          <IconButton onClick={saveEdit} color="success" size="small">
                            <CheckIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Cancelar">
                          <IconButton onClick={cancelEdit} color="error" size="small">
                            <CloseIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>{plan.description}</TableCell>
                      <TableCell>{plan.price.toLocaleString("es-CO", { style: "currency", currency: "COP" })}</TableCell>
                      <TableCell>{plan.maxTokens}</TableCell>
                      <TableCell>{plan.botsLimit}</TableCell>
                      <TableCell>{plan.isActive ? "Sí" : "No"}</TableCell>
                      <TableCell>
                        <Tooltip title="Editar">
                          <IconButton onClick={() => startEdit(plan)} color="primary" size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton onClick={() => handleDelete(plan.id)} color="error" size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
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
        <form onSubmit={createPlan} style={{ marginTop: 16 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                name="name"
                value={newPlan.name}
                onChange={handleInputChange}
                variant="standard"
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    '&.Mui-focused': { color: 'info.main' },
                    color: 'text.secondary',
                    fontSize: 16,
                    background: '#fff',
                    px: 0.5,
                    zIndex: 1
                  }
                }}
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                  mb: 3,
                  '& .MuiInput-underline:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:hover:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-disabled:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-focused:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  }
                }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Descripción"
                name="description"
                value={newPlan.description}
                onChange={handleInputChange}
                variant="standard"
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    '&.Mui-focused': { color: 'info.main' },
                    color: 'text.secondary',
                    fontSize: 16,
                    background: '#fff',
                    px: 0.5,
                    zIndex: 1
                  }
                }}
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                  mb: 3,
                  '& .MuiInput-underline:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:hover:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-disabled:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-focused:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  }
                }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Precio"
                name="price"
                type="number"
                value={newPlan.price}
                onChange={handleInputChange}
                variant="standard"
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    '&.Mui-focused': { color: 'info.main' },
                    color: 'text.secondary',
                    fontSize: 16,
                    background: '#fff',
                    px: 0.5,
                    zIndex: 1
                  }
                }}
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                  mb: 3,
                  '& .MuiInput-underline:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:hover:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-disabled:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-focused:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  // Oculta los spinners de number
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield'
                  }
                }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Max Tokens"
                name="maxTokens"
                type="number"
                value={newPlan.maxTokens}
                onChange={handleInputChange}
                variant="standard"
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    '&.Mui-focused': { color: 'info.main' },
                    color: 'text.secondary',
                    fontSize: 16,
                    background: '#fff',
                    px: 0.5,
                    zIndex: 1
                  }
                }}
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                  mb: 3,
                  '& .MuiInput-underline:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:hover:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-disabled:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-focused:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  // Oculta los spinners de number
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield'
                  }
                }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Límite Bots"
                name="botsLimit"
                type="number"
                value={newPlan.botsLimit}
                onChange={handleInputChange}
                variant="standard"
                InputLabelProps={{
                  shrink: true,
                  sx: {
                    '&.Mui-focused': { color: 'info.main' },
                    color: 'text.secondary',
                    fontSize: 16,
                    background: '#fff',
                    px: 0.5,
                    zIndex: 1
                  }
                }}
                sx={{
                  background: '#fff',
                  borderRadius: 1,
                  mb: 3,
                  '& .MuiInput-underline:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline:hover:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-disabled:before': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  '& .MuiInput-underline.Mui-focused:after': {
                    borderBottomColor: 'transparent !important',
                    borderBottomWidth: 0,
                  },
                  // Oculta los spinners de number
                  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0
                  },
                  '& input[type=number]': {
                    MozAppearance: 'textfield'
                  }
                }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                <Checkbox
                  checked={newPlan.isActive}
                  onChange={handleInputChange}
                  name="isActive"
                  inputProps={{ "aria-label": "Activo" }}
                  sx={{ mr: 1 }}
                />
                <span style={{ fontWeight: 700, color: '#222', fontSize: 18 }}>Activo</span>
              </div>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" type="submit" sx={{ color: '#fff' }}>
                CREAR PLAN
              </Button>
            </Grid>
          </Grid>
        </form>
      )}



      <Footer />
    </DashboardLayout>
  );
}

export default AdminPlans;
