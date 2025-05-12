import { FaListAlt, FaClipboardCheck, FaTools } from "react-icons/fa";

import Plans from "layouts/plan";
import CurrentPlan from "layouts/plan/current";
import PlanChange from "layouts/plan/change";
import PlansAdmin from "layouts/plan/admin";

const planRoutes = [
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
    component: <Plans />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Mi Plan Actual",
    key: "current-plan",
    route: "/plans/current",
    icon: <FaClipboardCheck size={14} />,
    component: <CurrentPlan />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Administrar Planes",
    key: "plans-admin",
    route: "/admin/plans",
    icon: <FaTools size={14} />,
    component: <PlansAdmin />,
    noCollapse: true,
  },
  // Ruta interna (no visible en el menú lateral)
  {
    key: "plan-change",
    route: "/plans/change",
    name: "Cambiar de Plan",
    component: <PlanChange />,
  },
];

export default planRoutes;
