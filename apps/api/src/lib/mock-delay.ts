import { env } from "../env.js";

/**
 * Simulated latency for mock services, so the demo feels like real hardware/network calls.
 * Skipped in tests, where it would only slow the suite down.
 */
export function mockDelay(ms: number): Promise<void> {
  if (env.NODE_ENV === "test") return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}
