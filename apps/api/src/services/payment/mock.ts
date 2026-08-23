import type { PaymentConfirmation, PaymentInitiation, PaymentService } from "./types.js";

function hex(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

/**
 * Simulates the wallet-connect + confirm-payment steps of a purchase.
 * Always succeeds — this is a demo of the intended UX, not a payment
 * reliability test — so the golden path is never blocked by a random failure.
 */
export class MockPaymentService implements PaymentService {
  async initiatePayment(input: { amount: number; currency: string; buyerId: string }): Promise<PaymentInitiation> {
    await delay(300 + Math.random() * 400);
    return {
      paymentRef: `PAY-${hex(12)}`,
      walletAddress: `UQ${hex(46)}`,
      status: "pending",
    };
  }

  async confirmPayment(input: { paymentRef: string }): Promise<PaymentConfirmation> {
    await delay(500 + Math.random() * 700);
    return {
      paymentRef: input.paymentRef,
      status: "completed",
      confirmedAt: new Date().toISOString(),
    };
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
