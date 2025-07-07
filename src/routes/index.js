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
import widgetRoutes from "./widget";


const routes = [
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
];

export default routes;
