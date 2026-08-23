import { useAuth } from "../context/AuthContext";

export function AppHeader() {
  const auth = useAuth();

  if (!auth.user) return null;

  return (
    <header className="mb-4 flex items-center justify-end">
      <span className="text-sm text-neutral-400">{auth.user.displayName}</span>
    </header>
  );
}
