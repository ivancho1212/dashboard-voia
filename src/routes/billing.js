import Billing from "layouts/billing";
import { FaMoneyBillWave } from "react-icons/fa";

const billingRoutes = [
  {
    type: "title",
    title: "Facturación",
    key: "billing-title",
  },
  {
    type: "collapse",
    name: "Facturación",
    key: "billing",
    route: "/billing",
    icon: <FaMoneyBillWave size={14} />,
    component: Billing,
    noCollapse: true,
  },
];

export default billingRoutes;
