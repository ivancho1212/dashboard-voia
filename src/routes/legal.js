import Terminos from "layouts/legal/Terminos";
import AutorizacionDatos from "layouts/legal/AutorizacionDatos";

const legalRoutes = [
  {
    type: "collapse",
    name: "Términos y Condiciones",
    key: "terminos",
    route: "/terminos",
    component: <Terminos />,
  },
  {
    type: "collapse",
    name: "Autorización de Datos de Entrenamiento",
    key: "autorizacion-datos",
    route: "/autorizacion-datos",
    component: <AutorizacionDatos />,
  },
];

export default legalRoutes;
