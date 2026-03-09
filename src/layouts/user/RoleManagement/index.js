import React, { useState, useEffect, useCallback } from "react";
import { getPermissions, getRoles, createRole, updateRole, deleteRole } from "../../../services/userAdminService";
import { TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Button, Checkbox, IconButton, Grid } from "@mui/material";
import SoftTypography from "components/SoftTypography";

const permissionLabels = {
  // Usuarios
  CanViewUsers: 'Ver usuarios', CanEditUsers: 'Editar usuarios', CanDeleteUsers: 'Eliminar usuarios',
  // Bots
  CanViewBots: 'Ver bots', CanEditBots: 'Editar bots', CanDeleteBots: 'Eliminar bots',
  CanViewBotProfiles: 'Ver perfiles bot', CanCreateBotProfiles: 'Crear perfiles bot',
  CanUpdateBotProfiles: 'Editar perfiles bot', CanDeleteBotProfiles: 'Eliminar perfiles bot',
  CanViewBotStyles: 'Ver estilos bot', CanUpdateBotStyles: 'Editar estilos bot',
  CanViewBotActions: 'Ver acciones bot', CanCreateBotActions: 'Crear acciones bot',
  CanUpdateBotActions: 'Editar acciones bot', CanDeleteBotActions: 'Eliminar acciones bot',
  CanViewBotInstallationSettings: 'Ver config. instalación', CanEditBotInstallationSettings: 'Editar config. instalación',
  CanViewBotCustomPrompts: 'Ver prompts custom', CanEditBotCustomPrompts: 'Editar prompts custom', CanDeleteBotCustomPrompts: 'Eliminar prompts custom',
  CanViewBotDataCaptureFields: 'Ver campos captación',
  CanViewBotIntegrations: 'Ver integraciones', CanEditBotIntegrations: 'Editar integraciones',
  CanViewBotTemplates: 'Ver plantillas bot', CanViewBotTemplatePrompts: 'Ver prompts plantilla', CanEditBotTemplatePrompts: 'Editar prompts plantilla',
  CanEditBotTrainingConfigs: 'Editar config. training', CanViewBotTrainingConfigs: 'Ver config. training',
  CanViewBotIaProviders: 'Ver prov. IA', CanEditBotIaProviders: 'Editar prov. IA',
  // IA y modelos
  CanViewAiModelConfigs: 'Ver config. IA', CanEditAiModelConfigs: 'Editar config. IA', CanDeleteAiModelConfigs: 'Eliminar config. IA',
  // Training y documentos
  CanUploadFiles: 'Subir archivos',
  CanViewTrainingCustomTexts: 'Ver textos training',
  CanViewTrainingUrls: 'Ver URLs training', CanDeleteTrainingUrls: 'Eliminar URLs training',
  CanViewUploadedDocuments: 'Ver documentos', CanDeleteUploads: 'Eliminar uploads',
  CanViewKnowledgeChunks: 'Ver chunks RAG',
  CanEditTemplateTrainingSessions: 'Editar sesiones training',
  datos_captados_bot: 'Datos captados bot',
  // Conversaciones
  CanViewConversations: 'Ver conversaciones', CanEditConversations: 'Editar conversaciones', CanDeleteConversations: 'Eliminar conversaciones',
  CanViewConversationTags: 'Ver etiquetas', CanEditConversationTags: 'Editar etiquetas', CanDeleteConversationTags: 'Eliminar etiquetas',
  // Roles y permisos
  CanManageRoles: 'Gestionar roles', CanManagePermissions: 'Gestionar permisos',
  ViewRolePermissions: 'Ver permisos rol', AssignPermissionToRole: 'Asignar permisos', RevokePermissionFromRole: 'Revocar permisos',
  // Suscripciones
  CanViewSubscriptions: 'Ver suscripciones', CanUpdateSubscriptions: 'Editar suscripciones', CanDeleteSubscriptions: 'Eliminar suscripciones',
  // Soporte
  CanViewSupportTickets: 'Ver tickets', CanCreateSupportTickets: 'Crear tickets', CanUpdateSupportTickets: 'Editar tickets', CanDeleteSupportTickets: 'Eliminar tickets',
  CanViewSupportResponses: 'Ver resp. soporte', CanCreateSupportResponses: 'Crear resp. soporte', CanUpdateSupportResponses: 'Editar resp. soporte', CanDeleteSupportResponses: 'Eliminar resp. soporte',
  // Estilo y plantillas
  CanViewStyleTemplates: 'Ver plantillas estilo', CanCreateStyleTemplates: 'Crear plantillas estilo', CanUpdateStyleTemplates: 'Editar plantillas estilo', CanDeleteStyleTemplates: 'Eliminar plantillas estilo',
  // Imágenes generadas
  CanViewGeneratedImages: 'Ver imágenes IA', CanCreateGeneratedImages: 'Crear imágenes IA', CanUpdateGeneratedImages: 'Editar imágenes IA', CanDeleteGeneratedImages: 'Eliminar imágenes IA',
  // Logs y preferencias
  CanViewTokenUsageLogs: 'Ver logs tokens', CanEditTokenUsageLogs: 'Editar logs tokens', CanDeleteTokenUsageLogs: 'Eliminar logs tokens',
  CanViewUserPreferences: 'Ver preferencias',
  // Misc
  Admin: 'Admin completo',
};

