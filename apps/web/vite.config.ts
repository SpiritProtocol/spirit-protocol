import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Quick tunnels (trycloudflare.com) get a random hostname each run, so we can't
    // pin it here; this is a dev-only server, not something exposed in production.
    allowedHosts: true,
  },
});
