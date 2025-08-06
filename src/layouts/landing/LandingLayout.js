import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom"; // ⬅️ esto es clave

function LandingLayout() {
    return (
        <div>
            <Navbar isDarkBackground={true} />
            <Outlet />
            <Footer />
        </div>
    );
}

export default LandingLayout;