const toLabel = (name) => permissionLabels[name] || name.replace(/^Can/, '').replace(/([A-Z])/g, ' $1').trim();

const PERMISSION_GROUPS = [
  { label: 'Usuarios', keys: ['CanViewUsers','CanEditUsers','CanDeleteUsers'] },
  { label: 'Bots', keys: ['CanViewBots','CanEditBots','CanDeleteBots'] },
  { label: 'Estilos y perfiles', keys: ['CanViewBotStyles','CanUpdateBotStyles','CanViewBotProfiles','CanCreateBotProfiles','CanUpdateBotProfiles','CanDeleteBotProfiles'] },
  { label: 'Conversaciones', keys: ['CanViewConversations','CanEditConversations','CanDeleteConversations','CanViewConversationTags','CanEditConversationTags','CanDeleteConversationTags'] },
  { label: 'Datos captados', keys: ['datos_captados_bot','CanViewBotDataCaptureFields'] },
  { label: 'Training y documentos', keys: ['CanUploadFiles','CanViewUploadedDocuments','CanDeleteUploads','CanViewTrainingCustomTexts','CanViewTrainingUrls','CanDeleteTrainingUrls','CanViewBotTrainingConfigs','CanEditBotTrainingConfigs','CanEditTemplateTrainingSessions','CanViewKnowledgeChunks'] },
  { label: 'Prompts y plantillas', keys: ['CanViewBotCustomPrompts','CanEditBotCustomPrompts','CanDeleteBotCustomPrompts','CanViewBotTemplates','CanViewBotTemplatePrompts','CanEditBotTemplatePrompts'] },
  { label: 'Acciones e integraciones', keys: ['CanViewBotActions','CanCreateBotActions','CanUpdateBotActions','CanDeleteBotActions','CanViewBotIntegrations','CanEditBotIntegrations','CanViewBotInstallationSettings','CanEditBotInstallationSettings'] },
  { label: 'Proveedores IA y modelos', keys: ['CanViewBotIaProviders','CanEditBotIaProviders','CanViewAiModelConfigs','CanEditAiModelConfigs','CanDeleteAiModelConfigs'] },
  { label: 'Suscripciones', keys: ['CanViewSubscriptions','CanUpdateSubscriptions','CanDeleteSubscriptions'] },
  { label: 'Soporte', keys: ['CanViewSupportTickets','CanCreateSupportTickets','CanUpdateSupportTickets','CanDeleteSupportTickets','CanViewSupportResponses','CanCreateSupportResponses','CanUpdateSupportResponses','CanDeleteSupportResponses'] },
  { label: 'Estilos globales', keys: ['CanViewStyleTemplates','CanCreateStyleTemplates','CanUpdateStyleTemplates','CanDeleteStyleTemplates'] },
  { label: 'Imágenes IA', keys: ['CanViewGeneratedImages','CanCreateGeneratedImages','CanUpdateGeneratedImages','CanDeleteGeneratedImages'] },
  { label: 'Roles y permisos', keys: ['CanManageRoles','CanManagePermissions','ViewRolePermissions','AssignPermissionToRole','RevokePermissionFromRole'] },
  { label: 'Logs y preferencias', keys: ['CanViewTokenUsageLogs','CanEditTokenUsageLogs','CanDeleteTokenUsageLogs','CanViewUserPreferences'] },
  { label: 'Admin', keys: ['Admin'] },
];

