import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import AppLayout from "./layouts/AppLayout";
import HomePage from "./pages/HomePage";
import MobileTicketsPage from "./pages/MobileTicketsPage";
import VMTicketsPage from "./pages/VMTicketsPage";
import EnvironmentTicketsPage from "./pages/EnvironmentTicketsPage";
import AdminPanelPage from "./pages/AdminPanelPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import RequireAuth from "./auth/RequireAuth";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify" element={<VerifyOtpPage />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="home" element={<HomePage />} />
        <Route path="mobile" element={<MobileTicketsPage />} />
        <Route path="vm" element={<VMTicketsPage />} />
        <Route path="environment" element={<EnvironmentTicketsPage />} />

        {/* ✅ Two admin pages */}
        <Route path="admin/tickets" element={<AdminPanelPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}