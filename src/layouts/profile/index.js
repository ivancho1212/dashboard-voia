import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Footer from "examples/Footer";
import { TextField, Divider, Chip, CircularProgress, Button } from "@mui/material";
import Header from "layouts/profile/components/Header";
import { Link } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from "@mui/icons-material/Edit";
import { getMyProfile, updateMyProfile } from "services/authService";
import { getMyPlan } from "services/planService";
import { getBotDataCaptureFields } from "services/botDataCaptureService";

function Overview() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [botFields, setBotFields] = useState({});

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        const data = await getMyProfile();
        setUser(data);
        setEditedUser(data);
        const planData = await getMyPlan();
        setPlan(planData);
        // Si hay bots, obtener campos de captura para cada uno
        if (data?.bots?.length) {
          const fieldsByBot = {};
          for (const bot of data.bots) {
            fieldsByBot[bot.id] = await getBotDataCaptureFields(bot.id);
          }
          setBotFields(fieldsByBot);
        }
      } catch (error) {
        console.error("Error al obtener el perfil o plan:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const handleChange = (field, value) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateMyProfile(editedUser);
      const updatedProfile = await getMyProfile();
      setUser(updatedProfile);
      setEditMode(false);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setEditMode(false);
  };

  return (
    <DashboardLayout>
      <Header user={user} />
      <SoftBox mt={2} mb={3}>
        <Card sx={{ p: 3, borderRadius: 4, boxShadow: 3, width: '100%', maxWidth: '100%', mx: 'auto' }}>
          {loading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight={200}>
              <CircularProgress />
            </SoftBox>
          ) : (
            <Grid container spacing={4}>
              {/* Columna izquierda: datos de usuario */}
              <Grid item xs={12} md={6}>
                <SoftTypography variant="subtitle1" fontWeight="bold" mb={2} sx={{ fontSize: 18 }}>Datos del usuario</SoftTypography>
                <Divider sx={{ mb: 2 }} />
                <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Nombre:</b> {user?.fullName}</SoftBox>
                <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Correo:</b> {user?.email}</SoftBox>
                <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Teléfono:</b> {user?.phone || 'No registrado'}</SoftBox>
                <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Dirección:</b> {user?.address || 'No registrada'}</SoftBox>
                <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>No. Documento:</b> {user?.documentNumber || 'No registrado'}</SoftBox>
                <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Cuenta verificada:</b> {user?.isVerified ? 'Sí' : 'No'}</SoftBox>
                <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Foto del documento:</b> {user?.documentPhotoUrl ? (<a href={user.documentPhotoUrl} target="_blank" rel="noreferrer">Ver foto</a>) : 'No cargada'}</SoftBox>
                <SoftBox mt={2}>
                  <Button variant="contained" color="info" size="small" onClick={() => setEditMode(true)} startIcon={<EditIcon />} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120 }}>Editar perfil</Button>
                </SoftBox>
              </Grid>
              {/* Columna derecha: plan actual */}
              <Grid item xs={12} md={6}>
                <SoftTypography variant="subtitle1" fontWeight="bold" mb={2} sx={{ fontSize: 18 }}>Mi plan actual</SoftTypography>
                <Divider sx={{ mb: 2 }} />
                {plan && plan.isActive ? (
                  <>
                    <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Nombre:</b> {plan.name}</SoftBox>
                    <SoftBox mb={0.5} sx={{ fontSize: 15 }}><b>Precio:</b> ${plan.price}</SoftBox>
                    <SoftBox mt={2}>
                      <Link to="/plans" style={{ textDecoration: 'none' }}>
                        <Button variant="contained" color="info" size="small" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120 }}>Detalles</Button>
                      </Link>
                      <Button variant="contained" color="error" size="small" sx={{ ml: 1, borderRadius: 2, textTransform: 'none', fontWeight: 500, fontSize: 14, minWidth: 120 }} onClick={() => window.confirm('¿Seguro que deseas cancelar tu plan?') && window.location.reload()}>Cancelar plan</Button>
                    </SoftBox>
                  </>
                ) : (
                  <SoftTypography color="text" sx={{ fontSize: 15 }}>No tienes un plan activo.</SoftTypography>
                )}
              </Grid>
            </Grid>
          )}
        </Card>
      </SoftBox>

      {/* Sección de Bots del Usuario */}
      {user && user.bots && user.bots.length > 0 && (
        <SoftBox mt={3} mb={3}>
          <Card sx={{ p: 3, borderRadius: 4, boxShadow: 2, width: '100%', maxWidth: '100%', mx: 'auto' }}>
            <SoftTypography variant="h5" fontWeight="bold" mb={2}>Mis Bots</SoftTypography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              {/* Card para Crear Nuevo Bot */}
              <Grid item xs={12} md={6} xl={4}>
                <Link to="/bots" style={{ textDecoration: 'none' }}>
                  <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #ccc', cursor: 'pointer', '&:hover': { borderColor: '#1976d2' } }}>
                    <SoftBox p={2} textAlign="center">
                      <AddIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                      <SoftTypography variant="h6" color="info">Crear Nuevo Bot</SoftTypography>
                    </SoftBox>
                  </Card>
                </Link>
              </Grid>
              {user.bots.map((bot) => (
                <Grid item xs={12} md={6} xl={4} key={bot.id}>
                  <Card sx={{ p: 2, borderRadius: 3, boxShadow: 1 }}>
                    <SoftTypography variant="h6" fontWeight="bold">{bot.name}</SoftTypography>
                    <SoftTypography variant="body2" color="text" mb={1}>{bot.description || "Sin descripción"}</SoftTypography>
                    {botFields[bot.id] && botFields[bot.id].length > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <SoftTypography variant="subtitle2" fontWeight="bold" color="info" mb={1}>Campos de captura de datos:</SoftTypography>
                        <ul style={{ paddingLeft: 18, margin: 0 }}>
                          {botFields[bot.id].map((field) => (
                            <li key={field.id} style={{ fontSize: 14, color: '#444', marginBottom: 2 }}>
                              <b>{field.fieldName}</b> <Chip label={field.fieldType} size="small" sx={{ ml: 1 }} /> {field.isRequired && <Chip label="Requerido" color="error" size="small" sx={{ ml: 1 }} />}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Card>
        </SoftBox>
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
