import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";

// Wrapper para rutas privadas
import { useContext } from "react";
import { AuthContext } from "contexts/AuthContext";
function PrivateRoute({ children }) {
  const { isAuthenticated, hydrated } = useContext(AuthContext);
  const location = useLocation();
  // Mientras no esté hidratado, no renderizar nada
  if (!hydrated) return null;
  if (!isAuthenticated) {
    // Forzar desmontaje inmediato de la vista protegida
    return <Navigate to="/authentication/sign-in" state={{ from: location }} replace />;
  }
  // Forzar remount de la vista protegida al cambiar autenticación
  return <React.Fragment key="auth">{children}</React.Fragment>;
}

PrivateRoute.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.string,
    PropTypes.number,
    PropTypes.element,
    PropTypes.bool,
    PropTypes.object,
  ]),
};

// MUI
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Soft UI Components
import SoftBox from "components/SoftBox";
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

// Themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";
import NotFound from "layouts/notFound";

// RTL
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Rutas
import { getAllRoutesForUser } from "routes/index";

// Context
import {
  useSoftUIController,
  setMiniSidenav,
  setOpenConfigurator,
  setLayout,
} from "context";

// Parallax
import { ParallaxProvider } from "react-scroll-parallax";

// ScrollToTop
import ScrollToTop from "components/ScrollToTop";

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();
  const isWidgetFrame = pathname === "/widget-frame";
  const isMobileChat = pathname.startsWith("/chat/mobile"); // Nueva ruta móvil
  const { user } = useAuth();

  // Rutas públicas (deben coincidir con landingRoutes y authRoutes)
  const publicPaths = [
    "/",
    "/via",
    "/authentication/sign-in",
    "/authentication/sign-up",
    "/politica-de-privacidad"
  ];
  const isLandingRoute =
    publicPaths.includes(pathname) ||
    pathname.startsWith("/pregunta") ||
    pathname.startsWith("/servicio");

  // Obtener rutas permitidas para el usuario
  const routes = useMemo(() => getAllRoutesForUser(user), [user]);

  useEffect(() => {
    if (isLandingRoute) {
      setLayout(dispatch, "landing");
      setMiniSidenav(dispatch, true);
    } else {
      setLayout(dispatch, "dashboard");
    }
  }, [pathname, dispatch, isLandingRoute]);

  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });
    setRtlCache(cacheRtl);
  }, []);

  const brand = "/via-negativo.png";

  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Rutas internas de bots que nunca deben aparecer en el sidebar
  // Permitimos /bots/styles y /bots/integration en el sidebar, pero ocultamos solo las rutas con :id y pasos internos
  const BOT_INTERNAL_ROUTES = [
    "/bots/training/:id",
    "/bots/captured-data/:id",
    "/bots/style/:id"
  ];

  // Generador de rutas con protección
  const getRoutes = (allRoutes) =>
    allRoutes.flatMap((route, index) => {
      if (route.collapse) return getRoutes(route.collapse);

      // Rutas con route/component (legacy)
      if (route.route && route.component) {
        const Component = route.component;
        let element = null;
        if (typeof Component === "function") {
          element = <Component />;
        } else if (Component && typeof Component === "object") {
          element = Component;
        }
        // Proteger solo rutas administrativas/dashboard
        const isProtectedRoute =
          route.route.startsWith("/admin") ||
          route.route.startsWith("/config") ||
          route.route.startsWith("/billing") ||
          route.route.startsWith("/data") ||
          route.route.startsWith("/profile") ||
          route.route.startsWith("/dashboard");
        if (element) {
          return (
            <Route
              key={route.key || index}
              path={route.route}
              element={isProtectedRoute ? <PrivateRoute>{element}</PrivateRoute> : element}
            />
          );
        }
        return null;
      }
      // Modern routes with children
      if (route.children) {
        const ParentElement =
          route.element && (typeof route.element === "function" ? <route.element /> : route.element);
        return (
          <Route key={index} path={route.path} element={ParentElement}>
            {route.children.map((child, idx) => {
              const ChildElement =
                child.element && (typeof child.element === "function" ? <child.element /> : child.element);
              // Proteger hijos administrativos
              const isProtectedChild =
                child.path?.startsWith("admin") ||
                child.path?.startsWith("config") ||
                child.path?.startsWith("billing") ||
                child.path?.startsWith("data") ||
                child.path?.startsWith("profile") ||
                child.path?.startsWith("dashboard");
              return (
                <Route
                  key={idx}
                  index={child.index}
                  path={child.path}
                  element={isProtectedChild ? <PrivateRoute>{ChildElement}</PrivateRoute> : ChildElement}
                />
              );
            })}
          </Route>
        );
      }
      // Simple modern route
      if (route.path) {
        const Elem = route.element && typeof route.element === "function" ? <route.element /> : null;
        // Proteger solo si es admin/dashboard
        const isProtected =
          route.path.startsWith("admin") ||
          route.path.startsWith("config") ||
          route.path.startsWith("billing") ||
          route.path.startsWith("data") ||
          route.path.startsWith("profile") ||
          route.path.startsWith("dashboard");
        return <Route key={index} path={route.path} element={isProtected ? <PrivateRoute>{Elem}</PrivateRoute> : Elem} />;
      }
      return null;
    });

  // Removed floating settings button

  const commonRoutes = (
    <Routes>
      {getRoutes(routes)}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  if (direction === "rtl") {
    return (
      <CacheProvider value={rtlCache}>
        <ParallaxProvider>
          <ThemeProvider theme={themeRTL}>
            <CssBaseline />
            <ScrollToTop />
            {!isWidgetFrame && !isMobileChat && layout === "dashboard" && !isLandingRoute && miniSidenav !== null && (
              <>
                <Sidenav
                  color={sidenavColor}
                  brand={brand}
                  routes={routes.filter(
                    r =>
                      r.icon &&
                      (!r.permission || (user && user.permissions && user.permissions.includes(r.permission))) &&
                      !BOT_INTERNAL_ROUTES.includes(r.route)
                  )}
                  onMouseEnter={handleOnMouseEnter}
                  onMouseLeave={handleOnMouseLeave}
                />
                {/* <Configurator /> */}
              </>
            )}

            {!isWidgetFrame && layout === "vr" && <Configurator />}
            {commonRoutes}
          </ThemeProvider>
        </ParallaxProvider>
      </CacheProvider>
    );
  }

  return (
    <ParallaxProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ScrollToTop />
        {!isWidgetFrame && !isMobileChat && layout === "dashboard" && miniSidenav !== null && !isLandingRoute && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={brand}
              brandName="VOIA"
              routes={routes.filter(
                r =>
                  r.icon &&
                  (!r.permission || (user && user.permissions && user.permissions.includes(r.permission))) &&
                  !BOT_INTERNAL_ROUTES.includes(r.route)
              )}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            {/* <Configurator /> */}
          </>
        )}


        {!isWidgetFrame && layout === "vr" && <Configurator />}
        {commonRoutes}
      </ThemeProvider>
    </ParallaxProvider>
  );
}
