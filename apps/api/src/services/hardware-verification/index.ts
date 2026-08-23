import { env } from "../../env.js";
import { MockHardwareVerificationService } from "./mock.js";
import type { HardwareVerificationService } from "./types.js";

export type { HardwareVerificationResult, HardwareVerificationService } from "./types.js";

export function createHardwareVerificationService(): HardwareVerificationService {
  if (env.HARDWARE_VERIFICATION_MODE === "real") {
    throw new Error("Real hardware verification is not implemented in the MVP.");
  }
  return new MockHardwareVerificationService();
}
