import { FaComments, FaFileAlt, FaKeyboard, FaFolderOpen } from "react-icons/fa";
import Conversations from "layouts/data/conversations";
import Documents from "layouts/data/documents";
import Prompts from "layouts/data/prompts";
import Resources from "layouts/data/resources";

const dataRoutes = [
  {
    type: "title",
    title: "Datos",
    key: "data-title",
  },
  {
    type: "collapse",
    name: "Conversaciones",
    key: "data-conversations",
    route: "/data/conversations",
    icon: <FaComments size={14} />,
    component: <Conversations />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Documentos",
    key: "data-documents",
    route: "/data/documents",
    icon: <FaFileAlt size={14} />,
    component: <Documents />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Recursos",
    key: "data-resources",
    route: "/data/resources",
    icon: <FaFolderOpen size={14} />,
    component: <Resources />,
    noCollapse: true,
  },
];

export default dataRoutes;
