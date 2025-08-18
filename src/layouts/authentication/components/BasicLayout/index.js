// prop-types is a library for typechecking of props
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

// @mui material components
import Grid from "@mui/material/Grid";

// Soft UI Dashboard React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard React examples
import PageLayout from "examples/LayoutContainers/PageLayout";

// Icono
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

function BasicLayout({ title, image, children }) {
  const navigate = useNavigate();

  return (
    <PageLayout>
      {/* Bloque con imagen ocupando la mitad de la pantalla */}
      <SoftBox
        width="calc(100% - 2rem)"
        height="50vh"
        borderRadius="lg"
        mx={2}
        my={2}
        pt={6}
        pb={2}
        sx={{
          position: "relative",
          overflow: "visible",
          backgroundImage: ({ functions: { linearGradient, rgba }, palette: { gradients } }) =>
            image &&
            `${linearGradient(
              rgba(gradients.dark.main, 0.6),
              rgba(gradients.dark.state, 0.6)
            )}, url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* 🔙 Flecha de retroceso arriba a la izquierda */}
        <SoftBox display="flex" alignItems="center" sx={{ position: "absolute", top: "1rem", left: "1rem" }}>
          <ArrowBackIcon
            onClick={() => navigate(-1)}
            sx={{ cursor: "pointer", color: "#fff" }}
            fontSize="large"
          />
        </SoftBox>

        {/* Título centrado */}
        <Grid container justifyContent="center" sx={{ textAlign: "center" }}>
          <Grid item xs={10} lg={6}>
            {title && (
              <SoftBox mt={1} mb={3}>
                <SoftTypography variant="h1" color="white" fontWeight="bold">
                  {title}
                </SoftTypography>
              </SoftBox>
            )}
          </Grid>
        </Grid>

        {/* Formulario o contenido */}
        <SoftBox
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: {
              xs: "calc(50vh - 110px)",
              sm: "calc(50vh - 120px)",
              md: "calc(50vh - 150px)",
            },
            width: { xs: "92%", sm: "75%", md: "40%", lg: "32%" },
            mb: { xs: 6, sm: 8, md: 10, lg: 12 },
          }}
        >
          {children}
        </SoftBox>
      </SoftBox>
    </PageLayout>
  );
}

// Valores por defecto
BasicLayout.defaultProps = {
  title: "",
};

// Validación de props
BasicLayout.propTypes = {
  title: PropTypes.string,
  image: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

export default BasicLayout;
