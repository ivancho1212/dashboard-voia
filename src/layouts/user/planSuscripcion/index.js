import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import PlanSuscriptionTable from "./components/PlanSuscriptionTable";

function PlanSuscriptionList() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Planes y Suscripciones de Usuarios
        </SoftTypography>
        <PlanSuscriptionTable />
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PlanSuscriptionList;
