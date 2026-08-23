export interface HardwareVerificationResult {
  chipId: string;
  tamperDetected: boolean;
  signatureValid: boolean;
  scannedAt: string;
  raw: Record<string, unknown>;
}

export interface HardwareVerificationService {
  /** Simulates (or, in a future real implementation, performs) an NFC/anti-tamper chip scan for an artwork. */
  verify(input: { artworkId: string; spiritId: string }): Promise<HardwareVerificationResult>;
}
