import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import BotsTable from "./components/BotsTable"; // Asegúrate que la ruta sea correcta

function BotsAssociated() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Bots Asociados a Usuarios
        </SoftTypography>
        <BotsTable />
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotsAssociated;
