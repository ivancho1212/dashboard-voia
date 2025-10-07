
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";

const authRoutes = [
  {
    key: "sign-in",
    route: "/authentication/sign-in",
    component: SignIn,
  },
  {
    key: "sign-up",
    route: "/authentication/sign-up",
    component: SignUp,
  },
];

export default authRoutes;
