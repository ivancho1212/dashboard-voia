import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import UsersTable from "./components/UsersTable"; // esta ruta es correcta
import UserBotsSection from "./components/UserBotsSection";

function UserProfileList() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftTypography variant="h4" fontWeight="bold" mb={2}>
          Usuarios Registrados
        </SoftTypography>
        <UsersTable />

        {/* Sección de bots del usuario */}
        <UserBotsSection />
      </SoftBox>

      <Footer />
    </DashboardLayout>
  );
}

export default UserProfileList;
