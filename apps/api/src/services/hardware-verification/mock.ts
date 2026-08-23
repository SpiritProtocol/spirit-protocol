import { generateChipId } from "../../lib/ids.js";
import type { HardwareVerificationResult, HardwareVerificationService } from "./types.js";

/**
 * Simulates a real NFC/anti-tamper chip scan (e.g. NTAG 424 DNA) with a
 * realistic result payload shape. Never fails the verification itself —
 * approval/rejection stays an explicit admin decision (see verifications service);
 * this only produces the "hardware evidence" attached to that decision.
 */
export class MockHardwareVerificationService implements HardwareVerificationService {
  async verify(input: { artworkId: string; spiritId: string }): Promise<HardwareVerificationResult> {
    await delay(400 + Math.random() * 600);

    const chipId = generateChipId();
    const tamperDetected = Math.random() < 0.03;

    return {
      chipId,
      tamperDetected,
      signatureValid: !tamperDetected,
      scannedAt: new Date().toISOString(),
      raw: {
        artworkId: input.artworkId,
        spiritId: input.spiritId,
        chipStandard: "NTAG424_DNA",
        scanMethod: "MOCK_NFC_TAP",
      },
    };
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
