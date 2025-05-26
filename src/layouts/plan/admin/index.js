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

  const [message, setMessage] = useState("");

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
      setMessage("No se encontró el token de autenticación.");
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

      setMessage("✅ Plan creado correctamente.");
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
      setMessage(`❌ ${errorMsg}`);
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
      setMessage("Error interno: ID del plan no encontrado.");
      return;
    }

    const parsedPrice = Number(editData.price);
    const parsedMaxTokens = Number(editData.maxTokens);
    const parsedBotsLimit = Number(editData.botsLimit);

    if (isNaN(parsedPrice) || isNaN(parsedMaxTokens) || isNaN(parsedBotsLimit)) {
      setMessage("Por favor ingresa valores numéricos válidos en precio, tokens y límite de bots.");
      return;
    }

    // ✅ OBTENER EL TOKEN DEL LOCALSTORAGE
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("No se encontró el token de autenticación.");
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

      setMessage("✅ Plan actualizado correctamente.");
      setEditingId(null);
      setEditData({});
      fetchPlans();
    } catch (error) {
      const errorMsg = error?.response?.data?.message || "Error al actualizar el plan.";
      setMessage(`❌ ${errorMsg}`);
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
      <DashboardNavbar />

      <SoftBox py={3} px={3}></SoftBox>
      <SoftTypography variant="h4" fontWeight="bold" gutterBottom>
        Administración de Planes
      </SoftTypography>

      {loading ? (
        <SoftTypography>Cargando planes...</SoftTypography>
      ) : (
        <SoftBox mb={4} overflow="auto">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Nombre",
                  "Descripción",
                  "Precio",
                  "Max Tokens",
                  "Bots Límite",
                  "Activo",
                  "Acciones",
                ].map((title) => (
                  <th key={title} style={{ border: "1px solid #ccc", padding: 8 }}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  {editingId === plan.id ? (
                    <>
                      <td>
                        <TextField name="name" value={editData.name} onChange={handleEditChange} />
                      </td>
                      <td>
                        <TextField
                          name="description"
                          value={editData.description}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          name="price"
                          value={editData.price}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          name="maxTokens"
                          value={editData.maxTokens}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <TextField
                          type="number"
                          name="botsLimit"
                          value={editData.botsLimit}
                          onChange={handleEditChange}
                        />
                      </td>
                      <td>
                        <Checkbox
                          checked={editData.isActive}
                          onChange={handleEditChange}
                          name="isActive"
                        />
                      </td>
                      <td>
                        <IconButton onClick={saveEdit} color="success">
                          <CheckIcon />
                        </IconButton>
                        <IconButton onClick={cancelEdit} color="error">
                          <CloseIcon />
                        </IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{plan.name}</td>
                      <td>{plan.description}</td>
                      <td>
                        {plan.price.toLocaleString("es-CO", { style: "currency", currency: "COP" })}
                      </td>
                      <td>{plan.maxTokens}</td>
                      <td>{plan.botsLimit}</td>
                      <td>{plan.isActive ? "Sí" : "No"}</td>
                      <td>
                        <IconButton onClick={() => startEdit(plan)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(plan.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </SoftBox>
      )}

      <SoftTypography variant="h5" mb={2} mt={5}>
        {showForm ? "Cerrar formulario" : "Crear Nuevo Plan"}{" "}
        <IconButton onClick={() => setShowForm(!showForm)} color="primary">
          {showForm ? <CloseIcon /> : <AddIcon />}
        </IconButton>
      </SoftTypography>

      {showForm && (
        <form onSubmit={createPlan} style={{ marginTop: 16 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                name="name"
                value={newPlan.name}
                onChange={handleInputChange}
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
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newPlan.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    inputProps={{ "aria-label": "Activo" }}
                  />
                }
                label="Activo"
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" type="submit">
                Crear Plan
              </Button>
            </Grid>
          </Grid>
        </form>
      )}

      {message && (
        <SoftTypography color="info" mt={2}>
          {message}
        </SoftTypography>
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default AdminPlans;
