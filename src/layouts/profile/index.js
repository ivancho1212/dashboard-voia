import { useEffect, useState } from "react";
import MyBotCard from "layouts/bot/components/MyBotCard";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React examples
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import Footer from "examples/Footer";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";

import { TextField } from "@mui/material"; // Importa el componente TextField
// Overview page components
import Header from "layouts/profile/components/Header";
import MyPlanCard from "layouts/plan/current";


import { Link } from "react-router-dom";
import AddIcon from '@mui/icons-material/Add';

// Servicios
import { getMyProfile } from "services/authService";
import { updateMyProfile } from "services/authService";
import EditIcon from "@mui/icons-material/Edit";

function Overview() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState({});

  useEffect(() => {
    getMyProfile()
      .then((data) => {
        setUser(data);
        setEditedUser(data);
      })
      .catch((error) => {
        console.error("Error al obtener el perfil:", error);
      });
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
      {/* Move content up by reducing margin top */}
      <SoftBox mt={2} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} xl={4}>
            {user && (
              <ProfileInfoCard
                title="Información del perfil"
                description=""
                info={{
                  Teléfono: editMode ? (
                    <TextField
                      value={editedUser.phone || ""}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      variant="standard"
                      fullWidth
                      InputProps={{ disableUnderline: false }}
                      sx={{
                        maxWidth: "160px",
                        "& .MuiInputBase-root": {
                          background: "transparent",
                          boxShadow: "none",
                          border: "none",
                          marginTop: "-10px",
                        },
                        "& .MuiInput-underline:before": {
                          borderBottom: "1px solid #ccc",
                        },
                        "& .MuiInput-underline:hover:before": {
                          borderBottom: "1px solid #999",
                        },
                        "& .MuiInput-underline:after": {
                          borderBottom: "2px solid #1976d2",
                        },
                      }}
                    />
                  ) : (
                    user.phone || "Sin teléfono"
                  ),

                  Correo: editMode ? (
                    <TextField
                      value={editedUser.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      variant="standard"
                      fullWidth
                      sx={{
                        maxWidth: "160px",
                        "& .MuiInputBase-root": {
                          background: "transparent",
                          boxShadow: "none",
                          border: "none",
                          marginTop: "-10px",
                        },
                        "& .MuiInput-underline:before": {
                          borderBottom: "1px solid #ccc",
                        },
                        "& .MuiInput-underline:hover:before": {
                          borderBottom: "1px solid #999",
                        },
                        "& .MuiInput-underline:after": {
                          borderBottom: "2px solid #1976d2",
                        },
                      }}
                    />
                  ) : (
                    user.email
                  ),

                  Dirección: editMode ? (
                    <TextField
                      value={editedUser.address || ""}
                      onChange={(e) => handleChange("address", e.target.value)}
                      variant="standard"
                      fullWidth
                      sx={{
                        maxWidth: "160px",
                        "& .MuiInputBase-root": {
                          background: "transparent",
                          boxShadow: "none",
                          border: "none",
                          marginTop: "-10px",
                        },
                        "& .MuiInput-underline:before": {
                          borderBottom: "1px solid #ccc",
                        },
                        "& .MuiInput-underline:hover:before": {
                          borderBottom: "1px solid #999",
                        },
                        "& .MuiInput-underline:after": {
                          borderBottom: "2px solid #1976d2",
                        },
                      }}
                    />
                  ) : (
                    user.address || "Sin dirección"
                  ),

                  "No. documento": editMode ? (
                    <TextField
                      value={editedUser.documentNumber || ""}
                      onChange={(e) => handleChange("documentNumber", e.target.value)}
                      variant="standard"
                      fullWidth
                      sx={{
                        maxWidth: "160px",
                        "& .MuiInputBase-root": {
                          background: "transparent",
                          boxShadow: "none",
                          border: "none",
                          marginTop: "-10px",
                        },
                        "& .MuiInput-underline:before": {
                          borderBottom: "1px solid #ccc",
                        },
                        "& .MuiInput-underline:hover:before": {
                          borderBottom: "1px solid #999",
                        },
                        "& .MuiInput-underline:after": {
                          borderBottom: "2px solid #1976d2",
                        },
                      }}
                    />
                  ) : (
                    user.documentNumber || "No disponible"
                  ),

                  "Foto del documento": user.documentPhotoUrl ? (
                    <a href={user.documentPhotoUrl} target="_blank" rel="noreferrer">
                      Ver foto
                    </a>
                  ) : (
                    "No cargada"
                  ),

                  "Cuenta verificada": user.isVerified ? "Sí" : "No",
                }}
                social={[]}
                action={{
                  route: "", // Add this line
                  tooltip: editMode ? "" : "Editar perfil",
                  icon: <EditIcon />,
                  onClick: () => setEditMode(true),
                }}
                editMode={editMode}
                handleSave={handleSave}
                handleCancel={handleCancel}
              />
            )}
          </Grid>

          <Grid item xs={12} md={6} xl={4}>
            <MyPlanCard />
          </Grid>

          <Grid item xs={12} md={6} xl={4}>
            {/* <MyBotCard /> */}
          </Grid>
        </Grid>
      </SoftBox>

      {/* Sección de Bots del Usuario */}
      {user && user.bots && user.bots.length > 0 && (
        <SoftBox mt={3} mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <SoftTypography variant="h5" fontWeight="bold">Mis Bots</SoftTypography>
            </Grid>

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
                <Card>
                  <SoftBox p={2}>
                    <SoftTypography variant="h6">{bot.name}</SoftTypography>
                    <SoftTypography variant="body2" color="text">
                      {bot.description || "Sin descripción"}
                    </SoftTypography>
                  </SoftBox>
                </Card>
              </Grid>
            ))}
          </Grid>
        </SoftBox>
      )}

      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
