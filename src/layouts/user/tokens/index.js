import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import TokensTable from "./components/TokensTable";

function TokensList() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Tokens Consumidos por Usuarios
        </SoftTypography>
        <TokensTable />
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default TokensList;
