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
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const userData = await response.json();

      if (response.ok) {
        setLocalUser(userData); // Actualiza el estado con los datos del usuario
      } else {
        console.error("Error al obtener datos del usuario:", userData.message);
      }
    };

    fetchUser();
  }, []);

  const [tempName, setTempName] = useState(user?.name || "");
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
      const token = localStorage.getItem("token");

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

        if (response.ok) {
          // Si la actualización fue exitosa, actualiza el estado local
          setLocalUser((prevUser) => ({
            ...prevUser,
            name: tempName, // Actualiza solo el nombre
          }));
          alert("Nombre actualizado correctamente");
        } else {
          console.error("Error al actualizar nombre:", result.message);
          setErrorMessage(result.message || "No se pudo actualizar el nombre");
          setErrorOpen(true);
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

    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const formData = new FormData();
    formData.append("file", file, uniqueFileName);

    const token = localStorage.getItem("token");

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
            color: "#000",
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
                      InputProps={{
                        disableUnderline: false,
                      }}
                      sx={{
                        maxWidth: "200px",
                        mr: 1,
                        "& .MuiInputBase-root": {
                          backgroundColor: "transparent !important", // Forzamos que el fondo sea transparente
                          boxShadow: "none !important", // Forzamos la eliminación de la sombra
                          border: "none !important", // Eliminamos cualquier borde que pudiera aparecer
                          marginTop: "-5px !important", // Forzamos el margin-top
                        },
                        "& .MuiInputBase-input": {
                          backgroundColor: "transparent !important", // También forzamos el fondo del input
                        },
                        "& .MuiInput-underline:before": {
                          borderBottom: "1px solid #ccc !important", // Línea debajo en estado normal
                        },
                        "& .MuiInput-underline:hover:before": {
                          borderBottom: "1px solid #999 !important", // Línea debajo en hover
                        },
                        "& .MuiInput-underline:after": {
                          borderBottom: "2px solid #1976d2 !important", // Línea debajo después de editar
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
                    {localUser?.name || "Cargando..."}
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
