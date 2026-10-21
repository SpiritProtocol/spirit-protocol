import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    // Named entries keep the output flat: dist/server.js, dist/seed.js
    server: "src/server.ts",
    seed: "prisma/seed.ts",
  },
  outDir: "dist",
  format: ["esm"],
  platform: "node",
  target: "node20",
  clean: true,
  sourcemap: true,
  // Inline the workspace package. It ships only TS source (`main: ./src/index.ts`),
  // so without this the runtime would try to `import` a `.ts` file through the
  // pnpm workspace symlink and fail. Everything else (fastify, @prisma/client,
  // bcryptjs, zod, …) stays external and is installed as normal node_modules
  // in the runtime image.
  noExternal: ["@spirit/shared"],
});
