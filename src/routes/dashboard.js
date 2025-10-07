import Dashboard from "layouts/dashboard";
import SpaceShipIcon from "examples/Icons/SpaceShip"; 

const dashboardRoutes = [
  {
    type: "collapse",
    name: "Inicio",
    key: "dashboard",
    route: "/dashboard",
    icon: <SpaceShipIcon size="12px" />,
    component: Dashboard,
    noCollapse: true,
  },
];

export default dashboardRoutes;
