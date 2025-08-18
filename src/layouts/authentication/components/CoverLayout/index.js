import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import PageLayout from "examples/LayoutContainers/PageLayout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom"; // 👈 importar navigate

function CoverLayout({ bgColor, header, title, description, image, top, titleColor, children }) {
  const navigate = useNavigate(); // 👈 inicializar navigate

  return (
    <PageLayout background="transparent">
      <SoftBox
        width="100vw"
        height="100%"
        minHeight="100vh"
        sx={{
          backgroundColor: bgColor || "white",
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
              {/* 🔙 Botón de retroceso arriba a la izquierda */}
              <SoftBox display="flex" alignItems="center" mb={2}>
                <ArrowBackIcon
                  onClick={() => navigate(-1)}
                  sx={{ cursor: "pointer", color: "#fff" }}
                  fontSize="large" // small | medium | large | inherit
                />
              </SoftBox>

              <SoftBox pt={3} px={3}>
                {!header ? (
                  <>
                    <SoftBox mb={1}>
                      <SoftTypography variant="h3" fontWeight="bold" color={titleColor || "white"}>
                        {title}
                      </SoftTypography>
                    </SoftBox>
                    <SoftTypography variant="body2" fontWeight="regular" color="white">
                      {description}
                    </SoftTypography>
                  </>
                ) : (
                  header
                )}
              </SoftBox>

              <SoftBox p={3} sx={{ color: "white" }}>
                {children}
              </SoftBox>
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
