// dashboard-voia\src\App.js
import { useState, useEffect, useMemo } from "react";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";

// Soft UI Dashboard React examples
import Sidenav from "examples/Sidenav";
import Configurator from "examples/Configurator";

// Soft UI Dashboard React themes
import theme from "assets/theme";
import themeRTL from "assets/theme/theme-rtl";

// RTL plugins
import rtlPlugin from "stylis-plugin-rtl";
import { CacheProvider } from "@emotion/react";
import createCache from "@emotion/cache";

// Rutas consolidadas desde src/routes/index.js
import routes from "routes/index";

// Soft UI Dashboard React contexts
import {
  useSoftUIController,
  setMiniSidenav,
  setOpenConfigurator,
  setLayout,
} from "context";

// ParallaxProvider para react-scroll-parallax
import { ParallaxProvider } from "react-scroll-parallax";

// Importa tu componente ScrollToTop
import ScrollToTop from "components/ScrollToTop";

// Images

// ...

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, direction, layout, openConfigurator, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const [rtlCache, setRtlCache] = useState(null);
  const { pathname } = useLocation();
  const isWidgetFrame = pathname === "/widget-frame";

  // Detectar rutas landing (sin sidebar)
  const isLandingRoute =
    pathname === "/" ||
    pathname === "/via" ||
    pathname.startsWith("/pregunta") ||
    pathname.startsWith("/servicio"); 


  // Establecer layout según la ruta
  useEffect(() => {
    if (isLandingRoute) {
      setLayout(dispatch, "landing");
      setMiniSidenav(dispatch, true);
    } else {
      setLayout(dispatch, "dashboard");
    }
  }, [pathname, dispatch, isLandingRoute]);

  // Cache for the rtl
  useMemo(() => {
    const cacheRtl = createCache({
      key: "rtl",
      stylisPlugins: [rtlPlugin],
    });

    setRtlCache(cacheRtl);
  }, []);

  const brand = "/via-negativo.png";

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // ** REMOVIDO EL USEEFFECT QUE HACÍA SCROLL AL CAMBIAR RUTA **
  // useEffect(() => {
  //   document.documentElement.scrollTop = 0;
  //   document.scrollingElement.scrollTop = 0;
  // }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route, index) => {
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

      return (
        <Route
          key={index}
          path={route.path}
          element={route.element}
        />
      );
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
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );

  if (direction === "rtl") {
    return (
      <CacheProvider value={rtlCache}>
        <ParallaxProvider>
          <ThemeProvider theme={themeRTL}>
            <CssBaseline />
            <ScrollToTop /> {/* Aquí agregas ScrollToTop */}
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
        <ScrollToTop /> {/* Aquí agregas ScrollToTop */}
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
