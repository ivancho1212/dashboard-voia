import {
  FaUserCircle,
  FaFileSignature,
  FaUsers,
  FaRobot,
  FaFileInvoiceDollar,
  FaCoins,
  FaCreditCard,
} from "react-icons/fa";

import UserProfile from "layouts/profile"; // Cambio la importación a 'layouts/profile'
import Consents from "layouts/profile/consents"; // Cambié la importación a 'layouts/profile'
import AdminUserPanel from "layouts/user"; // <- apuntando a index.js por defecto
import UserProfileList from "layouts/user/profile"; // Importa la vista
import BotsAssociated from "layouts/user/bots"; // Asegúrate de importar correctamente el componente
import PlanSuscriptionList from "layouts/user/planSuscripcion";
import Tokens from "layouts/user/tokens"; // ajusta la ruta según tu estructura real
import Pagos from "layouts/user/pagos"; // si existe src/layouts/user/pagos/index.js

const userRoutes = [
  {
    type: "title",
    title: "Usuarios",
    key: "users-title",
  },
  {
    type: "collapse",
    name: "Perfil de Usuario",
    key: "user-profile",
    route: "/profile", // Ruta base actualizada
    icon: <FaUserCircle size={14} />,
    component: UserProfile,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Consentimientos",
    key: "user-consents",
    route: "/profile/consents", // Ruta actualizada
    icon: <FaFileSignature size={14} />,
    component: Consents, // Ahora apunta a 'layouts/profile/consents'
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Panel de Usuarios",
    key: "admin-user-panel",
    route: "/admin/users",
    icon: <FaUsers size={14} />,
    component: AdminUserPanel,   // 👈 sin <>
    noCollapse: true,
  },
  {
    name: "Usuarios Registrados",
    key: "user-management",
    route: "/admin/users/info",
    icon: <FaUserCircle size={14} />,
    component: UserProfileList,  // 👈 sin <>
    noCollapse: true,
  },
  {
    name: "Bots Asociados",
    key: "bots-associated",
    route: "/admin/users/bots",
    icon: <FaRobot size={14} />,
    component: BotsAssociated,
    noCollapse: true,
  },
  {
    name: "Planes y Suscripciones",
    key: "user-plan-suscriptions",
    route: "/admin/users/planSuscripcion",
    icon: <FaFileInvoiceDollar size={14} />,
    component: PlanSuscriptionList,
    noCollapse: true,
  },
  {
    name: "Tokens",
    key: "user-tokens",
    route: "/admin/users/tokens",
    icon: <FaCoins size={14} />, // o cualquier icono que quieras usar
    component: Tokens, // importado desde src/layouts/user/tokens/index.js
    noCollapse: true,
  },
  {
    name: "Pagos",
    key: "user-pagos",
    route: "/admin/users/pagos",
    icon: <FaCreditCard size={14} />,
    component: Pagos,
    noCollapse: true,
  },
];

export default userRoutes;
