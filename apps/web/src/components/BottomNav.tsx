import { NavLink } from "react-router-dom";
import { Shield, ShoppingBag, CreditCard, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TABS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/", label: "Vault", icon: Shield, end: true },
  { to: "/store", label: "Store", icon: ShoppingBag },
  { to: "/wallet", label: "Wallet", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-stretch">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className="flex flex-1 flex-col items-center justify-center gap-1 py-2.5"
          >
            {({ isActive }) => (
              <>
                <tab.icon
                  size={20}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={isActive ? "text-black" : "text-neutral-300"}
                />
                <span
                  className={`text-[10px] tracking-[0.05em] ${
                    isActive ? "font-semibold text-black" : "font-medium text-neutral-300"
                  }`}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="h-1.5" />
    </nav>
  );
}
