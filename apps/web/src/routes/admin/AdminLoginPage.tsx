import { useState, type FormEvent } from "react";
import { useAdminAuth } from "../../context/AdminAuthContext";

export function AdminLoginPage() {
  const admin = useAdminAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await admin.login(username, password);
    } catch {
      // error is surfaced via admin.error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center bg-white p-4 text-neutral-900">
      <span className="mb-6 text-[13px] font-semibold tracking-[0.2em] uppercase">Spirit Protocol Admin</span>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="rounded-lg border border-neutral-200 px-3 py-2.5 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900"
        />
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-lg bg-black py-2.5 text-[13px] font-medium tracking-[0.05em] text-white active:opacity-80 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "[ Sign In ]"}
        </button>
        {admin.error && <p className="text-sm text-red-500">{admin.error}</p>}
      </form>
    </div>
  );
}
