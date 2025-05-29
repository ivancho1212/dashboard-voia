import { FaBrain, FaListAlt, FaBell } from "react-icons/fa";
import AIModels from "layouts/config/ai-models";
import Logs from "layouts/config/logs";
import Alerts from "layouts/config/alerts";

const configRoutes = [
  {
    type: "title",
    title: "Configuración Inicial",
    key: "config-title",
  },
  {
    type: "collapse",
    name: "Proveedor de IA",
    key: "config-ai-models",
    route: "/config/ai-models",
    icon: <FaBrain size={14} />,
    component: <AIModels />,
    noCollapse: true,
  },


];

export default configRoutes;

