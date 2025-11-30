import React, { useState } from "react";
import { getRoles, createUser } from "../../../services/userAdminService";
import { Grid, TextField, Select, MenuItem, FormControlLabel, Checkbox, Button } from "@mui/material";
import SoftTypography from "components/SoftTypography";

const UserCreation = () => {
  const [roles, setRoles] = useState([]);
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

  React.useEffect(() => {
    getRoles().then(setRoles);
  }, []);

  const handleNewUserChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  const handleNewUserRole = (e) => setNewUser({ ...newUser, roleId: e.target.value });
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
      await createUser(userPayload);
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
      // Mostrar errores de Identity de forma clara
      if (err && err.errors && Array.isArray(err.errors)) {
        const errorList = err.errors.map(e => e.description).join("\n");
        setUserError(errorList);
      } else if (err && err.message) {
        // Si el mensaje es un JSON, intenta extraer los errores
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.errors && Array.isArray(parsed.errors)) {
            const errorList = parsed.errors.map(e => e.description).join("\n");
            setUserError(errorList);
            return;
          }
          // Manejo de error de clave foránea o base de datos
          if (parsed.details && parsed.details.includes("Cannot add or update a child row: a foreign key constraint fails")) {
            setUserError("El tipo de documento seleccionado no es válido. Por favor, selecciona uno existente.");
            return;
          }
        } catch {}
        setUserError("No se pudo registrar el usuario. Verifica los datos ingresados.");
      } else {
        setUserError("No se pudo registrar el usuario");
      }
    }
  };

  return (
    <>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>Registrar nuevo usuario</SoftTypography>
      <Grid container spacing={2} mb={2}>
        {/* Fila 1 */}
        <Grid item xs={12} md={4}>
          <TextField
            placeholder="Ej: Juan Pérez"
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
    </>
  );
};

export default UserCreation;