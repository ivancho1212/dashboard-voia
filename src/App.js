import { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

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
import routes from "routes/index";

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

  // Detectar rutas landing
  const isLandingRoute =
    pathname === "/" ||
    pathname === "/via" ||
    pathname.startsWith("/pregunta") ||
    pathname.startsWith("/servicio") ||
    pathname === "/authentication/sign-in" ||
    pathname === "/authentication/sign-up";

  // Layout según la ruta
  useEffect(() => {
    if (isLandingRoute) {
      setLayout(dispatch, "landing");
      setMiniSidenav(dispatch, true);
    } else {
      setLayout(dispatch, "dashboard");
    }
  }, [pathname, dispatch, isLandingRoute]);

  // Cache RTL
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

  // Dir attribute
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // NUEVO: Soporte rutas estilo Soft UI y estilo moderno
  const getRoutes = (allRoutes) =>
    allRoutes.flatMap((route, index) => {
      // Si tiene colapsables
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      // Formato Soft UI Dashboard
      if (route.route && route.component) {
        return (
          <Route
            exact
            path={route.route}
            element={route.component}
            key={route.key || index}
          />
        );
      }

      // Formato moderno con children
      if (route.children) {
        return (
          <Route key={index} path={route.path} element={route.element}>
            {route.children.map((child, idx) => (
              <Route
                key={idx}
                index={child.index}
                path={child.path}
                element={child.element}
              />
            ))}
          </Route>
        );
      }

      // Ruta simple moderna
      if (route.path && route.element) {
        return (
          <Route
            key={index}
            path={route.path}
            element={route.element}
          />
        );
      }

      return null;
    });

  const configsButton = (
    <SoftBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.5rem"
      height="3.5rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="default" color="inherit">
        settings
      </Icon>
    </SoftBox>
  );

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
            {!isWidgetFrame && layout === "dashboard" && (
              <>
                <Sidenav
                  color={sidenavColor}
                  brand={brand}
                  routes={routes}
                  onMouseEnter={handleOnMouseEnter}
                  onMouseLeave={handleOnMouseLeave}
                />
                <Configurator />
                {configsButton}
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
        {!isWidgetFrame && layout === "dashboard" && (
          <>
            <Sidenav
              color={sidenavColor}
              brand={brand}
              routes={routes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
            />
            <Configurator />
            {configsButton}
          </>
        )}
        {!isWidgetFrame && layout === "vr" && <Configurator />}
        {commonRoutes}
      </ThemeProvider>
    </ParallaxProvider>
  );
}
