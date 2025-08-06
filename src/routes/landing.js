// src/routes/landing.js
import LandingLayout from "../layouts/landing/LandingLayout";
import LandingPage from "../layouts/landing/LandingPage"; // ✅ ruta correcta

const landingRoutes = [
  {
    path: "/",
    element: <LandingLayout />,
    children: [
      {
        index: true, // ← equivale a la ruta "/"
        element: <LandingPage />,
      },
    ],
  },
];

export default landingRoutes;
