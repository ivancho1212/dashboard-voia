import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import TableContainer from "@mui/material/TableContainer";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Footer from "examples/Footer";
import { getPermissions, getRoles, createRole, createUser, updateRole, deleteRole } from "../../services/userAdminService";
function AdminUserPanel() {
  // Eliminar rol
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este rol?')) return;
    try {
      await deleteRole(roleId);
      alert('Rol eliminado correctamente');
    } catch (e) {
      alert('Error al eliminar el rol');
      console.error(e);
    }
    // Refrescar roles
    const perms = await getPermissions();
    setPermissions(perms);
    const rolesData = await getRoles();
    setRoles(
      rolesData.map((r) => {
        let permIds = [];
        if (Array.isArray(r.permissions) && r.permissions.length > 0) {
          permIds = r.permissions.map((permName) => {
            const found = perms.find((p) => p.name === permName || p.key === permName);
            return found ? found.id : null;
          }).filter(Boolean);
        }
        return {
          ...r,
          permissions: permIds,
        };
      })
    );
  };
  // Estado para edición de permisos temporal
  const [editRolePerms, setEditRolePerms] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState({ name: "", permissions: [] });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    country: "",
    city: "",
    address: "",
    documentNumber: "",
    documentPhotoUrl: "",
    avatarUrl: "",
    documentTypeId: "",
    isVerified: false,
    dataConsent: false,
    roleId: ""
  });
  const [userFormErrors, setUserFormErrors] = useState({});
  const [userError, setUserError] = useState("");
  const [userSuccess, setUserSuccess] = useState("");
  // Estado para saber qué rol se está editando
  const [editingRoleId, setEditingRoleId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const perms = await getPermissions();
        setPermissions(perms);
        const rolesData = await getRoles();
        // Permitir que rolePermissions venga como IDs, nombres o ambos
        setRoles(
          rolesData.map((role) => {
            let permIds = [];
            // Si el backend retorna permissions como array de nombres
            if (Array.isArray(role.permissions) && role.permissions.length > 0) {
              permIds = role.permissions.map((permName) => {
                const found = perms.find((p) => p.name === permName || p.key === permName);
                return found ? found.id : null;
              }).filter(Boolean);
            } else if (role.rolePermissions && role.rolePermissions.length > 0) {
              if (role.rolePermissions[0].permissionId !== undefined) {
                permIds = role.rolePermissions.map((rp) => rp.permissionId);
              } else if (role.rolePermissions[0].permissionName !== undefined) {
                permIds = role.rolePermissions.map((rp) => {
                  const found = perms.find((p) => p.name === rp.permissionName || p.key === rp.permissionName);
                  return found ? found.id : null;
                }).filter(Boolean);
              } else if (typeof role.rolePermissions[0] === 'string') {
                permIds = role.rolePermissions.map((permName) => {
                  const found = perms.find((p) => p.name === permName || p.key === permName);
                  return found ? found.id : null;
                }).filter(Boolean);
              }
            }
            return {
              ...role,
              permissions: permIds,
            };
          })
        );
      } catch (e) {}
      setLoading(false);
    };
    fetchData();
  }, []);

  // Handlers para roles
  const handleRolePermChange = (roleId, permId) => {
    setRoles((prev) => prev.map((r) => r.id === roleId ? { ...r, permissions: r.permissions.includes(permId) ? r.permissions.filter((p) => p !== permId) : [...r.permissions, permId] } : r));
  };
  const handleNewRolePermChange = (permId) => {
    setNewRole((prev) => ({ ...prev, permissions: prev.permissions.includes(permId) ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId] }));
  };
  const handleNewRoleChange = (e) => setNewRole({ ...newRole, [e.target.name]: e.target.value });
  const handleCreateRole = async () => {
    if (!newRole.name) return;
    try {
      // Mapear los IDs seleccionados a los nombres (Name) de los permisos
      const selectedPermissionNames = permissions
        .filter((perm) => newRole.permissions.includes(perm.id))
        .map((perm) => perm.name);
      const createdRole = await createRole({
        name: newRole.name,
        permissions: selectedPermissionNames,
      });
      setRoles((prev) => [
        ...prev,
        { ...createdRole, permissions: newRole.permissions },
      ]);
      setNewRole({ name: "", permissions: [] });
    } catch (e) {}
  };

  // Handlers para usuarios
  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  const handleNewUserRole = (e) => setNewUser({ ...newUser, roleId: e.target.value });
  // Validación similar al registro
  const validateNewUser = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^3\d{9}$/;
    const documentRegex = /^\d{6,12}$/;
    if (!newUser.name.trim() || newUser.name.split(" ").length < 2) {
      errors.name = "Debe ingresar tanto el nombre como el apellido.";
    }
    if (!emailRegex.test(newUser.email)) errors.email = "Correo electrónico inválido.";
    if (newUser.password.length < 6) errors.password = "Mínimo 6 caracteres.";
    if (newUser.confirmPassword !== newUser.password) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
    if (!phoneRegex.test(newUser.phone)) errors.phone = "Teléfono inválido. Ej: 3XXXXXXXXX";
    if (!newUser.country.trim()) errors.country = "El país es obligatorio.";
    if (!newUser.city.trim()) errors.city = "La ciudad es obligatoria.";
    if (!newUser.address.trim()) errors.address = "La dirección es obligatoria.";
    if (!documentRegex.test(newUser.documentNumber))
      errors.documentNumber = "Documento inválido (6-12 dígitos).";
    if (!newUser.documentTypeId) errors.documentTypeId = "El tipo de documento es obligatorio.";
    if (!newUser.roleId) errors.roleId = "El rol es obligatorio.";
    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleCreateUser = async () => {
    setUserError("");
    setUserSuccess("");
    if (!validateNewUser()) return;
    try {
      const userPayload = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        roleId: parseInt(newUser.roleId),
        documentTypeId: parseInt(newUser.documentTypeId),
        phone: newUser.phone,
        address: newUser.address,
        documentNumber: newUser.documentNumber,
        documentPhotoUrl: newUser.documentPhotoUrl,
        avatarUrl: newUser.avatarUrl,
        isVerified: newUser.isVerified,
        country: newUser.country,
        city: newUser.city,
        consents: [
          {
            consent_type: "terms_and_conditions",
            granted: true,
          },
          {
            consent_type: "privacy_policy",
            granted: newUser.dataConsent ? 1 : 0,
          },
        ],
      };
      console.log("[DEBUG] Payload a enviar:", userPayload);
      const result = await createUser(userPayload);
      console.log("[DEBUG] Respuesta de createUser:", result);
      setUserSuccess("Usuario registrado exitosamente");
      setNewUser({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        country: "",
        city: "",
        address: "",
        documentNumber: "",
        documentPhotoUrl: "",
        avatarUrl: "",
        documentTypeId: "",
        isVerified: false,
        dataConsent: false,
        roleId: ""
      });
      setUserFormErrors({});
    } catch (err) {
      console.error("[ERROR] Error en createUser:", err);
      setUserError("No se pudo registrar el usuario");
    }
  };

  if (loading) return <div>Cargando...</div>;

  // Diccionario para mostrar los nombres de permisos en español (ajusta según tus claves)
  const permissionLabels = {
    ver_dashboard: 'Ver Dashboard',
    panel_usuarios: 'Panel de Usuarios',
    usuarios_registrados: 'Usuarios Registrados',
    bots_asociados: 'Bots Asociados',
    planes_suscripciones: 'Planes y Suscripciones',
    tokens_usuario: 'Tokens de Usuario',
    pagos_usuario: 'Pagos de Usuario',
    administrar_planes: 'Administrar Planes',
    administrar_bots: 'Administrar Bots',
    entrenamiento_bot: 'Entrenamiento de Bot',
    datos_captados_bot: 'Datos Captados del Bot',
    estilos_bot: 'Estilos del Bot',
    integracion_bot: 'Integración del Bot',
    vista_previa_bot: 'Vista Previa del Bot',
    historial_uso_bot: 'Historial de Uso del Bot',
    conversaciones: 'Conversaciones',
    documentos: 'Documentos',
    recursos: 'Recursos',
    proveedor_ia: 'Proveedor de IA',
    facturacion: 'Facturación',
    administrar_soporte: 'Administrar Soporte',
    asignar_agentes_soporte: 'Asignar Agentes de Soporte',
    respuestas_rapidas_soporte: 'Respuestas Rápidas de Soporte',
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <Card sx={{ p: 3, mb: 4 }}>
          <SoftTypography variant="h5" fontWeight="bold" mb={3}>
            Gestión avanzada de usuarios y roles
          </SoftTypography>
          <SoftTypography variant="body2" color="text" mb={2}>
            Selecciona los permisos que tendrá cada rol. Los usuarios solo podrán acceder a las secciones y acciones que su rol tenga habilitadas.
          </SoftTypography>
          {/* Input nombre del rol */}
          <SoftTypography variant="subtitle2" fontWeight="medium" mb={1}>
            Nombre del rol
          </SoftTypography>
          <Grid container spacing={2} alignItems="center" mb={2}>
            <Grid item xs={12} md={6} lg={4}>
              <TextField 
                placeholder="Ej: Comercial, Soporte..."
                name="name"
                value={newRole.name}
                onChange={handleNewRoleChange}
                fullWidth 
                size="small"
                inputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px', // más padding vertical para centrar el cursor
                    color: '#495057',
                  }
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px', // más padding vertical para centrar el cursor
                    color: '#495057',
                    
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  }
                }}
              />
            </Grid>
          </Grid>
          {/* Tabla de permisos horizontal */}
          <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2, boxShadow: 1, maxWidth: '100vw', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {permissions.map((perm) => (
                    <TableCell key={perm.id} align="center" sx={{ fontWeight: 'bold', minWidth: 100, borderBottom: 0, px: 0.5, py: 0.1 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{permissionLabels[perm.key] || perm.name}</span>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {permissions.map((perm) => (
                    <TableCell key={perm.id} align="center" sx={{ borderTop: 0, px: 0.5, py: 0 }}>
                      <Checkbox
                        checked={newRole.permissions.includes(perm.id)}
                        onChange={() => handleNewRolePermChange(perm.id)}
                        size="small"
                        color="primary"
                        sx={{ mt: 0, mb: 3, p: 0 }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Grid container justifyContent="flex-end" mb={2}>
            <Button variant="contained" color="primary" onClick={handleCreateRole} sx={{ minWidth: 180, color: '#fff' }}>CREAR ROL</Button>
          </Grid>
          {/* Tabla de roles y permisos existentes */}
          <SoftTypography variant="h6" fontWeight="medium" mb={2}>Roles existentes</SoftTypography>
          <TableContainer component={Paper} sx={{ mb: 4, borderRadius: 2, boxShadow: 1, maxWidth: '100vw', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ background: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: 120 }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: 200 }}>Permisos</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center', minWidth: 60 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((role) => (
                  <React.Fragment key={role.id}>
                    <TableRow>
                      <TableCell sx={{ textAlign: 'center', fontWeight: 500 }}>{role.name}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {permissions
                          .filter((perm) => role.permissions.includes(perm.id))
                          .map((perm) => (
                            <span key={perm.id} style={{
                              display: 'inline-block',
                              background: '#e0e7ef',
                              color: '#344767',
                              borderRadius: 12,
                              padding: '2px 10px',
                              fontSize: 12,
                              margin: '2px 4px',
                            }}>
                              {permissionLabels[perm.key] || perm.name}
                            </span>
                          ))
                        }
                        {permissions.filter((perm) => role.permissions.includes(perm.id)).length === 0 && (
                          <span style={{ color: '#b0b0b0', fontSize: 12 }}>Sin permisos</span>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton onClick={() => {
                          setEditingRoleId(role.id);
                          setEditRolePerms([...role.permissions]);
                        }}>
                          <span className="material-icons" style={{ fontSize: 20 }}>edit</span>
                        </IconButton>
                        <IconButton color="error" onClick={() => handleDeleteRole(role.id)}>
                          <span className="material-icons" style={{ fontSize: 20 }}>delete</span>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {editingRoleId === role.id && (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ background: '#f9f9f9' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                {permissions.map((perm) => (
                                  <TableCell key={perm.id} align="center" sx={{ fontWeight: 'bold', minWidth: 100, borderBottom: 0, px: 0.5, py: 0.1 }}>
                                    <span style={{ fontSize: 12, fontWeight: 500, lineHeight: 1 }}>{permissionLabels[perm.key] || perm.name}</span>
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              <TableRow>
                                {permissions.map((perm) => (
                                  <TableCell key={perm.id} align="center" sx={{ borderTop: 0, px: 0.5, py: 0 }}>
                                    <Checkbox
                                      checked={editRolePerms.includes(perm.id)}
                                      onChange={() => {
                                        setEditRolePerms((prev) => prev.includes(perm.id)
                                          ? prev.filter((p) => p !== perm.id)
                                          : [...prev, perm.id]);
                                      }}
                                      size="small"
                                      color="primary"
                                      sx={{ mt: 0, mb: 3, p: 0 }}
                                    />
                                  </TableCell>
                                ))}
                              </TableRow>
                            </TableBody>
                          </Table>
                          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              size="small"
                              sx={{ color: '#fff', minWidth: 80, px: 1.5, py: 0.5, fontSize: 13 }}
                              onClick={async () => {
                                // Guardar cambios de permisos
                                const selectedPermissionNames = permissions
                                  .filter((perm) => editRolePerms.includes(perm.id))
                                  .map((perm) => perm.name);
                                await updateRole(role.id, {
                                  name: role.name,
                                  description: role.description || "",
                                  permissions: selectedPermissionNames,
                                });
                                // Refrescar roles
                                const perms = await getPermissions();
                                setPermissions(perms);
                                const rolesData = await getRoles();
                                setRoles(
                                  rolesData.map((r) => {
                                    let permIds = [];
                                    if (Array.isArray(r.permissions) && r.permissions.length > 0) {
                                      permIds = r.permissions.map((permName) => {
                                        const found = perms.find((p) => p.name === permName || p.key === permName);
                                        return found ? found.id : null;
                                      }).filter(Boolean);
                                    }
                                    return {
                                      ...r,
                                      permissions: permIds,
                                    };
                                  })
                                );
                                setEditingRoleId(null);
                              }}
                            >
                              Guardar
                            </Button>
                            <Button 
                              variant="contained" 
                              size="small"
                              sx={{ background: '#b0b0b0', color: '#fff', '&:hover': { background: '#9e9e9e' }, minWidth: 80, px: 1.5, py: 0.5, fontSize: 13 }}
                              onClick={() => setEditingRoleId(null)}
                            >
                              Cerrar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
    </TableContainer>
    {/* Registrar nuevo usuario */}
          <SoftTypography variant="h6" fontWeight="medium" mb={2}>Registrar nuevo usuario</SoftTypography>
          <Grid container spacing={2} mb={2}>
            {/* Fila 1 */}
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Ej: Juan Pérez"
                label={null}
                name="name"
                value={newUser.name}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.name}
                helperText={userFormErrors.name}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Select
                displayEmpty
                labelId="document-type-label"
                name="documentTypeId"
                value={newUser.documentTypeId}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.documentTypeId}
                sx={{
                  fontSize: 13,
                  color: '#495057',
                  background: '#fff',
                  borderRadius: '8px',
                  '& .MuiSelect-select': {
                    padding: '14px 12px',
                    fontSize: 13,
                    color: '#495057',
                  },
                }}
                renderValue={selected => selected ? (
                  ["Cédula de Ciudadanía", "NIT", "Pasaporte"][parseInt(selected, 10) - 1] || ""
                ) : <span style={{ color: '#b0b0b0' }}>Tipo de documento</span>}
              >
                <MenuItem value="" disabled>
                  <span style={{ color: '#b0b0b0' }}>Tipo de documento</span>
                </MenuItem>
                <MenuItem value="1">Cédula de Ciudadanía</MenuItem>
                <MenuItem value="2">NIT</MenuItem>
                <MenuItem value="3">Pasaporte</MenuItem>
              </Select>
              {userFormErrors.documentTypeId && <span style={{ color: 'red', fontSize: 12 }}>{userFormErrors.documentTypeId}</span>}
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Número de Documento"
                label={null}
                name="documentNumber"
                value={newUser.documentNumber}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.documentNumber}
                helperText={userFormErrors.documentNumber}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            {/* Fila 2 */}
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Dirección"
                label={null}
                name="address"
                value={newUser.address}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.address}
                helperText={userFormErrors.address}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="País"
                label={null}
                name="country"
                value={newUser.country}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.country}
                helperText={userFormErrors.country}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Ciudad"
                label={null}
                name="city"
                value={newUser.city}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.city}
                helperText={userFormErrors.city}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            {/* Fila 3 */}
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Teléfono"
                label={null}
                name="phone"
                value={newUser.phone}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.phone}
                helperText={userFormErrors.phone}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Email"
                label={null}
                name="email"
                value={newUser.email}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.email}
                helperText={userFormErrors.email}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Contraseña"
                label={null}
                name="password"
                type="password"
                value={newUser.password}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.password}
                helperText={userFormErrors.password}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            {/* Fila 4 */}
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Confirmar contraseña"
                label={null}
                name="confirmPassword"
                type="password"
                value={newUser.confirmPassword}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                error={!!userFormErrors.confirmPassword}
                helperText={userFormErrors.confirmPassword}
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="URL Foto Documento"
                label={null}
                name="documentPhotoUrl"
                value={newUser.documentPhotoUrl}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="URL Avatar"
                label={null}
                name="avatarUrl"
                value={newUser.avatarUrl}
                onChange={handleNewUserChange}
                fullWidth
                size="small"
                InputProps={{
                  style: {
                    fontSize: 13,
                    textAlign: 'left',
                    padding: '14px 16px',
                    color: '#495057',
                  },
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: 13,
                    padding: '14px 12px',
                    color: '#495057',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#b0b0b0',
                    opacity: 1,
                  },
                }}
              />
            </Grid>
            {/* Fila 5: Checks y rol */}
            {/* Rol primero, luego checks, luego botón al final */}
            <Grid item xs={12} md={4}>
              <Select
                displayEmpty
                labelId="role-label"
                name="roleId"
                value={newUser.roleId}
                onChange={handleNewUserRole}
                fullWidth
                size="small"
                error={!!userFormErrors.roleId}
                sx={{
                  fontSize: 13,
                  color: '#495057',
                  background: '#fff',
                  borderRadius: '8px',
                  '& .MuiSelect-select': {
                    padding: '14px 12px',
                    fontSize: 13,
                    color: '#495057',
                  },
                }}
                renderValue={selected => selected ? (
                  roles.find(r => r.id === parseInt(selected))?.name || ""
                ) : <span style={{ color: '#b0b0b0' }}>Rol</span>}
              >
                <MenuItem value="" disabled>
                  <span style={{ color: '#b0b0b0' }}>Rol</span>
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>
                ))}
              </Select>
              {userFormErrors.roleId && <span style={{ color: 'red', fontSize: 12 }}>{userFormErrors.roleId}</span>}
            </Grid>
            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', height: '40px', pl: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={newUser.isVerified} name="isVerified" onChange={handleNewUserChange} size="small" sx={{ p: 0.5 }} />}
                label={<span style={{ fontSize: 11, fontWeight: 500, color: '#344767', display: 'flex', alignItems: 'center', height: '40px' }}>Verificado</span>}
                sx={{ m: 0, alignItems: 'center', height: '40px' }}
                labelPlacement="end"
              />
            </Grid>
            <Grid item xs={12} md={2} sx={{ display: 'flex', alignItems: 'center', height: '40px', pl: 1 }}>
              <FormControlLabel
                control={<Checkbox checked={newUser.dataConsent} name="dataConsent" onChange={handleNewUserChange} size="small" sx={{ p: 0.5 }} />}
                label={<span style={{ fontSize: 11, fontWeight: 500, color: '#344767', display: 'flex', alignItems: 'center', height: '40px' }}>Autorizo uso de datos</span>}
                sx={{ m: 0, alignItems: 'center', height: '40px' }}
                labelPlacement="end"
              />
            </Grid>
            <Grid item xs={12} md={4} />
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateUser}
                size="small"
                sx={{
                  minWidth: 110,
                  height: '38px',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  borderRadius: '8px',
                  boxShadow: 1,
                  textTransform: 'none',
                  px: 2
                }}
              >
                REGISTRAR USUARIO
              </Button>
            </Grid>
            {userError && <Grid item xs={12}><span style={{ color: 'red' }}>{userError}</span></Grid>}
            {userSuccess && <Grid item xs={12}><span style={{ color: 'green' }}>{userSuccess}</span></Grid>}
          </Grid>
        </Card>
        <Grid container spacing={3} mt={1}>
          <Grid item xs={12}>
            <SoftBox
              p={2}
              shadow="md"
              borderRadius="lg"
              bgColor="white"
              sx={{ cursor: "pointer", transition: "all 0.2s", "&:hover": { boxShadow: 6 } }}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              onClick={() => navigate("/admin/users/info")}
              mt={2}
            >
              <span>
                <SoftTypography variant="h6" fontWeight="medium">
                  Información del Usuario
                </SoftTypography>
                <SoftTypography variant="body2" color="text" mt={1}>
                  Gestion los usuarios registrados.
                </SoftTypography>
              </span>
              <IconButton size="small">
                <ExpandMoreIcon style={{ opacity: 0.5 }} />
              </IconButton>
            </SoftBox>
          </Grid>
        </Grid>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AdminUserPanel;
