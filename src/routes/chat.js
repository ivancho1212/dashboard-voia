import { Navigate } from "react-router-dom";
import MobileChat from "layouts/chat/MobileChat";

const chatRoutes = [
  {
    key: "mobile-chat",
    route: "/chat/mobile",
    name: "MobileChat",
    component: MobileChat,
  },
  // Evitar que /c (o rutas cortas erróneas) dejen pantalla en blanco o cuelguen el navegador
  {
    key: "redirect-c",
    route: "/c",
    name: "RedirectC",
    component: () => <Navigate to="/" replace />,
  },
];

export default chatRoutes;
