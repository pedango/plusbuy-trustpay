import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

function rel(p: string): string {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function isShopPath(p: string): boolean {
  const r = rel(p);
  return (
    r.startsWith("src/app/(shop)/") ||
    r.startsWith("src/app/(merchant)/") ||
    r.startsWith("src/app/api/shop/") ||
    r.startsWith("src/modules/shop/") ||
    r.startsWith("src/components/shop/") ||
    r.startsWith("src/components/merchant/")
  );
}

function isTrustPayPath(p: string): boolean {
  const r = rel(p);
  return (
    r.startsWith("src/app/trustpay/") ||
    r.startsWith("src/app/api/trustpay/") ||
    r.startsWith("src/modules/trustpay/") ||
    r.startsWith("src/components/trustpay/")
  );
}

function isContractsPath(p: string): boolean {
  return rel(p).startsWith("src/contracts/");
}

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?)\s+from\s+["']([^"']+)["']/g;
const DYNAMIC_RE = /import\(\s*["']([^"']+)["']\s*\)/g;
const PRISMA_TP_RE = /\bprisma\.[tT]p[A-Z]\w*/g;
const TP_MODEL_RE = /\bTp(Merchant|Payment|LedgerTxn|LedgerEntry|Payout|Dispute|WebhookEvent|IdempotencyKey|DemoClock)\b/g;

describe("architecture boundaries", () => {
  const files = walk(SRC);

  it("shop code does not import modules/trustpay or Tp Prisma models", () => {
    const violations: string[] = [];
    for (const file of files.filter(isShopPath)) {
      const src = readFileSync(file, "utf8");
      for (const re of [IMPORT_RE, DYNAMIC_RE]) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          const spec = m[1] ?? "";
          if (spec.includes("modules/trustpay") || spec.includes("@/modules/trustpay")) {
            violations.push(`${rel(file)} imports ${spec}`);
          }
        }
      }
      if (PRISMA_TP_RE.test(src) || TP_MODEL_RE.test(src)) {
        violations.push(`${rel(file)} references Tp* Prisma models`);
      }
    }
    expect(violations).toEqual([]);
  });

  it("trustpay code does not import modules/shop", () => {
    const violations: string[] = [];
    for (const file of files.filter(isTrustPayPath)) {
      const src = readFileSync(file, "utf8");
      for (const re of [IMPORT_RE, DYNAMIC_RE]) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          const spec = m[1] ?? "";
          if (spec.includes("modules/shop") || spec.includes("@/modules/shop")) {
            violations.push(`${rel(file)} imports ${spec}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("contracts only import zod", () => {
    const violations: string[] = [];
    for (const file of files.filter(isContractsPath)) {
      const src = readFileSync(file, "utf8");
      for (const re of [IMPORT_RE, DYNAMIC_RE]) {
        re.lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          const spec = m[1] ?? "";
          if (spec !== "zod") {
            violations.push(`${rel(file)} imports ${spec}`);
          }
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
