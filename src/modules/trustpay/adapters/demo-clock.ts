import type { PrismaClient } from "@prisma/client";
import { SystemClock, type Clock } from "@/lib/clock";

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
    const row = await this.db.tpDemoClock.findUnique({ where: { id: 1 } });
    const offsetSeconds = row?.offsetSeconds ?? 0;
    return new Date(this.base.now().getTime() + offsetSeconds * 1000);
  }
}
