// src/layouts/bot/admin/index.js

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import BotCreate from "./create"; 

function BotAdminDashboard() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3} px={2}>
        <SoftTypography variant="h4" fontWeight="bold" mb={3}>
          Panel de Administración de Bots
        </SoftTypography>
        <BotCreate />

        {/* Aquí puedes renderizar componentes específicos del admin */}
        {/* Por ejemplo: */}
        {/* <AdminBotList /> */}
        {/* <BotStatistics /> */}
        {/* <BotCreate /> */}
      </SoftBox>
      <Footer />
    </DashboardLayout>
  );
}

export default BotAdminDashboard;