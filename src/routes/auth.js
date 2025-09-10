import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";
import { FaLock, FaUserEdit} from "react-icons/fa";  // Nuevos iconos

const authRoutes = [
  {
    type: "title",
    title: "Autenticación",
    key: "auth-title",
  },
  {
    type: "collapse",
    name: "Iniciar sesión",
    key: "sign-in",
    route: "/authentication/sign-in",
    icon: <FaLock size="12px" />,  // Usando FaLock
    component: SignIn,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Registrarse",
    key: "sign-up",
    route: "/authentication/sign-up",
    icon: <FaUserEdit size="12px" />,  // Usando FaUserEdit
    component: SignUp,
    noCollapse: true,
  },
];

export default authRoutes;
