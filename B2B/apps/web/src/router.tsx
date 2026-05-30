import { Navigate, createBrowserRouter } from "react-router-dom";

import { ProtectedLayout } from "./layouts/ProtectedLayout";
import { SidebarLayout } from "./layouts/SidebarLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { InventoryPage } from "./pages/InventoryPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { SellerDashboard } from "./pages/SellerDashboard";
import { BuyerDashboard } from "./pages/BuyerDashboard";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "onboarding", element: <OnboardingPage /> },
      { path: "product/:id", element: <ProductDetailsPage /> },
      { path: "cart", element: <CartPage /> },
      { path: "checkout", element: <CheckoutPage /> },
    ],
  },
  {
    path: "/seller",
    element: (
      <SidebarLayout>
        <ProtectedLayout />
      </SidebarLayout>
    ),
    children: [
      { index: true, element: <Navigate to="/seller/dashboard" replace /> },
      { path: "dashboard", element: <SellerDashboard /> },
      { path: "inventory", element: <InventoryPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "logistics", element: <Navigate to="/seller/dashboard" replace /> },
      { path: "analytics", element: <Navigate to="/seller/dashboard" replace /> },
      { path: "settings", element: <Navigate to="/seller/dashboard" replace /> },
    ],
  },
  {
    path: "/buyer",
    element: (
      <SidebarLayout>
        <ProtectedLayout />
      </SidebarLayout>
    ),
    children: [
      { index: true, element: <Navigate to="/buyer/dashboard" replace /> },
      { path: "dashboard", element: <BuyerDashboard /> },
      { path: "orders", element: <OrdersPage /> },
      {
        path: "saved-suppliers",
        element: <Navigate to="/buyer/dashboard" replace />,
      },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
