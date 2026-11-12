import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";
import { sha256Hex } from "../src/lib/crypto";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@1234";

const PRODUCTS = [
  {
    name: "Red Cotton Shirt",
    description: "Soft everyday cotton shirt in classic red.",
    priceMinor: 12000,
    colorHex: "#DC2626",
    stock: 25,
  },
  {
    name: "Blue Cotton Shirt",
    description: "Breathable cotton shirt in deep blue.",
    priceMinor: 12000,
    colorHex: "#2563EB",
    stock: 25,
  },
  {
    name: "Kente Print Shirt",
    description: "Bold kente-inspired print for special occasions.",
    priceMinor: 25000,
    colorHex: "#CA8A04",
    stock: 25,
  },
  {
    name: "White Linen Shirt",
    description: "Lightweight linen for warm-weather comfort.",
    priceMinor: 18000,
    colorHex: "#F8FAFC",
    stock: 25,
  },
  {
    name: "Ankara Shirt",
    description: "Vibrant Ankara pattern with a tailored fit.",
    priceMinor: 20000,
    colorHex: "#EA580C",
    stock: 25,
  },
  {
    name: "Black Polo",
    description: "Minimal black polo for casual wear.",
    priceMinor: 9000,
    colorHex: "#171717",
    stock: 25,
  },
] as const;

async function upsertUser(data: {
  email: string;
  name: string;
  role: Role;
  phone?: string;
  passwordHash: string;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    create: {
      email: data.email,
      name: data.name,
      role: data.role,
      phone: data.phone,
      passwordHash: data.passwordHash,
    },
    update: {
      name: data.name,
      role: data.role,
      phone: data.phone,
      passwordHash: data.passwordHash,
    },
  });
}

export async function seedDemo() {
  const apiKey = process.env.TRUSTPAY_API_KEY;
  const webhookSecret = process.env.TRUSTPAY_WEBHOOK_SECRET;
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  if (!apiKey || !webhookSecret) {
    throw new Error("TRUSTPAY_API_KEY and TRUSTPAY_WEBHOOK_SECRET are required for seed");
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  await upsertUser({
    email: "merchant@plusbuy.demo",
    name: "PlusBuy Store",
    role: "MERCHANT",
    passwordHash,
  });

  await upsertUser({
    email: "john@plusbuy.demo",
    name: "John",
    role: "BUYER",
    phone: "0244000000",
    passwordHash,
  });

  await upsertUser({
    email: "admin@trustpay.demo",
    name: "TrustPay Admin",
    role: "TRUSTPAY_ADMIN",
    passwordHash,
  });

  await prisma.tpMerchant.upsert({
    where: { id: "mer_plusbuy" },
    create: {
      id: "mer_plusbuy",
      name: "PlusBuy",
      apiKeyHash: sha256Hex(apiKey),
      webhookUrl: `${appUrl}/api/shop/webhooks/trustpay`,
      webhookSecret,
      feeBps: 150,
    },
    update: {
      name: "PlusBuy",
      apiKeyHash: sha256Hex(apiKey),
      webhookUrl: `${appUrl}/api/shop/webhooks/trustpay`,
      webhookSecret,
      feeBps: 150,
    },
  });

  await prisma.tpDemoClock.upsert({
    where: { id: 1 },
    create: { id: 1, offsetSeconds: 0 },
    update: { offsetSeconds: 0 },
  });

  await prisma.orderSequence.upsert({
    where: { id: 1 },
    create: { id: 1, nextVal: 1000 },
    update: { nextVal: 1000 },
  });

  for (const product of PRODUCTS) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: product.description,
          priceMinor: product.priceMinor,
          colorHex: product.colorHex,
          stock: product.stock,
          active: true,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          priceMinor: product.priceMinor,
          colorHex: product.colorHex,
          stock: product.stock,
          active: true,
        },
      });
    }
  }

  console.log("Seed complete: users, TpMerchant mer_plusbuy, clock, order sequence, 6 products.");
}

const isDirect = process.argv[1]?.replace(/\\/g, "/").includes("prisma/seed");
if (isDirect) {
  seedDemo()
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
