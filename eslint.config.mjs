import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const shopGlobs = [
  "src/app/(shop)/**/*.{ts,tsx}",
  "src/app/(merchant)/**/*.{ts,tsx}",
  "src/app/api/shop/**/*.{ts,tsx}",
  "src/modules/shop/**/*.{ts,tsx}",
  "src/components/shop/**/*.{ts,tsx}",
  "src/components/merchant/**/*.{ts,tsx}",
];

const trustpayGlobs = [
  "src/app/trustpay/**/*.{ts,tsx}",
  "src/app/api/trustpay/**/*.{ts,tsx}",
  "src/modules/trustpay/**/*.{ts,tsx}",
  "src/components/trustpay/**/*.{ts,tsx}",
];

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  eslintConfigPrettier,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  {
    files: shopGlobs,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/modules/trustpay", "**/modules/trustpay/**", "@/modules/trustpay", "@/modules/trustpay/*"],
              message: "Shop code must not import TrustPay modules. Use lib/trustpay-client and contracts/trustpay.",
            },
          ],
        },
      ],
    },
  },
  {
    files: trustpayGlobs,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/modules/shop", "**/modules/shop/**", "@/modules/shop", "@/modules/shop/*"],
              message: "TrustPay code must not import shop modules.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/contracts/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["*", "!zod"],
              message: "contracts/ may only import zod.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
