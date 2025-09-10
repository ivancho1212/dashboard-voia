import { FaListAlt, FaTools } from "react-icons/fa";

import Plans from "layouts/plan";
import PlanChange from "layouts/plan/change";
import PlansAdmin from "layouts/plan/admin";

// Verificamos si el usuario tiene plan desde el localStorage (por ejemplo, en tu login o fetch de usuario ya lo guardaste)
const userHasPlan = localStorage.getItem("userPlanId") !== null;

const planRoutes = [];

if (!userHasPlan) {
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
    },
    {
      type: "collapse",
      name: "Administrar Planes",
      key: "plans-admin",
      route: "/admin/plans",
      icon: <FaTools size={14} />,
      component: PlansAdmin,
      noCollapse: true,
    }
  );
}

// Esta ruta no se muestra en el sidebar, pero puede navegarse directamente
planRoutes.push({
  key: "plan-change",
  route: "/plans/change",
  name: "Cambiar de Plan",
  component: PlanChange,
});

export default planRoutes;
