export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class OffsetClock implements Clock {
  constructor(
    private readonly base: Clock,
    private readonly getOffsetSeconds: () => Promise<number> | number,
  ) {}

  async nowAsync(): Promise<Date> {
    const offset = await this.getOffsetSeconds();
    return new Date(this.base.now().getTime() + offset * 1000);
  }

  now(): Date {
    const offset = this.getOffsetSeconds();
    if (typeof offset !== "number") {
      throw new Error("OffsetClock.now() requires a sync offset getter; use nowAsync()");
    }
    return new Date(this.base.now().getTime() + offset * 1000);
  }
}

export class FixedClock implements Clock {
  constructor(private current: Date) {}

  now(): Date {
    return new Date(this.current);
  }

  set(date: Date): void {
    this.current = date;
  }

  advanceMs(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
