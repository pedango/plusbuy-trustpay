import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(alphabet, 16);
const tokenAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const tokenId = customAlphabet(tokenAlphabet, 32);

const prefixes = {
  pay: "pay_",
  txn: "txn_",
  ent: "ent_",
  pout: "pout_",
  dsp: "dsp_",
  evt: "evt_",
  idem: "idem_",
  req: "req_",
  mer: "mer_",
} as const;

export type IdPrefix = keyof typeof prefixes;

/** Generate a prefixed id, e.g. `pay_…`, `txn_…`. */
export function newId(prefix: IdPrefix): string {
  return `${prefixes[prefix]}${nanoid()}`;
}

/** 32-char URL-safe checkout token. */
export function newCheckoutToken(): string {
  return tokenId();
}
