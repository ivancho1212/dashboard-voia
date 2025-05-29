import BotsList from "layouts/bot";
import CapturedData from "layouts/bot/captured-data";
import BotTraining from "layouts/bot/training";
import BotStyle from "layouts/bot/style";
import BotIntegration from "layouts/bot/integration";
import BotPreview from "layouts/bot/preview";
import BotWidget from "layouts/bot/widget";
import BotUsageLogs from "layouts/bot/usage-logs";
import BotsAdmin from "layouts/bot/admin";

import { FaRobot, FaClipboardList, FaCogs, FaBrain, FaPalette, FaPlug, FaEye, FaTools, FaHistory } from "react-icons/fa";
 

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
    component: <BotsList />,
    noCollapse: true,
  }, 
  {
    type: "collapse",
    key: "bot-training",
    route: "/bots/training",
    name: "Entrenamiento",
    icon: <FaBrain size={14} />,
    component: <BotTraining />,
  },
  {
    type: "collapse",
    name: "Datos Captados",        // Nombre visible en el menú lateral
    key: "bot-captured-data",      // Identificador único
    route: "/bots/captured-data",  // Ruta en la URL
    icon: <FaClipboardList size={14} />, // Icono que representa datos
    component: <CapturedData />,   // Componente importado
  },
  {
    type: "collapse",
    name: "Estilos", // Cambia esto si quieres mostrar solo "Estilos"
    key: "bot-style",        // clave única más descriptiva
    route: "/bots/style",    // nueva ruta en la URL
    icon: <FaPalette size={14} />,
    component: <BotStyle />,     // renómbralo si vas a cambiar el nombre del componente también
    noCollapse: true,
  }, 
  {
    type: "collapse",
    key: "bot-integration",
    route: "/bots/integration",
    name: "Integración",
    icon: <FaPlug size={14} />,
    component: <BotIntegration />,
  },
  {
    type: "collapse",
    name: "Administrar",
    key: "bots-admin",
    route: "/admin/bots",
    icon: <FaCogs size={14} />,
    component: <BotsAdmin />,
    noCollapse: true,
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
