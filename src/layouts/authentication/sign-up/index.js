import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import BasicLayout from "layouts/authentication/components/BasicLayout";
import Socials from "layouts/authentication/components/Socials";
import Separator from "layouts/authentication/components/Separator";
import curved6 from "assets/images/curved-images/curved14.jpg";
import { register } from "services/authService";  // Asegúrate de importar la función correctamente
import { Link } from "react-router-dom";

function SignUp() {
  const navigate = useNavigate();

  // Estado del formulario
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    documentNumber: "",
    documentPhotoUrl: "",
    avatarUrl: "",
    documentTypeId: "", // Este campo se añade para almacenar el tipo de documento
  });

  // Estado de los errores y mensajes
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreement, setAgreement] = useState(true);

  // Manejar el cambio de los inputs del formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Validación del formulario
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^3\d{9}$/;
    const documentRegex = /^\d{6,12}$/;

    if (!form.name.trim() || form.name.split(" ").length < 2) {errors.name = "Debe ingresar tanto el nombre como el apellido.";}    
    if (!emailRegex.test(form.email)) errors.email = "Correo electrónico inválido.";
    if (form.password.length < 6) errors.password = "Mínimo 6 caracteres.";
    if (!phoneRegex.test(form.phone)) errors.phone = "Teléfono inválido. Ej: 3XXXXXXXXX";
    if (!form.address.trim()) errors.address = "La dirección es obligatoria.";
    if (!documentRegex.test(form.documentNumber)) errors.documentNumber = "Documento inválido (6-12 dígitos).";
    if (!agreement) errors.agreement = "Debes aceptar los términos.";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejo del envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");     
    setSuccess("");    

    const isValid = validateForm();
    if (!isValid) {
      return; // ya seteaste los errores con setFormErrors en validateForm
    }

    // Validar si se ha seleccionado un tipo de documento
    if (!form.documentTypeId) {
      setError("El tipo de documento es obligatorio.");
      return;
    }

    try {
      const newUser = {
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: 2, // Aquí puedes cambiar si necesitas un rol diferente
        documentTypeId: form.documentTypeId, // Usar el valor seleccionado
        phone: form.phone,
        address: form.address,
        documentNumber: form.documentNumber,
        documentPhotoUrl: form.documentPhotoUrl,
        avatarUrl: form.avatarUrl,
        isVerified: false,
      };

      const res = await register(newUser);
      setSuccess(res.message || "Usuario registrado exitosamente");

      setTimeout(() => {
        navigate("/authentication/sign-in");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err.message || "No se pudo registrar el usuario");
    }
  };  
  
  return (
    <BasicLayout
      title="¡Bienvenido!"
      image={curved6}
    >
      <Card>
        <SoftBox p={3} mb={1} textAlign="center">
          <SoftTypography variant="h5" fontWeight="medium">
            Crear cuenta
          </SoftTypography>
        </SoftBox>
        <SoftBox mb={2}><Socials /></SoftBox>
        <Separator />
        <SoftBox pt={2} pb={3} px={2}>
          <SoftBox component="form" role="form" onSubmit={handleSubmit}>
          <SoftBox mb={2}>
            <SoftInput
              placeholder="Nombre y Apellido"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            {formErrors.name && (
              <SoftTypography color="error" fontSize="small">
                {formErrors.name}
              </SoftTypography>
            )}
          </SoftBox>

          <SoftBox mb={2}>
            <SoftInput
              type="email"
              placeholder="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
            />
            {formErrors.email && (
              <SoftTypography color="error" fontSize="small">
                {formErrors.email}
              </SoftTypography>
            )}
          </SoftBox>
          <SoftBox mb={2}>
            <SoftInput
              type="password"
              placeholder="Contraseña"
              name="password"
              value={form.password}
              onChange={handleChange}
            />
            {formErrors.password && (
              <SoftTypography color="error" fontSize="small">
                {formErrors.password}
              </SoftTypography>
            )}
          </SoftBox>
          <SoftBox mb={2}>
            <SoftInput
              placeholder="Teléfono"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
            {formErrors.phone && (
              <SoftTypography color="error" fontSize="small">
                {formErrors.phone}
              </SoftTypography>
            )}
          </SoftBox>
          <SoftBox mb={2}>
            <SoftInput
              placeholder="Dirección"
              name="address"
              value={form.address}
              onChange={handleChange}
            />
            {formErrors.address && (
              <SoftTypography color="error" fontSize="small">
                {formErrors.address}
              </SoftTypography>
            )}
          </SoftBox>
          <SoftBox mb={2}>
            <SoftBox
              component="select"
              name="documentTypeId"
              value={form.documentTypeId}
              onChange={handleChange}
              sx={{
                width: "100%",
                height: "42px",
                px: 1.5,
                py: 1,
                border: "1px solid #d2d6da",
                borderRadius: "0.5rem",
                color: "#495057",
                fontSize: "0.875rem",
                backgroundColor: "#fff",
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                appearance: "none",
                '&:focus': {
                  outline: "none",
                  borderColor: "#344767",
                  boxShadow: "0 0 0 2px rgba(52, 71, 103, 0.2)",
                },
              }}
            >
              <option value="">Seleccionar tipo de documento</option>
              <option value="23">Cédula de Ciudadanía</option>
              <option value="24">NIT</option>
              <option value="25">Pasaporte</option>
            </SoftBox>
          </SoftBox>


          <SoftBox mb={2}>
            <SoftInput
              placeholder="Número de Documento"
              name="documentNumber"
              value={form.documentNumber}
              onChange={handleChange}
            />
            {formErrors.documentNumber && (
              <SoftTypography color="error" fontSize="small">
                {formErrors.documentNumber}
              </SoftTypography>
            )}
          </SoftBox>

          {error && (
            <SoftTypography color="error" fontWeight="regular" variant="caption" sx={{ fontSize: "0.75rem" }}>
            {error}
          </SoftTypography>
          
          )}

        <SoftBox display="flex" alignItems="center" mt={1} mb={1}>
          <Checkbox checked={agreement} onChange={() => setAgreement(!agreement)} sx={{ p: 0.5 }} />
          <SoftTypography variant="caption" fontWeight="regular" sx={{ fontSize: "0.75rem" }}>
            &nbsp;Acepto los&nbsp;
            <SoftTypography component="a" href="#" variant="caption" fontWeight="bold" textGradient>
              Términos y condiciones
            </SoftTypography>
          </SoftTypography>
        </SoftBox>

          {formErrors.agreement && (
            <SoftTypography color="error" fontSize="small">
              {formErrors.agreement}
            </SoftTypography>
          )}

          {success && (
            <SoftTypography color="success" fontWeight="regular" variant="button">
              {success}
            </SoftTypography>
          )}

          <SoftBox mt={4} mb={1}>
            <SoftButton type="submit" variant="gradient" color="dark" fullWidth>
              Registrarse
            </SoftButton>
          </SoftBox>

          <SoftBox mt={3} textAlign="center">
            <SoftTypography variant="button" color="text" fontWeight="regular">
              ¿Ya tienes una cuenta?{" "}
              <SoftTypography component={Link} to="/authentication/sign-in" variant="button" color="dark" fontWeight="bold" textGradient>
                Iniciar sesión
              </SoftTypography>
            </SoftTypography>
          </SoftBox>

          </SoftBox>
        </SoftBox>
      </Card>
    </BasicLayout>
  );
}

export default SignUp;
