import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  MobileMoneyProvider,
} from "@/modules/trustpay/ports/mobile-money-provider";

/**
 * Production MTN MoMo Collection adapter (not wired).
 *
 * TODO: OAuth2 token against MoMo Open API
 * TODO: POST /collection/v1_0/requesttopay
 * TODO: poll /collection/v1_0/requesttopay/{referenceId} or consume callback
 * TODO: map provider statuses to APPROVED / DECLINED
 */
export class RealMtnMomoProvider implements MobileMoneyProvider {
  async initiatePayment(_input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    void _input;
    throw new Error("Not wired");
  }

  async confirmPayment(_input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    void _input;
    throw new Error("Not wired");
  }

  async sendPayout(): Promise<{ outcome: "PAID" | "FAILED"; reason?: string }> {
    // TODO: POST /disbursement/v1_0/transfer
    throw new Error("Not wired");
  }
}
