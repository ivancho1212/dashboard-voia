import LandingLayout from "../layouts/landing/LandingLayout";
import LandingPage from "../layouts/landing/LandingPage";
import ViaPage from "../layouts/landing/ViaPage"; // ✅ nombre correcto

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
        path: "via", // esto equivale a /via
        element: <ViaPage />,
      },
    ],
  },
];

export default landingRoutes;
