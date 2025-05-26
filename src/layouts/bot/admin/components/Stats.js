import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import Card from "@mui/material/Card";

function Stats() {
  return (
    <Card>
      <SoftBox p={2}>
        <SoftTypography variant="h6">Estadísticas</SoftTypography>
        <SoftTypography variant="body2" color="text">
          Total de bots: 3
        </SoftTypography>
      </SoftBox>
    </Card>
  );
}

export default Stats;
