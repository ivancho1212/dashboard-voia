import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Link } from "@mui/material";
import TextField from "@mui/material/TextField";
import Snackbar from '@mui/material/Snackbar'; // Asegúrate de usar la ruta correcta según tu versión de Material-UI

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
  const [editingName, setEditingName] = useState(false);

  useEffect(() => {
    setTempName(user?.name || "");
  }, [user]); // Esto asegura que 'tempName' se sincronice con 'user.name' cuando 'user' cambie

  const [tempName, setTempName] = useState(user?.name || "");
  const [isLoadingAvatar, setIsLoadingAvatar] = useState(true);  // Aquí se agrega el estado para el avatar
  const [localUser, setLocalUser] = useState(user);

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

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token"); // o de donde sea que guardas el token
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: tempName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          documentNumber: user.documentNumber,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.Message || "Error al actualizar");
      } else {
        alert("Perfil actualizado correctamente");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al conectar con el servidor");
    }
  };

  const handleCancelEdit = () => {
    setTempName(user?.name || "");
    setEditingName(false);
  };

  const handleSaveName = async () => {
    if (tempName.trim() && tempName !== user.name) {
      const token = localStorage.getItem("token"); // Asegúrate de obtener el token antes de usarlo
  
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: tempName,
            email: user.email,
            phone: user.phone,
            address: user.address,
            documentNumber: user.documentNumber,
          }),
        });
  
        const result = await response.json();
  
        if (!response.ok) {
          console.error("Error al actualizar nombre:", result.message);
          setErrorMessage(result.message || "No se pudo actualizar el nombre");
          setErrorOpen(true);
        } else {
          setLocalUser({ ...user, name: tempName });
          alert("Nombre actualizado correctamente");
        }
      } catch (error) {
        console.error("Error de red:", error);
        alert("Error de red al actualizar el nombre");
      }
    }
    setEditingName(false);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    // Cambiar estado a "cargando" al iniciar la carga
    setIsLoadingAvatar(true);
  
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const formData = new FormData();
    formData.append("file", file, uniqueFileName);
  
    const token = getToken();
  
    try {
      const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5006";
      const response = await axios.put(`${API_BASE_URL}/api/Users/me/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
  
      // Establecer la URL completa del avatar después de la carga
      const fullAvatarUrl = `${API_BASE_URL}${response.data.avatarUrl}`;
      setAvatarUrl(fullAvatarUrl);
    } catch (error) {
      console.error("Error al subir la imagen:", error);
    } finally {
      // Establecer el estado a "no cargando" después de terminar la carga
      setIsLoadingAvatar(false);
    }
  };
  

  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          borderRadius: 1,
          input: {
            color: "#000", // puedes ajustar si el fondo es más oscuro
          },
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
                src={isLoadingAvatar ? "/default-avatar.png" : avatarUrl} // Avatar por defecto mientras se carga
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
                onLoad={() => setIsLoadingAvatar(false)} // Cuando la imagen se carga, actualizar el estado
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
              <SoftTypography variant="h5" fontWeight="medium" display="flex" alignItems="center">
                {editingName ? (
                  <>
                    <TextField
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      variant="standard"
                      autoFocus
                      InputProps={{ disableUnderline: false }}
                      sx={{
                        maxWidth: "200px",
                        mr: 1,
                        "& .MuiInputBase-root": {
                          background: "transparent",
                          boxShadow: "none",
                          border: "none",
                          marginTop: "-5px",
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

                    <IconButton onClick={handleSaveName} size="small" sx={{ color: "green" }}>
                      <CheckIcon />
                    </IconButton>
                    <IconButton onClick={handleCancelEdit} size="small" sx={{ color: "red" }}>
                      <CloseIcon />
                    </IconButton>
                  </>
                ) : (
                  <>
                    {user?.name || "Cargando..."}
                    <IconButton size="small" onClick={() => setEditingName(true)} sx={{ ml: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </SoftTypography>

              {/* SUSCRIPCIÓN */}
              {user?.subscription?.expiresAt ? (
                <SoftTypography variant="caption" color="text">
                  Vence el {new Date(user.subscription.expiresAt).toLocaleDateString()}
                </SoftTypography>
              ) : (
                <>
                  <SoftTypography variant="caption" color="gray">
                    Actualmente no estás suscrito
                  </SoftTypography>
                  <SoftTypography
                    variant="button"
                    component={Link}
                    href="/planes"
                    color="secundary"
                    sx={{ display: "block", mt: 0.5 }}
                  >
                    Suscríbete
                  </SoftTypography>
                </>
              )}
            </SoftBox>
          </Grid>
        </Grid>
      </Card>
      <Snackbar 
        open={errorOpen} 
        autoHideDuration={6000} 
        onClose={() => setErrorOpen(false)} 
        message={errorMessage} 
      />
    </SoftBox>

);

}

// Validación de props
Header.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
    documentNumber: PropTypes.string,
    avatarUrl: PropTypes.string,
    plan: PropTypes.shape({
      name: PropTypes.string,
    subscription: PropTypes.shape({
        expiresAt: PropTypes.string,
        status: PropTypes.string,
      }),
    plan: PropTypes.shape({
        name: PropTypes.string,
      }),
    }),
    subscription: PropTypes.shape({
      expiresAt: PropTypes.string,
      status: PropTypes.string,
    }),
  }),
};

export default Header;
