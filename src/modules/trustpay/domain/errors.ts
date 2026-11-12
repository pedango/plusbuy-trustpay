export type TrustPayErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "invalid_transition"
  | "conflict_retry"
  | "idempotency_key_reuse"
  | "amount_out_of_range"
  | "invalid_phone"
  | "insufficient_available_balance"
  | "payment_expired"
  | "internal_error";

const HTTP_STATUS: Record<TrustPayErrorCode, number> = {
  validation_error: 422,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  invalid_transition: 409,
  conflict_retry: 409,
  idempotency_key_reuse: 422,
  amount_out_of_range: 422,
  invalid_phone: 422,
  insufficient_available_balance: 422,
  payment_expired: 410,
  internal_error: 500,
};

/** Domain error with stable taxonomy code and HTTP status. */
export class TrustPayError extends Error {
  readonly code: TrustPayErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: TrustPayErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "TrustPayError";
    this.code = code;
    this.status = HTTP_STATUS[code];
    this.details = details;
  }
}

export function isTrustPayError(error: unknown): error is TrustPayError {
  return error instanceof TrustPayError;
}
