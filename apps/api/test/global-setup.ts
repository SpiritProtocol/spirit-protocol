import { execSync } from "node:child_process";
import { resolveTestDatabaseUrl } from "./test-db.js";

/** Applies all Prisma migrations to the test database once per test run (creates it if missing). */
export default function setup() {
  execSync("pnpm exec prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: resolveTestDatabaseUrl() },
  });
}
