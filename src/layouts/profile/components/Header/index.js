import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftAvatar from "components/SoftAvatar";

// Soft UI Dashboard React examples
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

// Imagen de fondo
import curved0 from "assets/images/curved-images/curved0.jpg";

function Header({ user }) {
  const fileInputRef = useRef(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";
  const [avatarUrl, setAvatarUrl] = useState("/default-avatar.png");

  useEffect(() => {
    if (user?.avatarUrl) {
      setAvatarUrl(`${API_BASE_URL}${user.avatarUrl}`);
    }
  }, [user]);
  
  
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const formData = new FormData();
    formData.append("file", file, uniqueFileName);
  
    const token = localStorage.getItem("token"); // ✅ Agregado aquí
  
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";
      const response = await axios.put(`${API_BASE_URL}/api/Users/me/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      
  
      const fullAvatarUrl = `${API_BASE_URL}${response.data.avatarUrl}`;
      setAvatarUrl(fullAvatarUrl);
          } catch (error) {
      console.error("Error al subir la imagen:", error);
    }
  };
  

  return (
    <SoftBox position="relative">
      <DashboardNavbar absolute light />
      <SoftBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="18.75rem"
        borderRadius="xl"
        sx={{
          backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
            `${linearGradient(
              rgba(gradients.info.main, 0.6),
              rgba(gradients.info.state, 0.6)
            )}, url(${curved0})`,
          backgroundSize: "cover",
          backgroundPosition: "50%",
          overflow: "hidden",
        }}
      />
      <Card
        sx={{
          backdropFilter: `saturate(200%) blur(30px)`,
          backgroundColor: ({ functions: { rgba }, palette: { white } }) => rgba(white.main, 0.8),
          boxShadow: ({ boxShadows: { navbarBoxShadow } }) => navbarBoxShadow,
          position: "relative",
          mt: -8,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
           
          <SoftBox
          position="relative"
          sx={{ 
            width: "100px",
            height: "100px",
          }}
        >
          {/* Imagen de perfil */}
          <SoftAvatar
          src={avatarUrl}
          alt="Imagen de perfil"
          variant="rounded"
          shadow="sm"
          sx={{
            width: "100%",
            height: "100%",
            "& img": {
              width: "100%",
              height: "100%",
              objectFit: "cover",
            },
          }}
        />

          {/* Icono flotante */}
          <Tooltip title="Cambiar imagen">
            <IconButton
              size="small"
              onClick={handleAvatarClick}
              sx={{
                position: "absolute",
                bottom: 4,
                right: 4,
                zIndex: 2,
                backgroundColor: "#17c1e8",
                boxShadow: 2,
                "&:hover": {
                  backgroundColor: "#f0f0f0",
                },
              }}
            >
              <Icon>add</Icon>
            </IconButton>
          </Tooltip>

          {/* Input oculto */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
        </SoftBox>

            
          </Grid>
          <Grid item>
            <SoftBox height="100%" mt={0.5} lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                {user?.name || "Cargando..."}
              </SoftTypography>
              <SoftTypography variant="button" color="text" fontWeight="medium">
              <SoftTypography variant="caption" color="text">
                {user?.subscription?.expiresAt
                  ? `Vence el ${new Date(user.subscription.expiresAt).toLocaleDateString()}`
                  : "Sin suscripción activa"}
              </SoftTypography>


              </SoftTypography>
            </SoftBox>
          </Grid>
        </Grid>
      </Card>
    </SoftBox>
  );
}

// Validación de props
Header.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    avatarUrl: PropTypes.string,
    plan: PropTypes.shape({
      name: PropTypes.string,
    }),
    subscription: PropTypes.shape({
      expiresAt: PropTypes.string, // o PropTypes.instanceOf(Date) si ya viene como objeto Date
      status: PropTypes.string,
    }),
  }),
};


export default Header;
