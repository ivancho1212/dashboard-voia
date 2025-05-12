import { FaTicketAlt, FaPlusCircle, FaReply, FaHeadset, FaUserCheck, FaCommentDots } from "react-icons/fa";

import CreateTicket from "layouts/support/create-ticket";
import MyTickets from "layouts/support/my-tickets";
import TicketReplies from "layouts/support/ticket-replies";
import SupportAdmin from "layouts/support/admin";
import AssignAgents from "layouts/support/assign-agents";
import QuickReplies from "layouts/support/quick-replies";

const supportRoutes = [
  {
    type: "title",
    title: "Soporte",
    key: "support-title",
  },
  {
    type: "collapse",
    name: "Mis Tickets",
    key: "my-tickets",
    route: "/support/tickets",
    icon: <FaTicketAlt size={14} />,
    component: <MyTickets />,
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Crear Ticket",
    key: "create-ticket",
    route: "/support/ticket/create",
    icon: <FaPlusCircle size={14} />,
    component: <CreateTicket />,
    noCollapse: true,
  },
  {
    key: "ticket-replies",
    route: "/support/ticket/replies",
    name: "Respuestas al Ticket",
    icon: <FaReply size={14} />,
    component: <TicketReplies />,
  },
  {
    key: "support-admin",
    route: "/admin/support",
    name: "Administrar Soporte",
    icon: <FaHeadset size={14} />,
    component: <SupportAdmin />,
  },
  {
    key: "assign-agents",
    route: "/admin/support/assign-agents",
    name: "Asignar Agentes",
    icon: <FaUserCheck size={14} />,
    component: <AssignAgents />,
  },
  {
    key: "quick-replies",
    route: "/admin/support/quick-replies",
    name: "Respuestas Rápidas",
    icon: <FaCommentDots size={14} />,
    component: <QuickReplies />,
  },
];

export default supportRoutes;
