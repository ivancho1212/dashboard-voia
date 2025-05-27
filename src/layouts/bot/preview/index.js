// dashboard-voia/src/layouts/bot/preview/index.js
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

function BotPreview({ templates, onSelectTemplate }) {
  return (
    <SoftBox>
      <SoftTypography variant="h5" fontWeight="bold" mb={3}>
        Selecciona el modelo que deseas usar de acuerdo a lo que necesitas
      </SoftTypography>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={template.id}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 3 }}>
              <div>
                <SoftTypography variant="h6" mb={1}>
                  {template.name}
                </SoftTypography>

                <SoftTypography variant="body2" color="text" mb={2} sx={{ minHeight: 48 }}>
                  {template.description}
                </SoftTypography>

                <SoftTypography variant="caption" color="text">
                  <strong>Proveedor de IA:</strong> {template.ia_provider_name}
                </SoftTypography>
                <br />
                <SoftTypography variant="caption" color="text">
                  <strong>Modelo:</strong> {template.default_model_name}
                </SoftTypography>
              </div>

              <SoftBox mt={3}>
                <SoftButton
                  variant="gradient"
                  color="info"
                  fullWidth
                  onClick={() => onSelectTemplate(template)}
                >
                  Usar este modelo
                </SoftButton>
              </SoftBox>
            </Card>
          </Grid>
        ))}
      </Grid>
    </SoftBox>
  );
}

BotPreview.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      ia_provider_name: PropTypes.string.isRequired,
      default_model_name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onSelectTemplate: PropTypes.func.isRequired,
};

export default BotPreview;
