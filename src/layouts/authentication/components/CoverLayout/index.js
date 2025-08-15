import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import PageLayout from "examples/LayoutContainers/PageLayout";

function CoverLayout({ bgColor, header, title, description, image, top, titleColor, children }) {
  return (
    // ✅ CAMBIO 1: El fondo del PageLayout ahora es transparente para permitir el bgColor del SoftBox
    <PageLayout background="transparent">
      <SoftBox
        width="100vw"
        height="100%"
        minHeight="100vh"
        sx={{
          backgroundColor: bgColor || "white", // ✅ CAMBIO 2: El color de fondo se aplica a este SoftBox
          overflowX: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Grid
          container
          justifyContent="center"
          sx={{
            minHeight: "75vh",
            margin: 0,
          }}
        >
          <Grid item xs={11} sm={8} md={5} xl={3}>
            <SoftBox mt={top}>
              <SoftBox pt={3} px={3}>
                {!header ? (
                  <>
                    <SoftBox mb={1}>
                      {/* ✅ CAMBIO 3: El color del título ahora es blanco por defecto */}
                      <SoftTypography variant="h3" fontWeight="bold" color={titleColor || "white"}>
                        {title}
                      </SoftTypography>
                    </SoftBox>
                    {/* ✅ CAMBIO 4: La descripción también es blanca */}
                    <SoftTypography variant="body2" fontWeight="regular" color="white">
                      {description}
                    </SoftTypography>
                  </>
                ) : (
                  header
                )}
              </SoftBox>
              {/* ✅ CAMBIO 5: Los textos del formulario también deben ser blancos */}
              <SoftBox p={3} sx={{ color: "white" }}>{children}</SoftBox>
            </SoftBox>
          </Grid>
          <Grid item xs={12} md={5}>
            <SoftBox
              height="100%"
              display={{ xs: "none", md: "block" }}
              position="relative"
              right={{ md: "-12rem", xl: "-16rem" }}
              mr={-16}
              sx={{
                transform: "skewX(-10deg)",
                overflow: "hidden",
                borderBottomLeftRadius: ({ borders: { borderRadius } }) => borderRadius.lg,
              }}
            >
              <SoftBox
                ml={-8}
                height="100%"
                sx={{
                  backgroundImage: `url(${image})`,
                  backgroundSize: "cover",
                  transform: "skewX(10deg)",
                }}
              />
            </SoftBox>
          </Grid>
        </Grid>
      </SoftBox>
    </PageLayout>
  );
}

CoverLayout.defaultProps = {
  header: "",
  title: "",
  description: "",
  color: "info",
  top: 20,
  // Ya no necesitamos bgColor y titleColor aquí, pero los mantendré por si acaso
  // En su lugar, el PageLayout es background="transparent" y el SoftBox tiene el bgColor
  bgColor: "#000",
  titleColor: "white",
};

CoverLayout.propTypes = {
  color: PropTypes.oneOf([
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
    "light",
  ]),
  header: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string.isRequired,
  top: PropTypes.number,
  bgColor: PropTypes.string,
  titleColor: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default CoverLayout;