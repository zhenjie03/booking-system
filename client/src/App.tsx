import { Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { AdminRoute } from "./components/AdminRoute";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminBookingsPage } from "./pages/admin/AdminBookingsPage";
import { AdminServicesPage } from "./pages/admin/AdminServicesPage";
import { AdminStaffDetailPage } from "./pages/admin/AdminStaffDetailPage";
import { AdminStaffPage } from "./pages/admin/AdminStaffPage";
import { BookingPage } from "./pages/BookingPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/book" replace />} />
        <Route path="/book" element={<BookingPage />} />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<Navigate to="/admin/bookings" replace />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="staff/:staffId" element={<AdminStaffDetailPage />} />
          <Route path="services" element={<AdminServicesPage />} />
        </Route>
      </Routes>
    </Layout>
  );
}
