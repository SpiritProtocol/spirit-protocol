import { Route, Routes } from "react-router-dom";
import { CatalogPage } from "./routes/CatalogPage";
import { ArtworkDetailPage } from "./routes/ArtworkDetailPage";
import { CollectionPage } from "./routes/CollectionPage";
import { WalletPage } from "./routes/WalletPage";
import { ProfilePage } from "./routes/ProfilePage";
import { AdminRoutes } from "./routes/admin/AdminRoutes";
import { AuthProvider } from "./context/AuthContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import { BottomNav } from "./components/BottomNav";

function CollectorApp() {
  return (
    <AuthProvider>
      <div className="mx-auto max-w-lg pb-20">
        <Routes>
          <Route path="/" element={<CollectionPage />} />
          <Route path="/store" element={<CatalogPage />} />
          <Route path="/artworks/:id" element={<ArtworkDetailPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </div>
      <BottomNav />
    </AuthProvider>
  );
}

export function App() {
  return (
    <Routes>
      <Route
        path="/admin/*"
        element={
          <AdminAuthProvider>
            <AdminRoutes />
          </AdminAuthProvider>
        }
      />
      <Route path="/*" element={<CollectorApp />} />
    </Routes>
  );
}
