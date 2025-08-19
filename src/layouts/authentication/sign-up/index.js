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
import curved6 from "assets/images/curved-images/curved14.webp";
import { register } from "services/authService"; // Asegúrate de importar la función correctamente
import { Link } from "react-router-dom";
import TermsModal from "../components/TermsModal";
import ReCAPTCHA from "react-google-recaptcha";

function SignUp() {
  const navigate = useNavigate();

  // Estado del formulario
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    documentNumber: "",
    documentPhotoUrl: "",
    avatarUrl: "",
    documentTypeId: "",
    dataConsent: false,
  });

  // Estado de los errores y mensajes
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [socialProvider, setSocialProvider] = useState(null);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  // Manejar el cambio de los inputs del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: name === "documentTypeId" ? parseInt(value) || "" : value,
    });
  };

  // Validación del formulario
  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^3\d{9}$/;
    const documentRegex = /^\d{6,12}$/;

    if (!form.name.trim() || form.name.split(" ").length < 2) {
      errors.name = "Debe ingresar tanto el nombre como el apellido.";
    }
    if (!emailRegex.test(form.email)) errors.email = "Correo electrónico inválido.";
    if (form.password.length < 6) errors.password = "Mínimo 6 caracteres.";
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
    if (!phoneRegex.test(form.phone)) errors.phone = "Teléfono inválido. Ej: 3XXXXXXXXX";
    if (!form.address.trim()) errors.address = "La dirección es obligatoria.";
    if (!documentRegex.test(form.documentNumber))
      errors.documentNumber = "Documento inválido (6-12 dígitos).";
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

    // if (!recaptchaToken) {
    //  setError("Por favor, confirma que no eres un robot.");
    //  return;
    //  }

    try {
      const newUser = {
        name: form.name,
        email: form.email,
        password: form.password,
        roleId: 2, // Rol por defecto
        documentTypeId: parseInt(form.documentTypeId, 10),
        phone: form.phone,
        address: form.address,
        documentNumber: form.documentNumber,
        documentPhotoUrl: form.documentPhotoUrl,
        avatarUrl: form.avatarUrl,
        isVerified: false,
        recaptchaToken,

        // Aquí agregamos los consentimientos
        consents: [
          {
            consent_type: "terms_and_conditions",
            granted: form.termsAccepted ? 1 : 0,
          },
          {
            consent_type: "privacy_policy",
            granted: form.privacyAccepted ? 1 : 0,
          },
        ],
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
    <BasicLayout title="¡Bienvenido!" image={curved6}>
      <Card
        sx={{
          mb: { xs: 6, sm: 8, md: 10, lg: 12 },
          boxShadow: "0px 8px 25px rgba(0, 0, 0, 0.2)", // 👈 sombra extra
          borderRadius: "16px", // opcional, para esquinas más suaves
        }}
      >
        <SoftBox p={3} textAlign="center">
          <SoftTypography variant="h5" fontWeight="medium" mb={2}>
            Crear cuenta
          </SoftTypography>
        </SoftBox>
        <SoftBox mb={2}>
          <Socials
            onSocialClick={(provider) => {
              setSocialProvider(provider);
              setShowTermsModal(true); // 👈 abre el modal
            }}
          />
        </SoftBox>

        {/* Modal de términos */}
        <TermsModal
          open={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={() => {
            setShowTermsModal(false);
            // Aquí ya puedes llamar tu login con Google/Microsoft
            console.log("Usuario aceptó términos con", socialProvider);
          }}
        />

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
                type="password"
                placeholder="Confirmar contraseña"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              {formErrors.confirmPassword && (
                <SoftTypography color="error" fontSize="small">
                  {formErrors.confirmPassword}
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
                  "&:focus": {
                    outline: "none",
                    borderColor: "#344767",
                    boxShadow: "0 0 0 2px rgba(52, 71, 103, 0.2)",
                  },
                }}
              >
                <option value="">Seleccionar tipo de documento</option>
                <option value="1">Cédula de Ciudadanía</option>
                <option value="2">NIT</option>
                <option value="3">Pasaporte</option>
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
              <SoftTypography
                color="error"
                fontWeight="regular"
                variant="caption"
                sx={{ fontSize: "0.75rem" }}
              >
                {error}
              </SoftTypography>
            )}

            {/* Check obligatorio: Términos */}
            <SoftBox display="flex" alignItems="center" mt={1}>
              <Checkbox
                checked={agreement}
                onChange={() => setAgreement(!agreement)}
                sx={{ p: 0.5 }}
              />
              <SoftTypography variant="caption" fontWeight="regular" sx={{ fontSize: "0.75rem" }}>
                &nbsp;Acepto los&nbsp;
                <SoftTypography
                  component={Link}
                  to="/terminos"
                  variant="caption"
                  fontWeight="bold"
                  textGradient
                >
                  Términos y condiciones
                </SoftTypography>
              </SoftTypography>
            </SoftBox>

            <SoftBox display="flex" alignItems="center" mt={1} mb={2}>
              <Checkbox
                checked={form.dataConsent || false}
                onChange={() => setForm({ ...form, dataConsent: !form.dataConsent })}
                sx={{ p: 0.5 }}
              />
              <SoftTypography variant="caption" fontWeight="regular" sx={{ fontSize: "0.75rem" }}>
                &nbsp;Autorizo el uso de mis datos para&nbsp;
                <SoftTypography
                  component={Link}
                  to="/autorizacion-datos"
                  variant="caption"
                  fontWeight="bold"
                  textGradient
                >
                  Entrenamiento y mejora de Inteligencia Artificial
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
            {/* 
            <SoftBox mt={2} mb={2} textAlign="center">
              <ReCAPTCHA
                sitekey="TU_SITE_KEY_AQUI" // 👈 el site key de Google reCAPTCHA
                onChange={(token) => setRecaptchaToken(token)}
              />
            </SoftBox>*/}

            <SoftBox mt={4} mb={1}>
              <SoftButton type="submit" variant="gradient" color="info" fullWidth>
                Registrarse
              </SoftButton>
            </SoftBox>

            <SoftBox mt={3} textAlign="center">
              <SoftTypography variant="button" color="text" fontWeight="regular">
                ¿Ya tienes una cuenta?{" "}
                <SoftTypography
                  component={Link}
                  to="/authentication/sign-in"
                  variant="button"
                  color="info"
                  fontWeight="bold"
                  textGradient
                >
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
