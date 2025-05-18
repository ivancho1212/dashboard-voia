import { useEffect, useState } from "react";

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
import ProfilesList from "examples/Lists/ProfilesList";
import DefaultProjectCard from "examples/Cards/ProjectCards/DefaultProjectCard";
import PlaceholderCard from "examples/Cards/PlaceholderCard";
import { TextField } from "@mui/material"; // Importa el componente TextField
// Overview page components
import Header from "layouts/profile/components/Header";
import MyPlanCard from "layouts/plan/current";

// Data
import profilesListData from "layouts/profile/data/profilesListData";

// Images
import homeDecor1 from "assets/images/home-decor-1.jpg";
import homeDecor2 from "assets/images/home-decor-2.jpg";
import homeDecor3 from "assets/images/home-decor-3.jpg";
import team1 from "assets/images/team-1.jpg";
import team2 from "assets/images/team-2.jpg";
import team3 from "assets/images/team-3.jpg";
import team4 from "assets/images/team-4.jpg";

// Servicios
import { getMyProfile } from "services/authService";
import { updateMyProfile } from "services/authService";
import SoftButton from "components/SoftButton";
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
      <SoftBox mt={5} mb={3}>
        <Grid container spacing={3}>

          <Grid item xs={12} md={6} xl={4}>
            {user && (
              <ProfileInfoCard
                title="Información del perfil"
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
          <Grid item xs={12} xl={4}>
            <ProfilesList title="Conversaciones" profiles={profilesListData} />
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <Card>
          <SoftBox pt={2} px={2}>
            <SoftBox mb={0.5}>
              <SoftTypography variant="h6" fontWeight="medium">
                Proyectos
              </SoftTypography>
            </SoftBox>
            <SoftBox mb={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Los arquitectos diseñan casas
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftBox p={2}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6} xl={3}>
                <DefaultProjectCard
                  image={homeDecor1}
                  label="Proyecto #2"
                  title="Moderno"
                  description="Mientras Uber atraviesa una gran cantidad de turbulencias internas en la gestión."
                  action={{
                    type: "internal",
                    route: "/pages/profile/profile-overview",
                    color: "info",
                    label: "Ver proyecto",
                  }}
                  authors={[
                    { image: team1, name: "Elena Morison" },
                    { image: team2, name: "Ryan Milly" },
                    { image: team3, name: "Nick Daniel" },
                    { image: team4, name: "Peterson" },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6} xl={3}>
                <DefaultProjectCard
                  image={homeDecor2}
                  label="Proyecto #1"
                  title="Escandinavo"
                  description="La música es algo sobre lo que cada persona tiene su propia opinión específica."
                  action={{
                    type: "internal",
                    route: "/pages/profile/profile-overview",
                    color: "info",
                    label: "Ver proyecto",
                  }}
                  authors={[
                    { image: team3, name: "Nick Daniel" },
                    { image: team4, name: "Peterson" },
                    { image: team1, name: "Elena Morison" },
                    { image: team2, name: "Ryan Milly" },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6} xl={3}>
                <DefaultProjectCard
                  image={homeDecor3}
                  label="Proyecto #3"
                  title="Minimalista"
                  description="Las personas tienen diferentes gustos y varios tipos de música."
                  action={{
                    type: "internal",
                    route: "/pages/profile/profile-overview",
                    color: "info",
                    label: "Ver proyecto",
                  }}
                  authors={[
                    { image: team4, name: "Peterson" },
                    { image: team3, name: "Nick Daniel" },
                    { image: team2, name: "Ryan Milly" },
                    { image: team1, name: "Elena Morison" },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6} xl={3}>
                <PlaceholderCard title={{ variant: "h5", text: "Nuevo proyecto" }} outlined />
              </Grid>
            </Grid>
          </SoftBox>
        </Card>
      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
