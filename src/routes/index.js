import { getDashboardRoutesForUser } from "./dashboard";
import botRoutes from "./bot";
import userRoutes from "./user";
import planRoutes from "./plan";
import billingRoutes from "./billing";
import supportRoutes from "./support";
import dataRoutes from "./data";
import configRoutes from "./config";
import authRoutes from "./auth";
import otherRoutes from "./others";
import widgetRoutes from "./widget";
import chatRoutes from "./chat";
import landingRoutes from "./landing";
import legalRoutes from "./legal";

// Exportar una función que recibe el usuario y retorna las rutas
export function getAllRoutesForUser(user) {
  const dashboardRoutes = getDashboardRoutesForUser(user);
  return [
    ...landingRoutes,
    ...dashboardRoutes,
    ...userRoutes,
    ...planRoutes,
    ...configRoutes,
    ...botRoutes,
    ...dataRoutes,
    ...billingRoutes,
    ...supportRoutes,
    ...authRoutes,
    ...otherRoutes, 
    ...widgetRoutes,
    ...chatRoutes,
    ...legalRoutes, 
  ];
}
