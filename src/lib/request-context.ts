import { AsyncLocalStorage } from "node:async_hooks";
import { newId } from "@/lib/ids";

export type RequestContext = {
  requestId: string;
};

const storage = new AsyncLocalStorage<RequestContext>();

export function getRequestId(): string {
  return storage.getStore()?.requestId ?? "req_unknown";
}

export function runWithRequestContext<T>(requestId: string | null | undefined, fn: () => T): T {
  const id = requestId && requestId.trim().length > 0 ? requestId : newId("req");
  return storage.run({ requestId: id }, fn);
}

export function createRequestId(incoming?: string | null): string {
  if (incoming && incoming.trim().length > 0) return incoming;
  return newId("req");
}
