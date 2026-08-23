import { Navigate, Route, Routes } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { AdminLoginPage } from "./AdminLoginPage";
import { VerificationQueuePage } from "./VerificationQueuePage";
import { AdminArtworksPage } from "./AdminArtworksPage";
import { AdminTransactionsPage } from "./AdminTransactionsPage";
import { AdminDemoPage } from "./AdminDemoPage";

export function AdminRoutes() {
  const admin = useAdminAuth();

  if (admin.status === "checking") {
    return (
      <div className="min-h-screen bg-white p-6 text-center text-neutral-400">Loading…</div>
    );
  }

  if (admin.status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-white text-neutral-900">
        <Routes>
          <Route path="login" element={<AdminLoginPage />} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Routes>
        <Route path="login" element={<Navigate to="/admin" replace />} />
        <Route index element={<VerificationQueuePage />} />
        <Route path="artworks" element={<AdminArtworksPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
        <Route path="demo" element={<AdminDemoPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
}
