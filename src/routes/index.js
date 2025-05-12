import dashboardRoutes from "./dashboard";
import botRoutes from "./bot";
import userRoutes from "./user";
import planRoutes from "./plan";
import billingRoutes from "./billing";
import supportRoutes from "./support";
import dataRoutes from "./data";
import configRoutes from "./config";
import authRoutes from "./auth";
import otherRoutes from "./others";

const routes = [
  ...dashboardRoutes,
  ...botRoutes,
  ...userRoutes,
  ...planRoutes,
  ...billingRoutes,
  ...supportRoutes,
  ...dataRoutes,
  ...configRoutes,
  ...authRoutes,
  ...otherRoutes, 
];

export default routes;
