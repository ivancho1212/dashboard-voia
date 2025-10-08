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
import RoleManagement from "./RoleManagement";
import UserCreation from "./UserCreation";
import UserInfo from "./UserInfo";

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
  const [showRoleManagement, setShowRoleManagement] = useState(false);
  const [showUserCreation, setShowUserCreation] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
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
        {/* Gestión avanzada de usuarios y roles (Acordeón) */}
        <Card sx={{ p: 0, mb: 4, boxShadow: 1, borderRadius: 2, transition: 'box-shadow 0.2s', cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
          <SoftBox
            p={2}
            borderRadius="lg"
            bgColor="white"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            onClick={() => setShowRoleManagement((prev) => !prev)}
            mt={2}
          >
            <span>
              <SoftTypography variant="h6" fontWeight="medium">
                Gestión avanzada de usuarios y roles
              </SoftTypography>
              <SoftTypography variant="body2" color="text" mt={1}>
                Selecciona los permisos que tendrá cada rol. Los usuarios solo podrán acceder a las secciones y acciones que su rol tenga habilitadas.
              </SoftTypography>
            </span>
            <IconButton size="small">
              <ExpandMoreIcon style={{ opacity: 0.5, transform: showRoleManagement ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </IconButton>
          </SoftBox>
          {showRoleManagement && (
            <SoftBox p={3}>
              <RoleManagement />
            </SoftBox>
          )}
        </Card>
        {/* Registrar nuevo usuario (Acordeón) */}
        <Card sx={{ p: 0, mb: 4, boxShadow: 1, borderRadius: 2, transition: 'box-shadow 0.2s', cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
          <SoftBox
            p={2}
            borderRadius="lg"
            bgColor="white"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            onClick={() => setShowUserCreation((prev) => !prev)}
            mt={2}
          >
            <span>
              <SoftTypography variant="h6" fontWeight="medium">
                Registrar nuevo usuario
              </SoftTypography>
              <SoftTypography variant="body2" color="text" mt={1}>
                Complete el formulario para registrar un nuevo usuario en el sistema.
              </SoftTypography>
            </span>
            <IconButton size="small">
              <ExpandMoreIcon style={{ opacity: 0.5, transform: showUserCreation ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </IconButton>
          </SoftBox>
          {showUserCreation && (
            <SoftBox p={3}>
              <UserCreation />
            </SoftBox>
          )}
        </Card>
        {/* Información del Usuario (igual estilo, ahora acordeón con tabla de usuarios) */}
        <Card sx={{ p: 0, mb: 4, boxShadow: 1, borderRadius: 2, transition: 'box-shadow 0.2s', cursor: 'pointer', '&:hover': { boxShadow: 6 } }}>
          <SoftBox
            p={2}
            borderRadius="lg"
            bgColor="white"
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            onClick={() => setShowUserInfo((prev) => !prev)}
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
              <ExpandMoreIcon style={{ opacity: 0.5, transform: showUserInfo ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </IconButton>
          </SoftBox>
          {showUserInfo && (
            <SoftBox p={3}>
              <UserInfo />
            </SoftBox>
          )}
        </Card>
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default AdminUserPanel;
