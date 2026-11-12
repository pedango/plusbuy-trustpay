type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = {
  level?: LogLevel;
  msg: string;
  requestId?: string;
  merchantId?: string;
  paymentId?: string;
  orderId?: string;
  event?: string;
  [key: string]: unknown;
};

function write(level: LogLevel, fields: LogFields): void {
  const { msg, ...rest } = fields;
  const line = JSON.stringify({
    level,
    msg,
    ts: new Date().toISOString(),
    ...rest,
  });

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug(fields: LogFields) {
    write("debug", fields);
  },
  info(fields: LogFields) {
    write("info", fields);
  },
  warn(fields: LogFields) {
    write("warn", fields);
  },
  error(fields: LogFields) {
    write("error", fields);
  },
};
