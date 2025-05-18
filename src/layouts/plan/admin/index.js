import React, { useEffect, useState } from "react";
import {
  IconButton,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  TextField,
  Switch,
  Box,
} from "@mui/material";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function AdminPlans() {
  const [plans, setPlans] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    maxTokens: 0,
    botsLimit: 0,
    isActive: true,
  });

  // Cargar todos los planes al montar el componente
  useEffect(() => {
    fetch("/api/plans")
      .then(async (res) => {
        const text = await res.text();
        console.log("Respuesta del servidor:", text);
        try {
          const json = JSON.parse(text);
          setPlans(json);
        } catch (err) {
          console.error("Error al parsear JSON:", err);
        }
      })
      .catch(console.error);
  }, []);

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      maxTokens: 0,
      botsLimit: 0,
      isActive: true,
    });
    setOpenDialog(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      maxTokens: plan.maxTokens,
      botsLimit: plan.botsLimit,
      isActive: plan.isActive,
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar este plan?")) {
      try {
        await fetch(`/api/plans/${id}`, { method: "DELETE" });
        setPlans(plans.filter((p) => p.id !== id));
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const handleToggleActive = async (plan) => {
    const updatedPlan = { ...plan, isActive: !plan.isActive };
    try {
      await fetch(`/api/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPlan),
      });
      setPlans(plans.map((p) => (p.id === plan.id ? updatedPlan : p)));
    } catch (error) {
      console.error("Error al actualizar estado:", error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (editingPlan) {
        // Actualizar plan existente
        await fetch(`/api/plans/${editingPlan.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, id: editingPlan.id }),
        });
        setPlans(
          plans.map((p) => (p.id === editingPlan.id ? { ...formData, id: editingPlan.id } : p))
        );
      } else {
        // Crear nuevo plan
        const res = await fetch("/api/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const newPlan = await res.json();
        setPlans([...plans, newPlan]);
      }
      setOpenDialog(false);
    } catch (error) {
      console.error("Error al guardar plan:", error);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <SoftTypography variant="h5">Administración de Planes</SoftTypography>
          <IconButton color="primary" onClick={handleOpenCreate}>
            <Icon>add</Icon>
          </IconButton>
        </Box>

        <Grid container spacing={2}>
          {plans.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Paper sx={{ p: 2, position: "relative" }}>
                <Typography variant="h6">{plan.name}</Typography>
                <Typography variant="body2">{plan.description}</Typography>
                <Typography variant="body2">💰 Precio: ${plan.price}</Typography>
                <Typography variant="body2">🎯 Tokens máx.: {plan.maxTokens}</Typography>
                <Typography variant="body2">🤖 Límite de bots: {plan.botsLimit}</Typography>

                <Box display="flex" alignItems="center" mt={1}>
                  <Switch
                    checked={plan.isActive}
                    onChange={() => handleToggleActive(plan)}
                    color="primary"
                  />
                  <Typography>{plan.isActive ? "Activo" : "Inactivo"}</Typography>
                </Box>

                <Box mt={2} display="flex" justifyContent="space-between">
                  <Button variant="outlined" size="small" onClick={() => handleOpenEdit(plan)}>
                    Editar
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => handleDelete(plan.id)}
                  >
                    Eliminar
                  </Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </SoftBox>

      {/* Diálogo de Crear/Editar Plan */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <SoftBox p={3}>
          <SoftTypography variant="h6" mb={2}>
            {editingPlan ? "Editar Plan" : "Crear Nuevo Plan"}
          </SoftTypography>
          <TextField
            fullWidth
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
            margin="normal"
          />
          <TextField
            fullWidth
            type="number"
            label="Precio"
            name="price"
            value={formData.price}
            onChange={handleFormChange}
            margin="normal"
          />
          <TextField
            fullWidth
            type="number"
            label="Tokens Máximos"
            name="maxTokens"
            value={formData.maxTokens}
            onChange={handleFormChange}
            margin="normal"
          />
          <TextField
            fullWidth
            type="number"
            label="Límite Bots"
            name="botsLimit"
            value={formData.botsLimit}
            onChange={handleFormChange}
            margin="normal"
          />
          <Box display="flex" alignItems="center" mt={2}>
            <Switch
              checked={formData.isActive}
              onChange={handleFormChange}
              name="isActive"
              color="primary"
            />
            <Typography>{formData.isActive ? "Activo" : "Inactivo"}</Typography>
          </Box>

          <Box mt={3} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="outlined" onClick={() => setOpenDialog(false)}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSubmit}>
              {editingPlan ? "Guardar Cambios" : "Crear Plan"}
            </Button>
          </Box>
        </SoftBox>
      </Dialog>

      <Footer />
    </DashboardLayout>
  );
}

export default AdminPlans;
