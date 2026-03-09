import { FaListAlt, FaTools } from "react-icons/fa";

import Plans from "layouts/plan";
import PlanChange from "layouts/plan/change";
import PlansAdmin from "layouts/plan/admin";
import { hasRole } from "services/authService";

const userHasPlan = localStorage.getItem("userPlanId") !== null;
const isSuperAdmin = hasRole("Super Admin");

const planRoutes = [];

// Mostrar sección "Planes" a usuarios sin plan activo (Super Admin siempre la ve)
if (!userHasPlan || isSuperAdmin) {
  planRoutes.push(
    {
      type: "title",
      title: "Planes",
      key: "plans-title",
    },
    {
      type: "collapse",
      name: "Planes",
      key: "plans",
      route: "/plans",
      icon: <FaListAlt size={14} />,
      component: Plans,
      noCollapse: true,
      protected: true,
      hiddenForRoles: ["Comercial"],
    }
  );
}

// Solo visible para administradores
planRoutes.push({
  type: "collapse",
  name: "Administrar Planes",
  key: "plans-admin",
  route: "/admin/plans",
  icon: <FaTools size={14} />,
  component: PlansAdmin,
  noCollapse: true,
  protected: true,
  permission: "CanManageRoles",
});

// Esta ruta no se muestra en el sidebar, pero puede navegarse directamente
planRoutes.push({
  key: "plan-change",
  route: "/plans/change",
  name: "Cambiar de Plan",
  protected: true,
  component: PlanChange,
});

export default planRoutes;
