// dashboard-via/src/routes/landing.js (Corregido)
import LandingLayout from "../layouts/landing/LandingLayout";
import LandingPage from "../layouts/landing/LandingPage";
import ViaPage from "../layouts/landing/ViaPage";
import FaqDetail from "../layouts/landing/FaqDetail";
import ServiceDetail from "../layouts/landing/services/ServiceDetail";
// ✅ Importa tu componente de política de privacidad desde la ruta correcta
import PrivacyPolicyPage from "../layouts/landing/PrivacyPolicyPage";

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
      // ✅ Añade la nueva ruta aquí para que use el LandingLayout
      {
        path: "politica-de-privacidad", // /politica-de-privacidad
        element: <PrivacyPolicyPage />,
      },
    ],
  },
];

export default landingRoutes;