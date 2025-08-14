// dashboard-via/src/routes/landing.js
import LandingLayout from "../layouts/landing/LandingLayout";
import LandingPage from "../layouts/landing/LandingPage";
import ViaPage from "../layouts/landing/ViaPage";
import FaqDetail from "../layouts/landing/FaqDetail"; // ✅ importa tu componente
import ServiceDetail from "../layouts/landing/services/ServiceDetail";



const landingRoutes = [
  {
    path: "/",
    element: <LandingLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: "via", // /via
        element: <ViaPage />,
      },
      {
        path: "pregunta/:slug", // /pregunta/ejemplo
        element: <FaqDetail />,
      },
      {
        path: "servicio/:slug",
        element: <ServiceDetail />,
      },
    ],
  },
];

export default landingRoutes;
