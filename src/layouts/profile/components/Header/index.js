import { useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { IconButton } from "@mui/material";
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
  const [tempName, setTempName] = useState("");
  const [localUser, setLocalUser] = useState(user || {});
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  // ✅ Obtener datos del usuario
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = await response.json();

        if (response.ok) {
          setLocalUser(userData);
          setTempName(userData.name || "");
          if (userData.avatarUrl) {
            setAvatarUrl(`${API_BASE_URL}${userData.avatarUrl}`);
          }
        } else {
          console.error("Error al obtener datos del usuario:", userData.message);
        }
      } catch (error) {
        console.error("Error de red:", error);
      }
    };

    fetchUser();
  }, [API_BASE_URL]);

  // ✅ Manejar edición de nombre
  const handleCancelEdit = () => {
    setTempName(localUser?.name || "");
    setEditingName(false);
  };

  const handleSaveName = async () => {
    if (tempName.trim() && tempName !== localUser.name) {
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
            email: localUser.email,
            phone: localUser.phone,
            address: localUser.address,
            documentNumber: localUser.documentNumber,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setLocalUser((prevUser) => ({
            ...prevUser,
            name: tempName,
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

  // ✅ Subir imagen de perfil
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const formData = new FormData();
    formData.append("file", file, uniqueFileName);

    const token = localStorage.getItem("token");

    try {
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

  // ✅ Activar input file
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ✅ Verificar suscripción
  const isSubscriptionActive = () => {
    if (!localUser?.subscription?.expiresAt || !localUser?.subscription?.status)
      return false;
    const now = new Date();
    const expiresAt = new Date(localUser.subscription.expiresAt);
    return localUser.subscription.status === "active" && expiresAt > now;
  };

  return (
    <SoftBox position="relative">
      <DashboardNavbar absolute light />
      <SoftBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="8rem"
        borderRadius="sm"
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.7)",
          borderRadius: 1,
          input: { color: "#000" },
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
          backgroundColor: ({ functions: { rgba }, palette: { white } }) =>
            rgba(white.main, 0.8),
          boxShadow: ({ boxShadows: { navbarBoxShadow } }) => navbarBoxShadow,
          position: "relative",
          mt: -7,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <SoftBox position="relative" sx={{ width: "100px", height: "100px" }}>
              <SoftAvatar
                src={avatarUrl}
                alt="Imagen de perfil"
                variant="rounded"
                shadow="sm"
                sx={{
                  width: "100%",
                  height: "100%",
                  "& img": { width: "100%", height: "100%", objectFit: "cover" },
                }}
              />
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
                    "&:hover": { backgroundColor: "#f0f0f0" },
                  }}
                >
                  <Icon>add</Icon>
                </IconButton>
              </Tooltip>
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
                      fullWidth
                      InputProps={{ disableUnderline: false }}
                      sx={{
                        mr: 1,
                        flex: 1,
                        '& .MuiInputBase-root': {
                          backgroundColor: 'transparent !important',
                          boxShadow: 'none !important',
                          border: 'none !important',
                          marginTop: '-5px !important',
                        },
                        '& .MuiInputBase-input': {
                          backgroundColor: 'transparent !important',
                        },
                        '& .MuiInput-underline:before': {
                          borderBottom: '1px solid #ccc !important',
                        },
                        '& .MuiInput-underline:hover:before': {
                          borderBottom: '1px solid #999 !important',
                        },
                        '& .MuiInput-underline:after': {
                          borderBottom: '2px solid #1976d2 !important',
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
                    <IconButton
                      size="small"
                      onClick={() => {
                        setTempName(localUser?.name || "");
                        setEditingName(true);
                      }}
                      sx={{ ml: 1 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </SoftTypography>

              {/* Suscripción */}
              {isSubscriptionActive() ? (
                <SoftTypography variant="caption" color="text">
                  Tu plan vence el{" "}
                  {new Date(localUser.subscription.expiresAt).toLocaleDateString()}
                </SoftTypography>
              ) : (
                <>
                  <SoftTypography variant="caption" color="text">
                    Actualmente no estás suscrito
                  </SoftTypography>
                  <SoftTypography
                    variant="button"
                    color="secondary"
                    sx={{ display: "block", mt: 0.5, cursor: "pointer" }}
                    onClick={() =>
                      navigate("/plans", { state: { currentPlanId: localUser?.plan?.id } })
                    }
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

// ✅ Validación de props
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
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
      subscription: PropTypes.shape({
        expiresAt: PropTypes.string,
        status: PropTypes.string,
      }),
    }),
    subscription: PropTypes.shape({
      expiresAt: PropTypes.string,
      status: PropTypes.string,
      isActive: PropTypes.bool,
    }),
  }),
};

export default Header;
