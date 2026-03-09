import { FaBook, FaBell } from "react-icons/fa";
import Documentation from "layouts/documentation";
import Notifications from "layouts/notifications";

const otherRoutes = [
  {
    type: "title",
    title: "Otras Rutas",  
    key: "other-title",
  },
  {
    type: "collapse",
    name: "Documentación",
    key: "documentation",
    route: "/documentation",
    icon: <FaBook size="12px" />,
    component: Documentation,
    noCollapse: true,
    protected: true,
  },
  {
    type: "collapse",
    name: "Notificaciones",
    key: "notifications",
    route: "/notifications",
    icon: <FaBell size="12px" />,
    component: Notifications,
    noCollapse: true,
    protected: true,
  },
];

export default otherRoutes;
