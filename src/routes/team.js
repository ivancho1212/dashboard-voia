import { FaUsers } from "react-icons/fa";
import MiEquipo from "layouts/team";

const teamRoutes = [
  {
    type: "collapse",
    name: "Mi Equipo",
    key: "mi-equipo",
    route: "/equipo",
    icon: <FaUsers size={14} />,
    component: MiEquipo,
    noCollapse: true,
    protected: true,
    hiddenForRoles: ["Comercial"],
  },
];

export default teamRoutes;
