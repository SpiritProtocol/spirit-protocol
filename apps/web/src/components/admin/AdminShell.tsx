import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm ${isActive ? "font-semibold text-black" : "text-neutral-400 hover:text-neutral-600"}`;

export function AdminShell({ children }: { children: ReactNode }) {
  const admin = useAdminAuth();

  return (
    <div className="mx-auto min-h-screen max-w-4xl bg-white p-4 pb-12 text-neutral-900">
      <header className="mb-4 flex items-center justify-between">
        <span className="text-[13px] font-semibold tracking-[0.2em] uppercase">Spirit Protocol Admin</span>
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>{admin.admin?.displayName}</span>
          <button type="button" onClick={admin.logout} className="hover:text-neutral-900">
            Log out
          </button>
        </div>
      </header>
      <nav className="mb-6 flex gap-4 border-b border-neutral-200 pb-3">
        <NavLink to="/admin" end className={tabClass}>
          Verification Queue
        </NavLink>
        <NavLink to="/admin/artworks" className={tabClass}>
          Artworks
        </NavLink>
        <NavLink to="/admin/transactions" className={tabClass}>
          Transactions
        </NavLink>
        <NavLink to="/admin/demo" className={tabClass}>
          Demo Data
        </NavLink>
      </nav>
      {children}
    </div>
  );
}