const groupPermissions = (permissions) => {
  const byName = Object.fromEntries(permissions.map(p => [p.name, p]));
  const grouped = [];
  const used = new Set();
  for (const group of PERMISSION_GROUPS) {
    const perms = group.keys.map(k => byName[k]).filter(Boolean);
    if (perms.length) { grouped.push({ label: group.label, perms }); perms.forEach(p => used.add(p.name)); }
  }
  const rest = permissions.filter(p => !used.has(p.name));
  if (rest.length) grouped.push({ label: 'Otros', perms: rest });
  return grouped;
};

const PREVIEW_COUNT = 5;

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [newRole, setNewRole] = useState({ name: "", permissions: [] });
  const [editRolePerms, setEditRolePerms] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [expandedRoles, setExpandedRoles] = useState({});
  const [loading, setLoading] = useState(true);

  const toggleExpand = (roleId) => setExpandedRoles(prev => ({ ...prev, [roleId]: !prev[roleId] }));

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
      <Paper sx={{ mb: 3, borderRadius: 2, boxShadow: 1, p: 2 }}>
        {groupPermissions(permissions).map(({ label, perms }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8392ab', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, borderBottom: '1px solid #e9ecef', paddingBottom: 2 }}>{label}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {perms.map((perm) => (
                <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: 4, width: '25%', cursor: 'pointer', padding: '2px 8px 2px 0' }}>
                  <Checkbox
                    checked={newRole.permissions.includes(perm.id)}
                    onChange={() => handleNewRolePermChange(perm.id)}
                    size="small"
                    color="primary"
                    sx={{ p: 0.3 }}
                  />
                  <span style={{ fontSize: 12, color: '#495057', lineHeight: 1.3 }}>{toLabel(perm.name)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </Paper>
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
                  <TableCell>
                    {(() => {
                      const assigned = permissions.filter(p => role.permissions.includes(p.id));
                      if (assigned.length === 0) return <span style={{ color: '#b0b0b0', fontSize: 12 }}>Sin permisos</span>;
                      const expanded = expandedRoles[role.id];
                      const visible = expanded ? assigned : assigned.slice(0, PREVIEW_COUNT);
                      return (
                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3px 4px' }}>
                          {visible.map(perm => (
                            <span key={perm.id} style={{ background: '#e0e7ef', color: '#344767', borderRadius: 12, padding: '2px 10px', fontSize: 12 }}>
                              {toLabel(perm.name)}
                            </span>
                          ))}
                          {assigned.length > PREVIEW_COUNT && (
                            <button onClick={() => toggleExpand(role.id)} style={{ border: 'none', background: 'none', color: '#1a73e8', fontSize: 12, cursor: 'pointer', padding: '2px 6px', fontWeight: 500 }}>
                              {expanded ? '▲ Menos' : `+${assigned.length - PREVIEW_COUNT} más`}
                            </button>
                          )}
                        </div>
                      );
                    })()}
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
                      <div style={{ marginBottom: 12 }}>
                        {groupPermissions(permissions).map(({ label, perms }) => (
                          <div key={label} style={{ marginBottom: 10 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#8392ab', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4, borderBottom: '1px solid #e9ecef', paddingBottom: 2 }}>{label}</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                              {perms.map((perm) => (
                                <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: 4, width: '25%', cursor: 'pointer', padding: '2px 8px 2px 0' }}>
                                  <Checkbox
                                    checked={editRolePerms.includes(perm.id)}
                                    onChange={() => setEditRolePerms(prev => prev.includes(perm.id) ? prev.filter(p => p !== perm.id) : [...prev, perm.id])}
                                    size="small"
                                    color="primary"
                                    sx={{ p: 0.3 }}
                                  />
                                  <span style={{ fontSize: 12, color: '#495057', lineHeight: 1.3 }}>{toLabel(perm.name)}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
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
