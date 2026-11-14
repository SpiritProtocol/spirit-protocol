/**
 * Integration tests run against a real Postgres database whose name must end in `_test`,
 * because every test file truncates all tables. Set TEST_DATABASE_URL to override the
 * default, which matches the Postgres from the root docker-compose.yml.
 */
export const DEFAULT_TEST_DATABASE_URL = "postgresql://spirit:spirit@localhost:5433/spirit_test";

export function resolveTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL ?? DEFAULT_TEST_DATABASE_URL;
  const dbName = new URL(url).pathname.replace(/^\//, "");
  if (!dbName.endsWith("_test")) {
    throw new Error(
      `Refusing to run tests against database "${dbName}": its name must end in "_test" because tests wipe all data.`,
    );
  }
  return url;
}
