import { env } from "../../env.js";
import { MockPaymentService } from "./mock.js";
import type { PaymentService } from "./types.js";

export type { PaymentConfirmation, PaymentInitiation, PaymentService } from "./types.js";

export function createPaymentService(): PaymentService {
  if (env.PAYMENT_MODE === "real") {
    throw new Error("Real payment processing is not implemented in the MVP.");
  }
  return new MockPaymentService();
}
