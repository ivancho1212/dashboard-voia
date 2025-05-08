import { useEffect, useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import InstagramIcon from "@mui/icons-material/Instagram";

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

// Overview page components
import Header from "layouts/profile/components/Header";
import PlatformSettings from "layouts/profile/components/PlatformSettings";

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

function Overview() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    getMyProfile()
      .then(setUser)
      .catch((error) => {
        console.error("Error al obtener el perfil:", error);
      });
  }, []);

  return (
    <DashboardLayout>
    <Header user={user} />
     <SoftBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} xl={4}>
            <PlatformSettings />
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            {user && (

          <ProfileInfoCard
          title="Información del perfil"
          description="Esta es tu información personal."
          info={{
            "Nombre": user.name,
            "Teléfono": user.phone || "Sin teléfono",
            "Correo": user.email,
            "Dirección": user.address || "Sin dirección",
            "No. documento": user.documentNumber || "No disponible",
            "Foto del documento": user.documentPhotoUrl
              ? <a href={user.documentPhotoUrl} target="_blank" rel="noreferrer">Ver foto</a>
              : "No cargada",
            "Cuenta verificada": user.isVerified ? "Sí" : "No"
          }}
          social={[]}
          action={{ route: "/editar-perfil", tooltip: "Editar perfil" }}
          />



            )}
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
