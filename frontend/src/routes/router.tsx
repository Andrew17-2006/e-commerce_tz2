import { createBrowserRouter } from "react-router-dom";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { AdminRoute } from "./AdminRoute";
import { CatalogPage } from "@/pages/customer/CatalogPage";
import { ProductPage } from "@/pages/customer/ProductPage";
import { CartPage } from "@/pages/customer/CartPage";
import { CheckoutPage } from "@/pages/customer/CheckoutPage";
import { SuccessPage } from "@/pages/customer/SuccessPage";
import { AuthPage } from "@/pages/customer/AuthPage";
import { ProfilePage } from "@/pages/customer/ProfilePage";
import { AdminDashboardPage } from "@/pages/admin/AdminDashboardPage";
import { AdminProductsPage } from "@/pages/admin/AdminProductsPage";
import { AdminCategoriesPage } from "@/pages/admin/AdminCategoriesPage";
import { AdminOrdersPage } from "@/pages/admin/AdminOrdersPage";

export const router = createBrowserRouter([
  {
    element: <CustomerLayout />,
    children: [
      { path: "/", element: <CatalogPage /> },
      { path: "/products/:id", element: <ProductPage /> },
      { path: "/cart", element: <CartPage /> },
      { path: "/auth", element: <AuthPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "/checkout", element: <CheckoutPage /> },
          { path: "/checkout/success", element: <SuccessPage /> },
          { path: "/profile", element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: "products", element: <AdminProductsPage /> },
          { path: "categories", element: <AdminCategoriesPage /> },
          { path: "orders", element: <AdminOrdersPage /> },
        ],
      },
    ],
  },
]);
