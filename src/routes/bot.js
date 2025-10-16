import BotsList from "layouts/bot";
import CapturedData from "layouts/bot/captured-data";
import BotTraining from "layouts/bot/training";
import BotStyle from "layouts/bot/style";
import BotStylesDashboard from "layouts/bot/styles";
import BotIntegration from "layouts/bot/integration";
import BotPreview from "layouts/bot/preview";
import BotUsageLogs from "layouts/bot/usage-logs";
import BotsAdmin from "layouts/bot/admin";

import {
  FaRobot,
  FaClipboardList,
  FaCogs,
  FaBrain,
  FaPalette,
  FaPlug,
  FaEye,
  FaHistory,
} from "react-icons/fa";

const botRoutes = [
  {
    type: "title",
    title: "Modelos",
    key: "bots-title",
  },
  {
    type: "collapse",
    name: "Modelo",
    key: "bots-list",
    route: "/bots",
    icon: <FaRobot size={14} />,
    component: BotsList, // ✅ corregido
    noCollapse: true,
  },
  {
    type: "collapse",
    key: "bot-training-id",
    route: "/bots/training/:id",
    name: "Entrenamiento",
    icon: <FaBrain size={14} />,
    component: BotTraining, // ✅ corregido
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Datos Captados",
    key: "bot-captured-data",
    route: "/bots/captured-data/:id",
    icon: <FaClipboardList size={14} />,
    component: CapturedData, // ✅ corregido
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Estilos",
    key: "bot-styles-dashboard",
    route: "/bots/styles",
    icon: <FaPalette size={14} />,
    component: BotStylesDashboard,
    noCollapse: true,
  },
  // Ruta directa para ver/editar estilo de un bot específico (no en sidebar)
  {
    key: "bot-style",
    route: "/bots/style/:id",
    component: BotStyle,
  },
  {
    type: "collapse",
    key: "bot-integration",
    route: "/bots/integration",
    name: "Integración",
    icon: <FaPlug size={14} />,
    component: BotIntegration, // ✅ corregido
  },
  {
    type: "collapse",
    name: "Administrar",
    key: "bots-admin",
    route: "/admin/bots",
    icon: <FaCogs size={14} />,
    component: BotsAdmin, // ✅ corregido
    noCollapse: true,
  },
  {
    key: "bot-preview",
    route: "/bots/preview",
    name: "Vista previa del Bot",
    icon: <FaEye size={14} />,
    component: BotPreview, // ✅ corregido
  },
  {
    key: "bot-usage-logs",
    route: "/bots/usage-logs",
    name: "Historial de uso del Bot",
    icon: <FaHistory size={14} />,
    component: BotUsageLogs, // ✅ corregido
  },
];

export default botRoutes;
