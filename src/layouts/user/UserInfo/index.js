import React, { useEffect, useState, useRef } from "react";
import { getDocumentTypes } from "../../../services/documentTypeService";
import { getUsers, updateUser } from "../../../services/userAdminService";
import { getRoles } from "../../../services/roleService";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tooltip, Pagination, Menu, MenuItem
} from "@mui/material";
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import SoftTypography from "components/SoftTypography";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import BlockIcon from "@mui/icons-material/Block";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const PAGE_SIZE = 20;

const UserInfo = () => {
  // Snackbar y Dialog para mensajes bonitos
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, user: null, type: null });
  // Cambia el estado de un usuario a activo
  const handleEnable = async (user) => {
    let validRoleId = Number(user.roleId);
    if (!validRoleId && user.role && user.role.id) {
      validRoleId = Number(user.role.id);
    }
    if (!validRoleId || !roles.some(r => r.id === validRoleId)) {
      setSnackbar({ open: true, message: "El usuario no tiene un rol válido. No se puede habilitar.", severity: 'error' });
      return;
    }
    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      city: user.city,
      address: user.address,
      documentNumber: user.documentNumber,
      documentPhotoUrl: user.documentPhotoUrl,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      roleId: validRoleId,
      documentTypeId: user.documentType?.id || user.documentTypeId,
      isActive: true,
      status: 'active',
    };
    await updateUser(user.id, payload);
    fetchUsers();
  };
  const [roles, setRoles] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [anchorRole, setAnchorRole] = useState(null);
  const [editingDocType, setEditingDocType] = useState(false);
  const docTypeInputRef = useRef();
  const [docTypeSelectOpen, setDocTypeSelectOpen] = useState(false);
  const [documentTypes, setDocumentTypes] = useState([]);
  useEffect(() => {
  getDocumentTypes().then(setDocumentTypes).catch(() => setDocumentTypes([]));
  getRoles().then(setRoles).catch(() => setRoles([]));
  }, []);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [editData, setEditData] = useState({});
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'blocked'
  const [anchorEl, setAnchorEl] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, [page, search, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers({ page, pageSize: PAGE_SIZE, search });
      let filtered = data.users;
      // Filtro por estado
      if (statusFilter === "active")
        filtered = filtered.filter((u) => u.isActive !== false);
      if (statusFilter === "blocked")
        filtered = filtered.filter((u) => u.isActive === false);
      // Filtro por rol
      if (roleFilter !== 'all')
        filtered = filtered.filter((u) => u.role?.id === Number(roleFilter));
      // Filtro por búsqueda (nombre, email, documento, teléfono, ciudad, país)
      if (search.trim() !== "") {
        const s = search.trim().toLowerCase();
        filtered = filtered.filter(u =>
          (u.name && u.name.toLowerCase().includes(s)) ||
          (u.email && u.email.toLowerCase().includes(s)) ||
          (u.documentNumber && u.documentNumber.toLowerCase().includes(s)) ||
          (u.phone && u.phone.toLowerCase().includes(s)) ||
          (u.city && u.city.toLowerCase().includes(s)) ||
          (u.country && u.country.toLowerCase().includes(s))
        );
      }
      setUsers(filtered);
      setTotal(data.total);
    } catch (e) {
      setUsers([]);
      setTotal(0);
    }
    setLoading(false);
  };

  const handleEdit = (user) => {
    setEditUser(user);
    setEditData({ ...user });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    // Determina el roleId válido
    let validRoleId = Number(editData.roleId);
    if (!validRoleId && editData.role && editData.role.id) {
      validRoleId = Number(editData.role.id);
    }
    if (!validRoleId || !roles.some(r => r.id === validRoleId)) {
      setSnackbar({ open: true, message: "Debes seleccionar un rol válido.", severity: 'error' });
      return;
    }
    const payload = {
      ...editData,
      roleId: validRoleId,
      documentTypeId: editData.documentTypeId ? Number(editData.documentTypeId) : null,
    };
    await updateUser(editUser.id, payload);
    setEditUser(null);
    fetchUsers();
  };

  const handleBlock = async (user) => {
    // Determina el roleId válido
    let validRoleId = Number(user.roleId);
    if (!validRoleId && user.role && user.role.id) {
      validRoleId = Number(user.role.id);
    }
    if (!validRoleId || !roles.some(r => r.id === validRoleId)) {
      setSnackbar({ open: true, message: "El usuario no tiene un rol válido. No se puede bloquear/inactivar.", severity: 'error' });
      return;
    }
    setConfirmDialog({ open: true, user, type: 'block' });
  };

  const handleDelete = async (user) => {
    setConfirmDialog({ open: true, user, type: 'inactive' });
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  // Reiniciar página al cambiar filtro de estado o rol
  useEffect(() => {
    setPage(1);
  }, [statusFilter, roleFilter]);

  if (loading) return <div>Cargando usuarios...</div>;
  return (
    <>
      {/* Snackbar para mensajes */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Dialogo de confirmación para bloquear/inactivar */}
      <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false, user: null, type: null })}>
        <DialogTitle>
          {confirmDialog.type === 'block' ? '¿Bloquear usuario?' : '¿Inactivar usuario?'}
        </DialogTitle>
        <DialogContent>
          <SoftTypography>
            {confirmDialog.type === 'block'
              ? `¿Seguro que deseas bloquear a ${confirmDialog.user?.name}? El usuario no podrá acceder hasta ser habilitado.`
              : `¿Seguro que deseas inactivar a ${confirmDialog.user?.name}? El usuario quedará inactivo y no podrá acceder hasta ser habilitado.`}
          </SoftTypography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, user: null, type: null })} color="info">
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              const user = confirmDialog.user;
              let validRoleId = Number(user.roleId);
              if (!validRoleId && user.role && user.role.id) {
                validRoleId = Number(user.role.id);
              }
              if (!validRoleId || !roles.some(r => r.id === validRoleId)) {
                setSnackbar({ open: true, message: "El usuario no tiene un rol válido.", severity: 'error' });
                setConfirmDialog({ open: false, user: null, type: null });
                return;
              }
              const payload = {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                country: user.country,
                city: user.city,
                address: user.address,
                documentNumber: user.documentNumber,
                documentPhotoUrl: user.documentPhotoUrl,
                avatarUrl: user.avatarUrl,
                isVerified: user.isVerified,
                roleId: validRoleId,
                documentTypeId: user.documentType?.id || user.documentTypeId,
                isActive: false,
                status: confirmDialog.type === 'block' ? 'blocked' : 'inactive',
              };
              await updateUser(user.id, payload);
              setSnackbar({ open: true, message: confirmDialog.type === 'block' ? 'Usuario bloqueado correctamente.' : 'Usuario inactivado correctamente.', severity: 'success' });
              setConfirmDialog({ open: false, user: null, type: null });
              fetchUsers();
            }}
            color={confirmDialog.type === 'block' ? 'warning' : 'error'}
            variant="contained"
          >
            {confirmDialog.type === 'block' ? 'Bloquear' : 'Inactivar'}
          </Button>
        </DialogActions>
      </Dialog>

      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Usuarios registrados
      </SoftTypography>

      {/* Buscador + Filtro */}
      <form
        onSubmit={handleSearch}
        style={{ marginBottom: 16, display: "flex", alignItems: "center" }}
      >
        <TextField
          placeholder="Buscar usuario..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          size="small"
          sx={{ width: 320 }}
        />
        <IconButton type="submit" sx={{ ml: 1 }}>
          <SearchIcon />
        </IconButton>
        <IconButton
          sx={{ ml: 1 }}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="Filtrar por estado"
        >
          <FilterListIcon />
        </IconButton>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          <MenuItem
            selected={statusFilter === "all"}
            onClick={() => {
              setStatusFilter("all");
              setAnchorEl(null);
            }}
          >
            Todos
          </MenuItem>
          <MenuItem
            selected={statusFilter === "active"}
            onClick={() => {
              setStatusFilter("active");
              setAnchorEl(null);
            }}
          >
            Activos
          </MenuItem>
          <MenuItem
            selected={statusFilter === "blocked"}
            onClick={() => {
              setStatusFilter("blocked");
              setAnchorEl(null);
            }}
          >
            Bloqueados
          </MenuItem>
        </Menu>
        <IconButton
          sx={{ ml: 1, transform: 'scaleX(-1)' }}
          onClick={(e) => setAnchorRole(e.currentTarget)}
          aria-label="Filtrar por rol"
        >
          <MenuOpenIcon />
        </IconButton>
        <Menu
          anchorEl={anchorRole}
          open={Boolean(anchorRole)}
          onClose={() => setAnchorRole(null)}
        >
          <MenuItem
            selected={roleFilter === 'all'}
            onClick={() => {
              setRoleFilter('all');
              setAnchorRole(null);
            }}
          >
            Todos los roles
          </MenuItem>
          {roles.map((role) => (
            <MenuItem
              key={role.id}
              selected={roleFilter === String(role.id)}
              onClick={() => {
                setRoleFilter(String(role.id));
                setAnchorRole(null);
              }}
            >
              {role.name}
            </MenuItem>
          ))}
        </Menu>
      </form>

      {/* Tabla de usuarios */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ background: '#f5f5f5' }}>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Tokens consumidos</TableCell>
              <TableCell>Bots</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                style={
                  user.status === 'blocked'
                    ? { background: '#ffeaea', color: '#b71c1c' }
                    : user.status === 'inactive'
                      ? { background: '#e0e0e0', color: '#757575' }
                      : user.status === 'active'
                        ? { background: '#fff', color: '#222' }
                        : {}
                }
              >
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role?.name || '-'}</TableCell>
                <TableCell>{user.plan?.name || "-"}</TableCell>
                <TableCell>{user.tokensUsed || 0}</TableCell>
                <TableCell>
                  {user.bots && user.bots.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {user.bots.map((b) => (
                        <li key={b.id}>{b.name}</li>
                      ))}
                    </ul>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>
                  {/* Acciones según estado */}
                  {user.status === 'active' && (
                    <>
                      <Tooltip title="Editar">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleEdit(user)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Bloquear">
                        <IconButton
                          color="warning"
                          size="small"
                          onClick={() => handleBlock(user)}
                        >
                          <BlockIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Inactivar">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDelete(user)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {user.status === 'blocked' && (
                    <Tooltip title="Desbloquear">
                      <IconButton
                        color="success"
                        size="small"
                        onClick={() => handleEnable(user)}
                      >
                        <BlockIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                  {user.status === 'inactive' && (
                    <Tooltip title="Habilitar">
                      <IconButton
                        color="success"
                        size="small"
                        onClick={() => handleEnable(user)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination
        count={Math.ceil(total / PAGE_SIZE)}
        page={page}
        onChange={handlePageChange}
        sx={{ mt: 2, display: "flex", justifyContent: "center" }}
      />

      {/* Diálogo de edición */}
      <Dialog
        open={!!editUser}
        onClose={() => setEditUser(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Editar usuario</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexWrap: "wrap", gap: 2, p: 3, pt: 8 }}
        >
          <TextField
            label="Nombre"
            name="name"
            value={editData.name ?? ""}
            onChange={handleEditChange}
            placeholder="Ej: Juan Pérez"
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
            autoFocus
          />

          <TextField
            select={editingDocType}
            label="Tipo de documento"
            name="documentTypeId"
            value={editingDocType
              ? (editData.documentTypeId ?? '')
              : (documentTypes.find(dt => dt.id === editData.documentTypeId)?.name || editData.documentTypeName || '')
            }
            onChange={e => {
              handleEditChange(e);
              setEditingDocType(false);
              setDocTypeSelectOpen(false);
            }}
            onFocus={e => {
              setEditingDocType(true);
              setDocTypeSelectOpen(true);
            }}
            onBlur={() => {
              setEditingDocType(false);
              setDocTypeSelectOpen(false);
            }}
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
            SelectProps={{
              open: docTypeSelectOpen,
              onOpen: () => setDocTypeSelectOpen(true),
              onClose: () => {
                setEditingDocType(false);
                setDocTypeSelectOpen(false);
              },
              MenuProps: {
                onClose: () => {
                  setEditingDocType(false);
                  setDocTypeSelectOpen(false);
                }
              }
            }}
          >
            {documentTypes.map((dt) => (
              <MenuItem key={dt.id} value={dt.id}>
                {dt.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Número de Documento"
            name="documentNumber"
            value={editData.documentNumber ?? ""}
            onChange={handleEditChange}
            placeholder="Número de Documento"
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
          />

          <TextField
            label="Dirección"
            name="address"
            value={editData.address ?? ""}
            onChange={handleEditChange}
            placeholder="Dirección"
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
          />

          <TextField
            label="País"
            name="country"
            value={editData.country ?? ""}
            onChange={handleEditChange}
            placeholder="País"
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
          />

          <TextField
            label="Ciudad"
            name="city"
            value={editData.city ?? ""}
            onChange={handleEditChange}
            placeholder="Ciudad"
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
          />

          <TextField
            label="Teléfono"
            name="phone"
            value={editData.phone ?? ""}
            onChange={handleEditChange}
            placeholder="Teléfono"
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
          />

          <TextField
            label="Email"
            name="email"
            value={editData.email ?? ""}
            onChange={handleEditChange}
            placeholder="Email"
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
          />

          {/* Plan asociado como solo lectura */}
          <TextField
            select
            label="Plan"
            name="plan"
            value={editData.plan?.name ?? "-"}
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent',
              },
              '& .MuiInput-underline:hover:not(.Mui-disabled):before': {
                borderBottomColor: 'transparent',
              }
            }}
            fullWidth
            disabled
          >
            <option value={editData.plan?.name ?? "-"}>
              {editData.plan?.name ?? "-"}
            </option>
          </TextField>

          <TextField
            select
            label="Rol"
            name="roleId"
            value={editData.role?.id ?? ''}
            onChange={e => {
              const selectedRole = roles.find(r => r.id === Number(e.target.value));
              setEditData({ ...editData, role: selectedRole, roleId: selectedRole?.id });
            }}
            variant="standard"
            InputLabelProps={{
              shrink: true,
              sx: {
                '&.Mui-focused': { color: 'info.main' },
                color: 'text.secondary',
                fontSize: 16,
                background: '#fff',
                px: 0.5,
                zIndex: 1
              }
            }}
            sx={{
              flex: '1 1 30%',
              mb: 3,
              background: '#fff',
              borderRadius: 1,
              '& .MuiInput-underline:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-disabled:before': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              },
              '& .MuiInput-underline.Mui-focused:after': {
                borderBottomColor: 'transparent !important',
                borderBottomWidth: 0,
              }
            }}
            fullWidth
          >
            {roles.map((role) => (
              <MenuItem key={role.id} value={role.id}>
                {role.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUser(null)} color="info">
            Cancelar
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            sx={{ color: "#fff", backgroundColor: "info.main" }}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserInfo;
