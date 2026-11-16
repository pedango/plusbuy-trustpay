import type { Prisma, PrismaClient } from "@prisma/client";
import { SystemClock, type Clock } from "@/lib/clock";

type ClockDb = PrismaClient | Prisma.TransactionClient;

/** Read demo time on the caller’s connection so an open transaction does not wait for another pool slot. */
export async function nowFromClock(db: ClockDb, base = new Date()): Promise<Date> {
  const row = await db.tpDemoClock.findUnique({ where: { id: 1 } });
  return new Date(base.getTime() + (row?.offsetSeconds ?? 0) * 1000);
}

/**
 * TrustPay clock: wall time + `TpDemoClock.offsetSeconds` (id=1).
 * Queries the DB on every `now()` call.
 */
export class DemoClock implements Clock {
  private readonly base: Clock;

  constructor(
    private readonly db: PrismaClient,
    base?: Clock,
  ) {
    this.base = base ?? new SystemClock();
  }

  /**
   * Sync Clock.now() is unsupported (offset is async from DB).
   * Use {@link nowAsync} from TrustPay context helpers instead.
   */
  now(): Date {
    throw new Error("DemoClock.now() is async; use TrustPayContext.now()");
  }

  async nowAsync(): Promise<Date> {
    return nowFromClock(this.db, this.base.now());
  }
}
