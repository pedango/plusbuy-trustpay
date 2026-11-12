import { newId } from "@/lib/ids";
import type {
  ConfirmPaymentInput,
  ConfirmPaymentResult,
  InitiatePaymentInput,
  InitiatePaymentResult,
  MobileMoneyProvider,
} from "@/modules/trustpay/ports/mobile-money-provider";

/**
 * Demo MoMo provider.
 * - PIN `0000` → insufficient funds
 * - PIN `9999` → wrong PIN
 * - any other 4-digit PIN → APPROVED
 *
 * Stateless: `confirmPayment` only needs `providerRef` from initiate.
 */
export class SimulatedMomoProvider implements MobileMoneyProvider {
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    void input;
    return {
      providerRef: `sim_${newId("txn")}`,
      status: "PENDING",
    };
  }

  async confirmPayment(input: ConfirmPaymentInput): Promise<ConfirmPaymentResult> {
    void input.providerRef;
    if (input.pin === "0000") {
      return {
        status: "DECLINED",
        reason: "INSUFFICIENT_FUNDS",
        message: "Insufficient mobile money balance",
      };
    }
    if (input.pin === "9999") {
      return {
        status: "DECLINED",
        reason: "WRONG_PIN",
        message: "Incorrect PIN",
      };
    }
    return { status: "APPROVED" };
  }

  async sendPayout(): Promise<{ outcome: "PAID" | "FAILED"; reason?: string }> {
    return { outcome: "PAID" };
  }
}
