import { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import Switch from "@mui/material/Switch";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import CoverLayout from "layouts/authentication/components/CoverLayout";
import curved9 from "assets/images/curved-images/curved-6.webp";
import { login } from "services/authService"; // Tu función de login
import { useAuth } from "contexts/AuthContext";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { isAuthenticated, hydrated, login: loginContext } = useAuth();

  // Esperar a que el contexto esté hidratado antes de decidir
  if (!hydrated) return null;
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  const handleSetRememberMe = () => setRememberMe(!rememberMe);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const data = await login(email, password);
      // Usa el método del contexto para actualizar el estado global
      loginContext(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Credenciales incorrectas");
    }
  };

  // 👇 Handlers simulados para Google y Microsoft
  const handleGoogleLogin = () => {
    console.log("Login con Google (falta backend)");
  };

  const handleMicrosoftLogin = () => {
    console.log("Login con Microsoft (falta backend)");
  };

  return (
    <CoverLayout
      title="Bienvenido de nuevo"
      description="Ingresa tu email y contraseña para iniciar sesión"
      image={curved9}
      top={18}
    >
      <SoftBox component="form" role="form" onSubmit={handleSubmit}>
        <SoftBox mb={2}>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold" color="white">
              Email
            </SoftTypography>
          </SoftBox>
          <SoftInput
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </SoftBox>
        <SoftBox mb={2}>
          <SoftBox mb={1} ml={0.5}>
            <SoftTypography component="label" variant="caption" fontWeight="bold" color="white">
              Contraseña
            </SoftTypography>
          </SoftBox>
          <SoftInput
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </SoftBox>
        <SoftBox display="flex" alignItems="center">
          <Switch checked={rememberMe} onChange={handleSetRememberMe} />
          <SoftTypography
            variant="button"
            fontWeight="regular"
            color="white"
            onClick={handleSetRememberMe}
            sx={{ cursor: "pointer", userSelect: "none" }}
          >
            &nbsp;&nbsp;Recordarme
          </SoftTypography>
        </SoftBox>
        {error && (
          <SoftBox mt={2}>
            <SoftTypography color="error" variant="button" fontWeight="regular">
              {error}
            </SoftTypography>
          </SoftBox>
        )}
        <SoftBox mt={4} mb={1}>
          <SoftButton type="submit" variant="gradient" color="info" fullWidth>
            Iniciar sesión
          </SoftButton>
        </SoftBox>

        {/* Botones sociales en blanco 
        <SoftBox mt={2}>
          <SoftButton
            fullWidth
            sx={{
              mb: 1,
              backgroundColor: "white",
              color: "black",
              "&:hover": { backgroundColor: "#f0f0f0" },
            }}
            onClick={handleGoogleLogin}
          >
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="google"
              width="20"
              style={{ marginRight: "8px" }}
            />
            Iniciar sesión con Google
          </SoftButton>

          <SoftButton
            fullWidth
            sx={{
              backgroundColor: "white",
              color: "black",
              "&:hover": { backgroundColor: "#f0f0f0" },
            }}
            onClick={handleMicrosoftLogin}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
              alt="microsoft"
              width="20"
              style={{ marginRight: "8px" }}
            />
            Iniciar sesión con Microsoft
          </SoftButton>
        </SoftBox>
*/}
        <SoftBox mt={3} textAlign="center">
          <SoftTypography variant="button" color="text" fontWeight="regular">
            ¿No tienes una cuenta?{" "}
            <SoftTypography
              component={Link}
              to="/authentication/sign-up"
              variant="button"
              color="info"
              fontWeight="medium"
              textGradient
            >
              Regístrate
            </SoftTypography>
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </CoverLayout>
  );
}

export default SignIn;
