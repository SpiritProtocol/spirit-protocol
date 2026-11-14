import { resolveTestDatabaseUrl } from "./test-db.js";

// Runs before each test file imports the app, so `src/env.ts` parses these values.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = resolveTestDatabaseUrl();
process.env.TELEGRAM_AUTH_MODE = "dev";
delete process.env.TELEGRAM_BOT_TOKEN;
process.env.JWT_SECRET = "test-only-secret-at-least-16-chars";
process.env.BLOCKCHAIN_MODE = "mock";
process.env.PAYMENT_MODE = "mock";
process.env.HARDWARE_VERIFICATION_MODE = "mock";
