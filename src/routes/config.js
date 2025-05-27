import { FaBrain, FaListAlt, FaBell } from "react-icons/fa";
import AIModels from "layouts/config/ai-models";
import Logs from "layouts/config/logs";
import Alerts from "layouts/config/alerts";

const configRoutes = [
  {
    type: "title",
    title: "Configuración",
    key: "config-title",
  },
  {
    type: "collapse",
    name: "Modelos de IA",
    key: "config-ai-models",
    route: "/config/ai-models",
    icon: <FaBrain size={14} />,
    component: <AIModels />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Registros",
    key: "config-logs",
    route: "/config/logs",
    icon: <FaListAlt size={14} />,
    component: <Logs />,
    noCollapse: true,
  },

];

export default configRoutes;

