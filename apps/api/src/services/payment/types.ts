export interface PaymentInitiation {
  paymentRef: string;
  walletAddress: string;
  status: "pending";
}

export interface PaymentConfirmation {
  paymentRef: string;
  status: "completed" | "failed";
  confirmedAt: string;
}

export interface PaymentService {
  /** Simulates (or, in a future real implementation, performs) a wallet-connect + payment initiation step. */
  initiatePayment(input: { amount: number; currency: string; buyerId: string }): Promise<PaymentInitiation>;
  /** Simulates (or, in a future real implementation, performs) confirming a previously initiated payment. */
  confirmPayment(input: { paymentRef: string }): Promise<PaymentConfirmation>;
}
