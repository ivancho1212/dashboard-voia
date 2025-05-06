import { useState } from "react";
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

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    documentNumber: "",
    documentPhotoUrl: "",
    avatarUrl: "",
  });

  const [error, setError] = useState("");
  const [agreement, setAgreement] = useState(true);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const newUser = {
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: 2, // Role "User" por defecto
        documentTypeId: 1, // Tipo de documento por defecto
        phone: form.phone,
        address: form.address,
        documentNumber: form.documentNumber,
        documentPhotoUrl: form.documentPhotoUrl,
        avatarUrl: form.avatarUrl,
        isVerified: false,
      };

      await register(newUser);  // Llamada al servicio para registrar el usuario
      navigate("/authentication/sign-in");  // Redirige al login
    } catch (err) {
      console.error(err);
      setError("No se pudo registrar el usuario");
    }
  };

  return (
    <BasicLayout
      title="¡Bienvenido!"
      description="Usa el formulario para crear tu cuenta."
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
        <SoftBox pt={2} pb={3} px={3}>
          <SoftBox component="form" role="form" onSubmit={handleSubmit}>
            <SoftBox mb={2}>
              <SoftInput
                placeholder="Nombre"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftInput
                type="email"
                placeholder="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftInput
                type="password"
                placeholder="Contraseña"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftInput
                placeholder="Teléfono"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftInput
                placeholder="Dirección"
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </SoftBox>
            <SoftBox mb={2}>
              <SoftInput
                placeholder="Número de Documento"
                name="documentNumber"
                value={form.documentNumber}
                onChange={handleChange}
              />
            </SoftBox>
            {error && (
              <SoftTypography color="error" fontWeight="regular" variant="button">
                {error}
              </SoftTypography>
            )}
            <SoftBox display="flex" alignItems="center">
              <Checkbox checked={agreement} onChange={() => setAgreement(!agreement)} />
              <SoftTypography variant="button" fontWeight="regular" sx={{ cursor: "pointer" }}>
                &nbsp;&nbsp;Acepto los&nbsp;
              </SoftTypography>
              <SoftTypography component="a" href="#" variant="button" fontWeight="bold" textGradient>
                Términos y condiciones
              </SoftTypography>
            </SoftBox>
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
