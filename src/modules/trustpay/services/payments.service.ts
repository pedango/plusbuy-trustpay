import type { Prisma, TpPayment } from "@prisma/client";
import type { CreatePaymentRequest, CreatePaymentResponse, Payment, TpNetwork } from "@/contracts/trustpay";
import { newCheckoutToken, newId } from "@/lib/ids";
import { assertAmountInRange, MAX_AMOUNT_MINOR, MIN_AMOUNT_MINOR } from "@/lib/money";
import type { TrustPayContext } from "@/modules/trustpay/context";
import { TrustPayError } from "@/modules/trustpay/domain/errors";
import { normalizeGhanaPhone } from "@/modules/trustpay/domain/phone";
import { transition } from "@/modules/trustpay/services/escrow.service";
import { toPaymentDto } from "@/modules/trustpay/services/mappers";

const CHECKOUT_TTL_MS = 30 * 60 * 1000;

function checkoutUrl(ctx: TrustPayContext, token: string): string {
  return `${ctx.env.APP_URL}/trustpay/checkout/${token}`;
}

export async function createPayment(
  ctx: TrustPayContext,
  merchantId: string,
  input: CreatePaymentRequest,
  tx?: Prisma.TransactionClient,
): Promise<CreatePaymentResponse> {
  try {
    assertAmountInRange(input.amountMinor);
  } catch {
    throw new TrustPayError(
      "amount_out_of_range",
      `Amount must be between ${MIN_AMOUNT_MINOR} and ${MAX_AMOUNT_MINOR} pesewas`,
      { amountMinor: input.amountMinor },
    );
  }

  const db = tx ?? ctx.db;
  const merchant = await db.tpMerchant.findUnique({ where: { id: merchantId } });
  if (!merchant) {
    throw new TrustPayError("not_found", "Merchant not found", { merchantId });
  }

  const now = await ctx.now();
  const id = newId("pay");
  const checkoutToken = newCheckoutToken();
  const expiresAt = new Date(now.getTime() + CHECKOUT_TTL_MS);

  try {
    await db.tpPayment.create({
      data: {
        id,
        merchantId,
        reference: input.reference,
        description: input.description ?? null,
        amountMinor: input.amountMinor,
        currency: "GHS",
        status: "INITIATED",
        checkoutToken,
        returnUrl: input.returnUrl,
        expiresAt,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      throw new TrustPayError(
        "validation_error",
        "Payment reference already exists for this merchant",
        { reference: input.reference },
      );
    }
    throw error;
  }

  return {
    id,
    status: "INITIATED",
    checkoutUrl: checkoutUrl(ctx, checkoutToken),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getPayment(
  ctx: TrustPayContext,
  paymentId: string,
  merchantId?: string,
): Promise<Payment> {
  const payment = await ctx.db.tpPayment.findUnique({ where: { id: paymentId } });
  if (!payment || (merchantId && payment.merchantId !== merchantId)) {
    throw new TrustPayError("not_found", "Payment not found", { paymentId });
  }
  return toPaymentDto(payment);
}

export async function getPaymentByCheckoutToken(
  ctx: TrustPayContext,
  checkoutToken: string,
): Promise<TpPayment> {
  const payment = await ctx.db.tpPayment.findUnique({ where: { checkoutToken } });
  if (!payment) {
    throw new TrustPayError("not_found", "Checkout session not found");
  }
  return payment;
}

async function assertNotExpired(ctx: TrustPayContext, payment: TpPayment): Promise<Date> {
  const now = await ctx.now();
  if (now.getTime() >= payment.expiresAt.getTime()) {
    if (payment.status === "INITIATED" || payment.status === "AWAITING_APPROVAL") {
      try {
        await transition(payment.id, "EXPIRY_ELAPSED", ctx);
      } catch (error) {
        if (!(error instanceof TrustPayError) || error.code !== "invalid_transition") {
          throw error;
        }
      }
    }
    throw new TrustPayError("payment_expired", "Checkout has expired", {
      paymentId: payment.id,
    });
  }
  return now;
}

export async function startCheckout(
  ctx: TrustPayContext,
  checkoutToken: string,
  input: { network: TpNetwork; phone: string },
): Promise<Payment> {
  const payment = await getPaymentByCheckoutToken(ctx, checkoutToken);
  await assertNotExpired(ctx, payment);

  let e164: string;
  try {
    e164 = normalizeGhanaPhone(input.phone).e164;
  } catch {
    throw new TrustPayError("invalid_phone", "Invalid Ghana phone number", {
      phone: input.phone,
    });
  }

  const initiated = await ctx.provider.initiatePayment({
    amountMinor: payment.amountMinor,
    currency: "GHS",
    phone: e164,
    network: input.network,
    reference: payment.reference,
    description: payment.description,
  });

  await ctx.db.tpPayment.update({
    where: { id: payment.id },
    data: {
      network: input.network,
      payerPhone: e164,
      providerRef: initiated.providerRef,
    },
  });

  const updated = await transition(payment.id, "CHECKOUT_STARTED", ctx);
  return toPaymentDto(updated);
}

export async function approveCheckout(
  ctx: TrustPayContext,
  checkoutToken: string,
  pin: string,
): Promise<Payment> {
  const payment = await getPaymentByCheckoutToken(ctx, checkoutToken);
  await assertNotExpired(ctx, payment);

  if (payment.status !== "AWAITING_APPROVAL") {
    throw new TrustPayError(
      "invalid_transition",
      `Cannot approve payment in status ${payment.status}`,
      { status: payment.status },
    );
  }

  if (!payment.providerRef) {
    throw new TrustPayError("validation_error", "Checkout has not been started");
  }

  const result = await ctx.provider.confirmPayment({
    providerRef: payment.providerRef,
    pin,
  });

  if (result.status === "APPROVED") {
    const updated = await transition(payment.id, "APPROVED", ctx);
    return toPaymentDto(updated);
  }

  const updated = await transition(payment.id, "DECLINED", ctx, {
    failureReason: result.message,
  });
  return toPaymentDto(updated);
}

export async function cancelCheckout(
  ctx: TrustPayContext,
  checkoutToken: string,
): Promise<Payment> {
  const payment = await getPaymentByCheckoutToken(ctx, checkoutToken);

  if (payment.status !== "INITIATED" && payment.status !== "AWAITING_APPROVAL") {
    throw new TrustPayError(
      "invalid_transition",
      `Cannot cancel payment in status ${payment.status}`,
      { status: payment.status },
    );
  }

  const updated = await transition(payment.id, "DECLINED", ctx, {
    failureReason: "Checkout cancelled",
  });
  return toPaymentDto(updated);
}

export async function recordShipment(
  ctx: TrustPayContext,
  paymentId: string,
  merchantId: string,
  tx?: Prisma.TransactionClient,
): Promise<Payment> {
  const db = tx ?? ctx.db;
  const payment = await db.tpPayment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.merchantId !== merchantId) {
    throw new TrustPayError("not_found", "Payment not found", { paymentId });
  }

  if (payment.status !== "HELD") {
    throw new TrustPayError(
      "invalid_transition",
      "Shipment can only be recorded while payment is HELD",
      { status: payment.status },
    );
  }

  if (payment.shippedAt) {
    return toPaymentDto(payment);
  }

  const now = await ctx.now();
  const autoReleaseAt = new Date(
    now.getTime() + ctx.env.AUTO_RELEASE_DAYS * 24 * 60 * 60 * 1000,
  );

  const updated = await db.tpPayment.updateMany({
    where: { id: paymentId, version: payment.version, status: "HELD" },
    data: {
      shippedAt: now,
      autoReleaseAt,
      version: { increment: 1 },
    },
  });
  if (updated.count === 0) {
    throw new TrustPayError("conflict_retry", "Payment was updated concurrently", { paymentId });
  }

  return toPaymentDto(await db.tpPayment.findUniqueOrThrow({ where: { id: paymentId } }));
}

export async function releasePayment(
  ctx: TrustPayContext,
  paymentId: string,
  merchantId: string,
  tx?: Prisma.TransactionClient,
): Promise<Payment> {
  const db = tx ?? ctx.db;
  const payment = await db.tpPayment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.merchantId !== merchantId) {
    throw new TrustPayError("not_found", "Payment not found", { paymentId });
  }
  if (payment.status === "RELEASED") return toPaymentDto(payment);
  const updated = await transition(paymentId, "RELEASE_REQUESTED", ctx, undefined, tx);
  return toPaymentDto(updated);
}

export async function refundPayment(
  ctx: TrustPayContext,
  paymentId: string,
  merchantId: string,
  tx?: Prisma.TransactionClient,
): Promise<Payment> {
  const db = tx ?? ctx.db;
  const payment = await db.tpPayment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.merchantId !== merchantId) {
    throw new TrustPayError("not_found", "Payment not found", { paymentId });
  }
  if (payment.status === "REFUNDED") return toPaymentDto(payment);
  const updated = await transition(paymentId, "REFUND_REQUESTED", ctx, undefined, tx);
  return toPaymentDto(updated);
}
