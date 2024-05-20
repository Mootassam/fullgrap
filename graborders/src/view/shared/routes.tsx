import Permissions from "src/security/permissions";
const permissions = Permissions.values;

const privateRoutes = [
  {
    path: "/",
    loader: () => import("src/view/pages/Markets/Market"),
    permissionRequired: permissions.userRead,
    exact: true,
  },
  {
    path: "/Order",
    loader: () => import("src/view/pages/Order/Order"),
    exact: true,
  },
  {
    path: "/search",
    loader: () => import("src/view/pages/Search/Search"),
    exact: true,
  },
  {
    path: "/grap",
    loader: () => import("src/view/pages/Grap/GrapPage"),
    exact: true,
  },

  {
    path: "/Online",
    loader: () => import("src/view/pages/Online/Online"),
    exact: true,
  },
  {
    path: "/profile",
    loader: () => import("src/view/pages/Auth/Profile"),
    exact: true,
  },
];

const screenRoutes = [
  {
    path: "/currency",
    loader: () => import("src/view/pages/Currency/CurrecnyPage"),
  },
  {
    path: "/invitation",
    loader: () => import("src/view/pages/Invitation/Invitation"),
    exact: true,
  },
  {
    path: "/company",
    loader: () => import("src/view/pages/Company/Company"),
    exact: true,
  },
  {
    path: "/faqs",
    loader: () => import("src/view/pages/Faqs/Faqs"),
    exact: true,
  },
  {
    path: "/tc",
    loader: () => import("src/view/pages/T&C/Tc"),
    exact: true,
  },

  {
    path: "/Certificate",
    loader: () => import("src/view/pages/Certificate/Certificate"),
    exact: true,
  },

  {
    path: "/tasks",
    loader: () => import("src/view/pages/Tasks/Tasks"),
    exact: true,
  },
  {
    path: "/myprofile",
    loader: () => import("src/view/pages/Team/Team"),
    exact: true,
  },
  {
    path: "/withdraw",
    loader: () => import("src/view/pages/withdraw/Withdraw"),
    exact: true,
  },
  {
    path: "/security",
    loader: () => import("src/view/pages/Auth/ChangePassword"),
    exact: true,
  },
  {
    path: "/transacation",
    loader: () => import("src/view/pages/Transactions/Transaction"),
    exact: true,
  },
  {
    path: "/wallet",
    loader: () => import("src/view/pages/wallet/Wallet"),
    exact: true,
  },
];
const publicRoutes = [
  {
    path: "/auth/signin",
    loader: () => import("src/view/pages/Auth/Signin"),
  },
  {
    path: "/auth/signup",
    loader: () => import("src/view/pages/Auth/Signup"),
  },
];
const simpleRoutes = [
  {
    path: "/403",
    loader: () => import("src/view/shared/errors/Error403Page"),
  },
  {
    path: "/500",
    loader: () => import("src/view/shared/errors/Error500Page"),
  },
  {
    path: "**",
    loader: () => import("src/view/shared/errors/Error404Page"),
  },
].filter(Boolean);

const emptyPermissionsRoutes = [
  {
    path: "/auth/empty-permissions",
    loader: () => import("src/view/pages/Auth/EmptyPermissionsPage"),
  },
].filter(Boolean);
export default {
  privateRoutes,
  publicRoutes,
  simpleRoutes,
  screenRoutes,
  emptyPermissionsRoutes,
};
