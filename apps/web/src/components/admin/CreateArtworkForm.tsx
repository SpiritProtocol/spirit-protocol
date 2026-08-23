import { useState, type ChangeEvent, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserDto } from "@spirit/shared";
import { apiClient, ApiError } from "../../lib/apiClient";

const emptyForm = {
  title: "",
  artist: "",
  year: "",
  medium: "",
  dimensions: "",
  description: "",
  value: "",
  imageUrl: "",
  ownerId: "",
};

export function CreateArtworkForm({ users }: { users: UserDto[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const set = (key: keyof typeof emptyForm) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const createMutation = useMutation({
    mutationFn: () =>
      apiClient.post("/artworks", {
        title: form.title,
        artist: form.artist,
        year: form.year ? Number(form.year) : undefined,
        medium: form.medium || undefined,
        dimensions: form.dimensions || undefined,
        description: form.description || undefined,
        value: Number(form.value),
        images: form.imageUrl ? [form.imageUrl] : [],
        ownerId: form.ownerId || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["artworks"] });
      setForm(emptyForm);
      setOpen(false);
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createMutation.mutate();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white"
      >
        + New Artwork
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-2 rounded-xl border border-neutral-200 p-4">
      <div className="grid grid-cols-2 gap-2">
        <input required placeholder="Title" value={form.title} onChange={set("title")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900" />
        <input required placeholder="Artist" value={form.artist} onChange={set("artist")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900" />
        <input placeholder="Year" type="number" value={form.year} onChange={set("year")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900" />
        <input required placeholder="Value (USD)" type="number" min={0} value={form.value} onChange={set("value")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900" />
        <input placeholder="Medium" value={form.medium} onChange={set("medium")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900" />
        <input placeholder="Dimensions" value={form.dimensions} onChange={set("dimensions")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900" />
      </div>
      <input placeholder="Image URL" value={form.imageUrl} onChange={set("imageUrl")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900" />
      <textarea placeholder="Description" rows={2} value={form.description} onChange={set("description")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-900" />
      <select value={form.ownerId} onChange={set("ownerId")} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none">
        <option value="">No owner</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.displayName}
          </option>
        ))}
      </select>
      <div className="mt-1 flex gap-2">
        <button type="submit" disabled={createMutation.isPending} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {createMutation.isPending ? "Creating…" : "Create"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm hover:bg-neutral-50">
          Cancel
        </button>
      </div>
      {createMutation.error && (
        <p className="text-xs text-red-500">
          {createMutation.error instanceof ApiError ? createMutation.error.message : "Something went wrong"}
        </p>
      )}
    </form>
  );
}
