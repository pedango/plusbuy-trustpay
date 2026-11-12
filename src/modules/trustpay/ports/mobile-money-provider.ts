import type { TpNetwork } from "@/contracts/trustpay";

export type InitiatePaymentInput = {
  amountMinor: number;
  currency: "GHS";
  phone: string;
  network: TpNetwork;
  reference: string;
  description?: string | null;
};

export type InitiatePaymentResult = {
  providerRef: string;
  status: "PENDING";
};

export type ConfirmPaymentInput = {
  providerRef: string;
  pin: string;
};

export type ConfirmPaymentResult =
  | { status: "APPROVED" }
  | {
      status: "DECLINED";
      reason: "INSUFFICIENT_FUNDS" | "WRONG_PIN" | "OTHER";
      message: string;
    };

/**
 * Port for MoMo / telecom collection. Adapters must not leak into domain services
 * beyond this interface.
 */
export type SendPayoutInput = {
  network: TpNetwork;
  phone: string;
  amountMinor: number;
};

export type SendPayoutResult = { outcome: "PAID" | "FAILED"; reason?: string };

export interface MobileMoneyProvider {
  initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
  confirmPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult>;
  sendPayout(input: SendPayoutInput): Promise<SendPayoutResult>;
}
