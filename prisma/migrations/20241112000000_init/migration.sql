-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BUYER', 'MERCHANT', 'TRUSTPAY_ADMIN');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID_IN_ESCROW', 'SHIPPED', 'COMPLETED', 'DISPUTED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TpPaymentStatus" AS ENUM ('INITIATED', 'AWAITING_APPROVAL', 'HELD', 'DISPUTED', 'RELEASED', 'REFUNDED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TpNetwork" AS ENUM ('MTN_MOMO', 'TELECEL_CASH', 'AIRTELTIGO_MONEY');

-- CreateEnum
CREATE TYPE "TpAccount" AS ENUM ('BUYER_WALLET', 'ESCROW', 'MERCHANT_AVAILABLE', 'TRUSTPAY_REVENUE', 'MERCHANT_WITHDRAWN', 'BUYER_REFUNDED');

-- CreateEnum
CREATE TYPE "TpTxnType" AS ENUM ('HOLD', 'RELEASE', 'REFUND', 'WITHDRAWAL');

-- CreateEnum
CREATE TYPE "TpPayoutStatus" AS ENUM ('PROCESSING', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "TpDisputeStatus" AS ENUM ('OPEN', 'RESOLVED_REFUND', 'RESOLVED_RELEASE');

-- CreateEnum
CREATE TYPE "TpWebhookStatus" AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#CBD5E1',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "totalMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "paymentId" TEXT,
    "checkoutUrl" TEXT,
    "deliveryNote" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,
    "shippedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "nameSnapshot" TEXT NOT NULL,
    "unitPriceMinor" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedWebhook" (
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedWebhook_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "OrderSequence" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nextVal" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "OrderSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpMerchant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKeyHash" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "feeBps" INTEGER NOT NULL DEFAULT 150,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TpMerchant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpPayment" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "description" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "feeMinor" INTEGER NOT NULL DEFAULT 0,
    "netMinor" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'GHS',
    "status" "TpPaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "version" INTEGER NOT NULL DEFAULT 0,
    "network" "TpNetwork",
    "payerPhone" TEXT,
    "providerRef" TEXT,
    "checkoutToken" TEXT NOT NULL,
    "returnUrl" TEXT NOT NULL,
    "failureReason" TEXT,
    "heldAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "autoReleaseAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TpPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpLedgerTxn" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "paymentId" TEXT,
    "type" "TpTxnType" NOT NULL,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TpLedgerTxn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpLedgerEntry" (
    "id" TEXT NOT NULL,
    "txnId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "account" "TpAccount" NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TpLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpPayout" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "network" "TpNetwork" NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "TpPayoutStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TpPayout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpDispute" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "TpDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "TpDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpWebhookEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "paymentId" TEXT,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "TpWebhookStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TpWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpIdempotencyKey" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TpIdempotencyKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TpDemoClock" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "offsetSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TpDemoClock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Order_code_key" ON "Order"("code");

-- CreateIndex
CREATE INDEX "Order_buyerId_createdAt_idx" ON "Order"("buyerId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_createdAt_idx" ON "OrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TpMerchant_apiKeyHash_key" ON "TpMerchant"("apiKeyHash");

-- CreateIndex
CREATE UNIQUE INDEX "TpPayment_checkoutToken_key" ON "TpPayment"("checkoutToken");

-- CreateIndex
CREATE INDEX "TpPayment_merchantId_status_idx" ON "TpPayment"("merchantId", "status");

-- CreateIndex
CREATE INDEX "TpPayment_status_autoReleaseAt_idx" ON "TpPayment"("status", "autoReleaseAt");

-- CreateIndex
CREATE UNIQUE INDEX "TpPayment_merchantId_reference_key" ON "TpPayment"("merchantId", "reference");

-- CreateIndex
CREATE INDEX "TpLedgerTxn_merchantId_createdAt_idx" ON "TpLedgerTxn"("merchantId", "createdAt");

-- CreateIndex
CREATE INDEX "TpLedgerEntry_merchantId_account_idx" ON "TpLedgerEntry"("merchantId", "account");

-- CreateIndex
CREATE INDEX "TpLedgerEntry_txnId_idx" ON "TpLedgerEntry"("txnId");

-- CreateIndex
CREATE INDEX "TpWebhookEvent_status_nextAttemptAt_idx" ON "TpWebhookEvent"("status", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "TpIdempotencyKey_merchantId_key_key" ON "TpIdempotencyKey"("merchantId", "key");

-- AddForeignKey
ALTER TABLE "LoginAttempt" ADD CONSTRAINT "LoginAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderEvent" ADD CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TpPayment" ADD CONSTRAINT "TpPayment_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "TpMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TpLedgerTxn" ADD CONSTRAINT "TpLedgerTxn_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "TpMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TpLedgerTxn" ADD CONSTRAINT "TpLedgerTxn_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "TpPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TpLedgerEntry" ADD CONSTRAINT "TpLedgerEntry_txnId_fkey" FOREIGN KEY ("txnId") REFERENCES "TpLedgerTxn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TpPayout" ADD CONSTRAINT "TpPayout_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "TpMerchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TpDispute" ADD CONSTRAINT "TpDispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "TpPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TpLedgerEntry" ADD CONSTRAINT tp_entry_nonzero CHECK ("amountMinor" <> 0);

CREATE OR REPLACE FUNCTION tp_assert_txn_balanced() RETURNS trigger AS $$
BEGIN
  IF (SELECT COALESCE(SUM("amountMinor"),0) FROM "TpLedgerEntry" WHERE "txnId" = NEW."txnId") <> 0 THEN
    RAISE EXCEPTION 'Ledger transaction % is not balanced', NEW."txnId";
  END IF;
  RETURN NULL;
END; $$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER tp_ledger_balanced AFTER INSERT ON "TpLedgerEntry"
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION tp_assert_txn_balanced();

CREATE OR REPLACE FUNCTION tp_ledger_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'Ledger entries are immutable'; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tp_ledger_no_change BEFORE UPDATE OR DELETE ON "TpLedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION tp_ledger_immutable();

