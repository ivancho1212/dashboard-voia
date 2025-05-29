import {
  FaUserCircle,
  FaSlidersH,
  FaHeart,
  FaFileSignature,
  FaUsers,
  
} from "react-icons/fa";

import UserProfile from "layouts/profile"; // Cambio la importación a 'layouts/profile'
import Preferences from "layouts/profile/preferences"; // Cambié la importación a 'layouts/profile'
import Interests from "layouts/profile/interests"; // Cambié la importación a 'layouts/profile'
import Consents from "layouts/profile/consents"; // Cambié la importación a 'layouts/profile'
import Users from "layouts/profile"; // Ruta corregida

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
    component: <UserProfile />, // Ahora apunta a 'layouts/profile'
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Consentimientos",
    key: "user-consents",
    route: "/profile/consents", // Ruta actualizada
    icon: <FaFileSignature size={14} />,
    component: <Consents />, // Ahora apunta a 'layouts/profile/consents'
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Administrar de Usuarios",
    key: "users-list",
    route: "/admin/users", // Ruta sigue apuntando a admin
    icon: <FaUsers size={14} />,
    component: <Users />, // Sigue apuntando a 'layouts/admin/list'
    noCollapse: true,
  },
];

export default userRoutes;
