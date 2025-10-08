import React, { useState, useEffect } from "react";
import { getPermissions, getRoles, createRole, updateRole, deleteRole } from "../../../services/userAdminService";
import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Button, Checkbox, IconButton, Grid } from "@mui/material";
import SoftTypography from "components/SoftTypography";

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

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [newRole, setNewRole] = useState({ name: "", permissions: [] });
  const [editRolePerms, setEditRolePerms] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const perms = await getPermissions();
        setPermissions(perms);
        const rolesData = await getRoles();
        setRoles(
          rolesData.map((role) => {
            let permIds = [];
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

  const handleNewRolePermChange = (permId) => {
    setNewRole((prev) => ({ ...prev, permissions: prev.permissions.includes(permId) ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId] }));
  };
  const handleNewRoleChange = (e) => setNewRole({ ...newRole, [e.target.name]: e.target.value });
  const handleCreateRole = async () => {
    if (!newRole.name) return;
    try {
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
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este rol?')) return;
    try {
      await deleteRole(roleId);
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
    } catch (e) {}
  };

  if (loading) return <div>Cargando...</div>;

  return (
    <>
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
                padding: '14px 16px',
                color: '#495057',
              }
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
              }
            }}
          />
        </Grid>
      </Grid>
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
                            const selectedPermissionNames = permissions
                              .filter((perm) => editRolePerms.includes(perm.id))
                              .map((perm) => perm.name);
                            await updateRole(role.id, {
                              name: role.name,
                              description: role.description || "",
                              permissions: selectedPermissionNames,
                            });
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
    </>
  );
};

export default RoleManagement;
