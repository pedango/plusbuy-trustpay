import type { TpNetwork } from "@/contracts/trustpay";

const MTN_PREFIXES = new Set(["024", "025", "053", "054", "055", "059"]);
const TELECEL_PREFIXES = new Set(["020", "050"]);
const AIRTELTIGO_PREFIXES = new Set(["026", "027", "056", "057"]);

export type NetworkHint = TpNetwork | "UNKNOWN";

export type NormalizedPhone = {
  e164: string;
  national: string;
  hint: NetworkHint;
};

/**
 * Validate and normalize a Ghana mobile number to E.164 (`+233…`).
 * Accepts `0XXXXXXXXX`, `233XXXXXXXXX`, or `+233XXXXXXXXX`.
 */
export function normalizeGhanaPhone(input: string, expected?: TpNetwork): NormalizedPhone & {
  softNetworkWarning?: string;
} {
  const raw = input.trim().replace(/[\s-]/g, "");
  let digits = raw.startsWith("+") ? raw.slice(1) : raw;

  if (!/^\d+$/.test(digits)) {
    throw invalidPhone(input);
  }

  if (digits.startsWith("233") && digits.length === 12) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length === 10) {
    digits = digits.slice(1);
  } else if (digits.length === 9) {
    // already national without leading 0
  } else {
    throw invalidPhone(input);
  }

  // Ghana mobiles: 9 national digits after country code; leading digit 2 or 5.
  if (!/^[25]\d{8}$/.test(digits)) {
    throw invalidPhone(input);
  }

  const national = `0${digits}`;
  const e164 = `+233${digits}`;
  const hint = hintNetworkFromNational(national);
  const softNetworkWarning =
    expected && hint !== "UNKNOWN" && hint !== expected
      ? `Number prefix is uncommon for ${expected.replaceAll("_", " ")} (number portability applies)`
      : undefined;
  return { e164, national, hint, softNetworkWarning };
}

/** Soft prefix→network hint; never throws. */
export function hintNetwork(phone: string): NetworkHint {
  try {
    return normalizeGhanaPhone(phone).hint;
  } catch {
    const digits = phone.trim().replace(/[\s\-＋+]/g, "");
    let national = digits;
    if (national.startsWith("233") && national.length >= 5) {
      national = `0${national.slice(3)}`;
    } else if (!national.startsWith("0") && national.length === 9) {
      national = `0${national}`;
    }
    return hintNetworkFromNational(national);
  }
}

function hintNetworkFromNational(national: string): NetworkHint {
  const prefix = national.slice(0, 3);
  if (MTN_PREFIXES.has(prefix)) return "MTN_MOMO";
  if (TELECEL_PREFIXES.has(prefix)) return "TELECEL_CASH";
  if (AIRTELTIGO_PREFIXES.has(prefix)) return "AIRTELTIGO_MONEY";
  return "UNKNOWN";
}

function invalidPhone(input: string): Error {
  const err = new Error(`Invalid Ghana phone number: ${input}`);
  (err as Error & { code: string }).code = "invalid_phone";
  return err;
}

export function isValidGhanaPhone(input: string): boolean {
  try {
    normalizeGhanaPhone(input);
    return true;
  } catch {
    return false;
  }
}
