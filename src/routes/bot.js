import BotsList from "layouts/bot";
import BotCreate from "layouts/bot/create";
import BotSettings from "layouts/bot/settings";
import BotTraining from "layouts/bot/training";
import BotStyle from "layouts/bot/style";
import BotIntegration from "layouts/bot/integration";
import BotPreview from "layouts/bot/preview";
import BotWidget from "layouts/bot/widget";
import BotUsageLogs from "layouts/bot/usage-logs";
import BotsAdmin from "layouts/bot/admin";

import { FaRobot, FaPlusCircle, FaCogs, FaBrain, FaPalette, FaPlug, FaEye, FaTools, FaHistory } from "react-icons/fa";
 

const botRoutes = [
  {
    type: "title",
    title: "Bots",
    key: "bots-title",
  },
  {
    type: "collapse",
    name: "Mis Bots",
    key: "bots-list",
    route: "/bots",
    icon: <FaRobot size={14} />,
    component: <BotsList />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Crear Bot",
    key: "bot-create",
    route: "/bots/create",
    icon: <FaPlusCircle size={14} />,
    component: <BotCreate />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Administrar Bots",
    key: "bots-admin",
    route: "/admin/bots",
    icon: <FaCogs size={14} />,
    component: <BotsAdmin />,
    noCollapse: true,
  },
  {
    key: "bot-settings",
    route: "/bots/settings",
    name: "Configuración del Bot",
    icon: <FaTools size={14} />,
    component: <BotSettings />,
  },
  {
    key: "bot-training",
    route: "/bots/training",
    name: "Entrenamiento del Bot",
    icon: <FaBrain size={14} />,
    component: <BotTraining />,
  },
  {
    key: "bot-style",
    route: "/bots/style",
    name: "Estilo del Bot",
    icon: <FaPalette size={14} />,
    component: <BotStyle />,
  },
  {
    key: "bot-integration",
    route: "/bots/integration",
    name: "Integración del Bot",
    icon: <FaPlug size={14} />,
    component: <BotIntegration />,
  },
  {
    key: "bot-preview",
    route: "/bots/preview",
    name: "Vista previa del Bot",
    icon: <FaEye size={14} />,
    component: <BotPreview />,
  },
  {
    key: "bot-widget",
    route: "/bots/widget",
    name: "Widget del Bot",
    icon: <FaRobot size={14} />,
    component: <BotWidget />,
  },
  {
    key: "bot-usage-logs",
    route: "/bots/usage-logs",
    name: "Historial de uso del Bot",
    icon: <FaHistory size={14} />,
    component: <BotUsageLogs />,
  },
];


export default botRoutes;
