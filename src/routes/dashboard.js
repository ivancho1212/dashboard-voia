import Dashboard from "layouts/dashboard";
import SpaceShipIcon from "examples/Icons/SpaceShip"; 
import { hasPermission } from "utils/permissions";

const dashboardRoutes = [
  {
    type: "collapse",
    name: "Inicio",
    key: "dashboard",
    route: "/dashboard",
    icon: <SpaceShipIcon size="12px" color="dark" />,
    component: Dashboard,
    noCollapse: true,
    protected: true,
  },
];

// Filtro de rutas según permisos del usuario
export function getDashboardRoutesForUser(user) {
  return dashboardRoutes.filter((route) => {
    if (!route.permission) return true;
    return hasPermission(user, route.permission);
  });
}

export default dashboardRoutes;
